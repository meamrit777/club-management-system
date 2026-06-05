import asyncHandler from "express-async-handler";
import Installment from "../models/InstallmentModel.js";
import Loan from "../models/LoanModel.js";
import Transaction from "../models/TransactionModel.js";
import { auditLog } from "../utils/auditLogger.js";
import {
  calculateEMI,
  generateAmortizationSchedule,
  getRemainingBalance,
} from "../utils/emiCalculator.js";

const DEFAULT_RATE = parseFloat(process.env.DEFAULT_INTEREST_RATE || 15);
const VALID_TENURES = [6, 12, 18, 24];

/**
 * @desc    Get all loans (admins see all; members see own)
 * @route   GET /api/loans
 * @access  Private
 */
export const getLoans = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, memberId } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user.role === "member") filter.memberId = req.user._id;
  else if (memberId) filter.memberId = memberId;
  if (status) filter.status = status;

  const [loans, total] = await Promise.all([
    Loan.find(filter)
      .populate("memberId", "name email phone memberNumber")
      .populate("approvedBy", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Loan.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: loans,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

/**
 * @desc    Get a single loan with full installment schedule
 * @route   GET /api/loans/:id
 * @access  Private
 */
export const getLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id)
    .populate("memberId", "name email phone memberNumber")
    .populate("approvedBy", "name role")
    .populate("previousLoanId");

  if (!loan) throw new Error("Loan not found");

  if (req.user.role === "member" && loan.memberId._id.toString() !== req.user._id.toString())
    throw new Error("Access denied");

  const installments = await Installment.find({ loanId: loan._id }).sort({
    installmentNumber: 1,
  });

  res.status(200).json({ success: true, data: { loan, installments } });
});

/**
 * @desc    Apply for a new loan (members apply for themselves; admin applies on behalf)
 * @route   POST /api/loans/apply
 * @access  Private
 */
export const applyForLoan = asyncHandler(async (req, res) => {
  const { memberId, principal, tenureMonths, notes } = req.body;

  const targetId = req.user.role === "member" ? req.user._id : memberId;
  if (!targetId) throw new Error("memberId is required");
  if (!principal) throw new Error("principal is required");
  if (!VALID_TENURES.includes(Number(tenureMonths)))
    throw new Error("Tenure must be 6, 12, 18, or 24 months");

  const [activeLoan, pendingLoan] = await Promise.all([
    Loan.findOne({ memberId: targetId, status: "active" }),
    Loan.findOne({ memberId: targetId, status: "pending" }),
  ]);

  if (activeLoan)
    throw new Error("Member already has an active loan. Use top-up or close it first.");
  if (pendingLoan) throw new Error("Member already has a pending loan application.");

  const { emi, totalPayable, totalInterest } = calculateEMI(
    Number(principal),
    DEFAULT_RATE,
    Number(tenureMonths),
  );

  const loan = await Loan.create({
    memberId: targetId,
    principal: Number(principal),
    interestRate: DEFAULT_RATE,
    tenureMonths: Number(tenureMonths),
    emi,
    totalPayable,
    totalInterest,
    status: "pending",
    appliedBy: req.user.role !== "member" ? req.user._id : null,
    notes,
  });

  await auditLog({
    action: "LOAN_APPLIED",
    performedBy: req.user._id,
    targetType: "Loan",
    targetId: loan._id,
    targetLabel: `₹${principal} for member ${targetId}`,
    newValue: { principal, tenureMonths, emi },
    req,
  });

  res.status(201).json({ success: true, data: loan });
});

/**
 * @desc    Approve loan — generates full amortization schedule + disburses
 * @route   PUT /api/loans/:id/approve
 * @access  Admin, Super Admin
 */
export const approveLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "pending") throw new Error("Only pending loans can be approved");

  const disburseDate = req.body.disbursedDate ? new Date(req.body.disbursedDate) : new Date();
  const expectedCloseDate = new Date(disburseDate);
  expectedCloseDate.setMonth(expectedCloseDate.getMonth() + loan.tenureMonths);

  loan.status = "active";
  loan.disbursedDate = disburseDate;
  loan.expectedCloseDate = expectedCloseDate;
  loan.approvedBy = req.user._id;
  await loan.save();

  // Generate and persist full amortization schedule
  const schedule = generateAmortizationSchedule(
    loan.principal,
    loan.interestRate,
    loan.tenureMonths,
    disburseDate,
    loan._id,
    loan.memberId,
  );
  await Installment.insertMany(schedule);

  // Record disbursement in immutable ledger
  const txn = await Transaction.create({
    type: "LOAN_DISBURSED",
    amount: loan.principal,
    direction: "out",
    memberId: loan.memberId,
    loanId: loan._id,
    date: disburseDate,
    paymentMethod: req.body.paymentMethod || "cash",
    recordedBy: req.user._id,
    note: "Loan approved and disbursed",
  });

  loan.disbursementTransactionId = txn._id;
  await loan.save();

  await auditLog({
    action: "LOAN_APPROVED",
    performedBy: req.user._id,
    targetType: "Loan",
    targetId: loan._id,
    targetLabel: `₹${loan.principal} — member ${loan.memberId}`,
    newValue: { status: "active", disbursedDate: disburseDate },
    req,
  });

  const installments = await Installment.find({ loanId: loan._id }).sort({ installmentNumber: 1 });
  res.status(200).json({ success: true, data: { loan, installments } });
});

/**
 * @desc    Reject a pending loan application
 * @route   PUT /api/loans/:id/reject
 * @access  Admin, Super Admin
 */
export const rejectLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "pending") throw new Error("Only pending loans can be rejected");

  loan.status = "rejected";
  loan.rejectionReason = req.body.reason || "No reason provided";
  loan.approvedBy = req.user._id;
  await loan.save();

  await auditLog({
    action: "LOAN_REJECTED",
    performedBy: req.user._id,
    targetType: "Loan",
    targetId: loan._id,
    note: loan.rejectionReason,
    req,
  });

  res.status(200).json({ success: true, data: loan });
});

/**
 * @desc    Record an EMI repayment for a specific installment
 * @route   POST /api/loans/:id/repay
 * @access  Admin, Super Admin
 */
export const recordRepayment = asyncHandler(async (req, res) => {
  const { installmentId, paidAmount, paymentMethod, paidDate, notes } = req.body;

  if (!installmentId || !paidAmount || !paymentMethod)
    throw new Error("installmentId, paidAmount, and paymentMethod are required");

  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "active") throw new Error("Loan is not active");

  const installment = await Installment.findOne({
    _id: installmentId,
    loanId: loan._id,
  });
  if (!installment) throw new Error("Installment not found for this loan");
  if (installment.status === "paid") throw new Error("This installment is already paid");

  const actualDate = paidDate ? new Date(paidDate) : new Date();
  const isFull = Number(paidAmount) >= installment.emiAmount;

  installment.paidAmount = Number(paidAmount);
  installment.paidDate = actualDate;
  installment.status = isFull ? "paid" : "partial";
  installment.shortfallAmount = Math.max(0, installment.emiAmount - Number(paidAmount));
  installment.paymentMethod = paymentMethod;
  installment.confirmedBy = req.user._id;
  if (notes) installment.notes = notes;

  // Record in immutable ledger
  const txn = await Transaction.create({
    type: "LOAN_REPAYMENT",
    amount: Number(paidAmount),
    direction: "in",
    memberId: loan.memberId,
    loanId: loan._id,
    installmentId: installment._id,
    principalComponent: Math.min(installment.principalPortion, Number(paidAmount)),
    interestComponent: Math.max(0, Number(paidAmount) - installment.principalPortion),
    date: actualDate,
    paymentMethod,
    recordedBy: req.user._id,
    note: notes,
  });

  installment.transactionId = txn._id;
  await installment.save();

  // Auto-close loan when all installments are settled
  const remaining = await Installment.countDocuments({
    loanId: loan._id,
    status: { $in: ["pending", "partial", "overdue"] },
  });

  if (remaining === 0) {
    loan.status = "closed";
    loan.actualCloseDate = actualDate;
    await loan.save();

    await auditLog({
      action: "LOAN_AUTO_CLOSED",
      performedBy: req.user._id,
      targetType: "Loan",
      targetId: loan._id,
      note: "All EMIs paid",
      req,
    });
  }

  await auditLog({
    action: "LOAN_REPAYMENT_RECORDED",
    performedBy: req.user._id,
    targetType: "Installment",
    targetId: installment._id,
    targetLabel: `EMI #${installment.installmentNumber} — ₹${paidAmount}`,
    req,
  });

  res.status(200).json({ success: true, data: { installment, loanStatus: loan.status } });
});

/**
 * @desc    Close loan early — member pays remaining principal only (no future interest)
 * @route   PUT /api/loans/:id/early-close
 * @access  Admin, Super Admin
 */
export const earlyCloseLoan = asyncHandler(async (req, res) => {
  const { paymentMethod, closureDate, notes } = req.body;

  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new Error("Loan not found");
  if (loan.status !== "active") throw new Error("Only active loans can be closed early");

  const installments = await Installment.find({ loanId: loan._id }).sort({ installmentNumber: 1 });
  const { remainingPrincipal } = getRemainingBalance(installments);

  const actualDate = closureDate ? new Date(closureDate) : new Date();

  // Cancel all pending installments
  await Installment.updateMany(
    { loanId: loan._id, status: { $in: ["pending", "overdue"] } },
    { status: "paid", paidDate: actualDate, paidAmount: 0, notes: "Settled via early closure" },
  );

  await Transaction.create({
    type: "LOAN_CLOSED_EARLY",
    amount: remainingPrincipal,
    direction: "in",
    memberId: loan.memberId,
    loanId: loan._id,
    date: actualDate,
    paymentMethod,
    recordedBy: req.user._id,
    note: notes || "Early loan closure",
  });

  loan.status = "early_closed";
  loan.actualCloseDate = actualDate;
  loan.earlyClosureAmount = remainingPrincipal;
  await loan.save();

  await auditLog({
    action: "LOAN_EARLY_CLOSED",
    performedBy: req.user._id,
    targetType: "Loan",
    targetId: loan._id,
    targetLabel: `Early closure — ₹${remainingPrincipal} received`,
    req,
  });

  res.status(200).json({ success: true, data: { loan, amountPaid: remainingPrincipal } });
});

/**
 * @desc    Top-up an active loan — closes old loan, creates new one
 *          New Principal = Old remaining balance + requested new amount
 * @route   POST /api/loans/:id/topup
 * @access  Admin, Super Admin
 */
export const topUpLoan = asyncHandler(async (req, res) => {
  const { newAmount, tenureMonths, paymentMethod, notes } = req.body;

  if (!newAmount) throw new Error("newAmount is required");
  if (!VALID_TENURES.includes(Number(tenureMonths)))
    throw new Error("Tenure must be 6, 12, 18, or 24 months");

  const oldLoan = await Loan.findById(req.params.id);
  if (!oldLoan) throw new Error("Loan not found");
  if (oldLoan.status !== "active") throw new Error("Only active loans can be topped up");

  const installments = await Installment.find({ loanId: oldLoan._id }).sort({
    installmentNumber: 1,
  });
  const { remainingPrincipal } = getRemainingBalance(installments);

  const newPrincipal = remainingPrincipal + Number(newAmount);
  const { emi, totalPayable, totalInterest } = calculateEMI(
    newPrincipal,
    DEFAULT_RATE,
    Number(tenureMonths),
  );
  const disburseDate = new Date();
  const expectedCloseDate = new Date(disburseDate);
  expectedCloseDate.setMonth(expectedCloseDate.getMonth() + Number(tenureMonths));

  // ── Step 1: Close old loan
  oldLoan.status = "topup_closed";
  oldLoan.actualCloseDate = disburseDate;
  await oldLoan.save();

  await Installment.updateMany(
    { loanId: oldLoan._id, status: { $in: ["pending", "overdue"] } },
    { status: "paid", notes: "Closed via top-up" },
  );

  await Transaction.create({
    type: "LOAN_TOPUP_CLOSE",
    amount: remainingPrincipal,
    direction: "in",
    memberId: oldLoan.memberId,
    loanId: oldLoan._id,
    date: disburseDate,
    paymentMethod: "internal",
    recordedBy: req.user._id,
    note: `Top-up: ₹${remainingPrincipal} old balance rolled into new loan`,
  });

  // ── Step 2: Create new top-up loan
  const newLoan = await Loan.create({
    memberId: oldLoan.memberId,
    principal: newPrincipal,
    interestRate: DEFAULT_RATE,
    tenureMonths: Number(tenureMonths),
    emi,
    totalPayable,
    totalInterest,
    status: "active",
    disbursedDate: disburseDate,
    expectedCloseDate,
    isTopUp: true,
    previousLoanId: oldLoan._id,
    previousLoanRemainingBalance: remainingPrincipal,
    newAmountRequested: Number(newAmount),
    approvedBy: req.user._id,
    notes,
  });

  const schedule = generateAmortizationSchedule(
    newPrincipal,
    DEFAULT_RATE,
    Number(tenureMonths),
    disburseDate,
    newLoan._id,
    newLoan.memberId,
  );
  await Installment.insertMany(schedule);

  // Only the NEW additional amount is an outflow
  await Transaction.create({
    type: "LOAN_DISBURSED",
    amount: Number(newAmount),
    direction: "out",
    memberId: newLoan.memberId,
    loanId: newLoan._id,
    date: disburseDate,
    paymentMethod: paymentMethod || "cash",
    recordedBy: req.user._id,
    note: `Top-up disbursement — additional ₹${newAmount}`,
  });

  await auditLog({
    action: "LOAN_TOPUP",
    performedBy: req.user._id,
    targetType: "Loan",
    targetId: newLoan._id,
    targetLabel: `Old ₹${remainingPrincipal} + New ₹${newAmount} = ₹${newPrincipal}`,
    oldValue: { loanId: oldLoan._id, remainingPrincipal },
    newValue: { loanId: newLoan._id, principal: newPrincipal, emi },
    req,
  });

  const newInstallments = await Installment.find({ loanId: newLoan._id }).sort({
    installmentNumber: 1,
  });
  res
    .status(201)
    .json({ success: true, data: { oldLoan, newLoan, installments: newInstallments } });
});

/**
 * @desc    Preview EMI before applying (no data changes)
 * @route   GET /api/loans/emi-preview
 * @access  Private
 */
export const emiPreview = asyncHandler(async (req, res) => {
  const { principal, tenureMonths, interestRate = DEFAULT_RATE } = req.query;

  if (!principal || !tenureMonths) throw new Error("principal and tenureMonths are required");
  if (!VALID_TENURES.includes(Number(tenureMonths)))
    throw new Error("Tenure must be 6, 12, 18, or 24 months");

  const result = calculateEMI(Number(principal), Number(interestRate), Number(tenureMonths));

  res.status(200).json({ success: true, data: result });
});

/**
 * @desc    Mark overdue installments (run as a scheduled job or manual trigger)
 * @route   POST /api/loans/mark-overdue
 * @access  Admin, Super Admin
 */
export const markOverdueInstallments = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await Installment.updateMany(
    { status: "pending", dueDate: { $lt: today } },
    { status: "overdue" },
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} installments marked overdue`,
    data: { modifiedCount: result.modifiedCount },
  });
});
