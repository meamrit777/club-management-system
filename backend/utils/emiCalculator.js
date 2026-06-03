/**
 * All financial mathematics for the Darbung Youth Club.
 *
 * Every exported function is pure (no DB calls, no side effects).
 * Import only what you need:
 *
 *   import {
 *     calculateEMI,
 *     generateAmortizationSchedule,
 *     getRemainingBalance,
 *     calculateContributionPenalty,
 *     calculateEntryFee,
 *   } from "../utils/emiCalculator.js";
 */

// ─────────────────────────────────────────────────────────────────────────────

/**
 * calculateEMI
 * Computes the fixed monthly EMI using the reducing-balance (flat-reducing) method.
 *
 * Formula:
 *   EMI = P × r × (1 + r)^n
 *         ─────────────────
 *           (1 + r)^n − 1
 *
 *   where:
 *     P = principal
 *     r = monthly interest rate = annualRate / 12 / 100
 *     n = tenure in months
 *
 * @param {number} principal   Loan amount in ₹
 * @param {number} annualRate  Annual interest rate as a percentage (e.g., 15 for 15%)
 * @param {number} months      Tenure in months — must be one of: 6, 12, 18, 24
 *
 * @returns {{ emi: number, totalPayable: number, totalInterest: number }}
 *
 * @example
 *   calculateEMI(100000, 15, 12)
 *   // → { emi: 9025.83, totalPayable: 108309.96, totalInterest: 8309.96 }
 */
export function calculateEMI(principal, annualRate, months) {
  const r = annualRate / 12 / 100; // monthly rate as a decimal

  let emi;
  if (r === 0) {
    // Zero-interest edge case
    emi = principal / months;
  } else {
    const compoundFactor = Math.pow(1 + r, months);
    emi = (principal * r * compoundFactor) / (compoundFactor - 1);
  }

  const emiRounded = round2(emi);
  const totalPayable = round2(emiRounded * months);
  const totalInterest = round2(totalPayable - principal);

  return {
    emi: emiRounded,
    totalPayable,
    totalInterest,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * generateAmortizationSchedule
 * Builds the full month-by-month repayment table for a loan.
 * The result is saved directly into the Installment collection at loan creation.
 *
 * How reducing-balance works per installment:
 *   interest = openingBalance × monthlyRate
 *   principal = EMI − interest
 *   closingBalance = openingBalance − principal
 *
 * The last installment clears any rounding residue so the balance hits exactly 0.
 *
 * @param {number}   principal     Loan amount in ₹
 * @param {number}   annualRate    Annual interest rate (e.g., 15)
 * @param {number}   months        Tenure in months
 * @param {Date}     disbursedDate Date the loan was disbursed
 * @param {ObjectId} loanId        Loan._id (string or ObjectId)
 * @param {ObjectId} memberId      User._id (string or ObjectId)
 *
 * @returns {Array<Object>}  Array of installment objects ready for Installment.insertMany()
 */
export function generateAmortizationSchedule(
  principal,
  annualRate,
  months,
  disbursedDate,
  loanId,
  memberId,
) {
  const { emi } = calculateEMI(principal, annualRate, months);
  const r = annualRate / 12 / 100;

  const schedule = [];
  let outstandingPrincipal = principal;

  for (let i = 1; i <= months; i++) {
    const openingBalance = outstandingPrincipal;
    const interestPortion = round2(openingBalance * r);

    let principalPortion;
    let emiAmount;

    if (i === months) {
      // Last installment: clear any rounding residue completely
      principalPortion = round2(openingBalance);
      emiAmount = round2(principalPortion + interestPortion);
    } else {
      principalPortion = round2(emi - interestPortion);
      emiAmount = emi;
    }

    outstandingPrincipal = round2(Math.max(0, openingBalance - principalPortion));

    // Due date = disbursedDate shifted forward by i months
    // Preserves the same calendar day (e.g., disbursed on the 10th → due on the 10th each month)
    const dueDate = new Date(disbursedDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      loanId,
      memberId,
      installmentNumber: i,
      dueDate,
      openingBalance,
      emiAmount,
      principalPortion,
      interestPortion,
      remainingBalanceAfter: outstandingPrincipal,
      status: "pending",
    });
  }

  return schedule;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * getRemainingBalance
 * Calculates the outstanding principal on an active loan,
 * used for two scenarios:
 *   1. Early closure → member pays this amount, no future interest charged.
 *   2. Top-up       → this amount becomes part of the new loan's principal.
 *
 * Logic:
 *   If nothing has been paid yet     → remaining = original principal (first row's openingBalance)
 *   If some installments are paid    → remaining = remainingBalanceAfter of the last PAID installment
 *
 * @param {Array<Object>} installments  All Installment documents for the loan (any order)
 *
 * @returns {{
 *   remainingPrincipal: number,
 *   paidCount:          number,
 *   pendingCount:       number,
 *   totalInstallments:  number,
 *   progressPercent:    number,
 * }}
 */
export function getRemainingBalance(installments) {
  const sorted = [...installments].sort((a, b) => a.installmentNumber - b.installmentNumber);

  const paid = sorted.filter((i) => ["paid", "partial"].includes(i.status));
  const pending = sorted.filter((i) => ["pending", "overdue"].includes(i.status));

  let remainingPrincipal;

  if (paid.length === 0) {
    // Nothing paid yet — remaining = full principal
    remainingPrincipal = sorted[0]?.openingBalance ?? 0;
  } else {
    // Remaining = balance after the last successfully paid installment
    const lastPaid = paid[paid.length - 1];
    remainingPrincipal = lastPaid.remainingBalanceAfter;
  }

  const total = sorted.length;
  const progressPercent = total > 0 ? round2((paid.length / total) * 100) : 0;

  return {
    remainingPrincipal: round2(remainingPrincipal),
    paidCount: paid.length,
    pendingCount: pending.length,
    totalInstallments: total,
    progressPercent,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * calculateContributionPenalty
 * Computes the penalty rupee amount on an unpaid or partially paid contribution.
 *
 * Formula (simple interest on unpaid amount):
 *   penalty = unpaidAmount × (penaltyRate / 12 / 100) × monthsOverdue
 *
 * The penalty is charged on the UNPAID portion only (not the full amountDue if partial).
 *
 * @param {number} unpaidAmount   The contribution amount that remains unpaid
 * @param {number} penaltyRate    Annual penalty rate as a % (e.g., 20 for 20%)
 * @param {number} monthsOverdue  How many months the amount has been outstanding
 *
 * @returns {number}  Penalty amount in ₹ (rounded to 2 decimal places)
 *
 * @example
 *   calculateContributionPenalty(2000, 20, 3)
 *   // → 100  (2000 × 20/12/100 × 3 = 100)
 */
export function calculateContributionPenalty(unpaidAmount, penaltyRate, monthsOverdue) {
  if (unpaidAmount <= 0 || monthsOverdue <= 0) return 0;
  const monthlyRate = penaltyRate / 12 / 100;
  return round2(unpaidAmount * monthlyRate * monthsOverdue);
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * calculateEntryFee
 * Calculates what a new member must pay to join the club.
 *
 * Formula (from design doc):
 *   Individual Share = Total Pool Value ÷ Current Member Count
 *   Premium Amount   = Individual Share × (premiumPercent / 100)
 *   Entry Fee        = Individual Share + Premium Amount
 *
 * The premium (default 10%) compensates existing members for the returns
 * they have already generated inside the pool.
 *
 * @param {number} totalPoolValue    Current total pool value in ₹
 * @param {number} currentMembers    Number of existing active members
 * @param {number} [premiumPercent]  Premium % on top of the share (default: 10)
 *
 * @returns {{
 *   individualShare: number,
 *   premiumAmount:   number,
 *   entryFee:        number,
 * }}
 *
 * @example
 *   calculateEntryFee(2000000, 25)
 *   // → { individualShare: 80000, premiumAmount: 8000, entryFee: 88000 }
 */
export function calculateEntryFee(totalPoolValue, currentMembers, premiumPercent = 10) {
  if (currentMembers <= 0) {
    throw new Error("currentMembers must be greater than 0");
  }

  const individualShare = round2(totalPoolValue / currentMembers);
  const premiumAmount = round2((individualShare * premiumPercent) / 100);
  const entryFee = round2(individualShare + premiumAmount);

  return {
    individualShare,
    premiumAmount,
    entryFee,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * getMonthsBetween
 * Counts how many full calendar months lie between two YYYY-MM strings.
 * Useful for penalty calculation when you know the cycle month and today's month.
 *
 * @param {string} fromMonth  Earlier month in YYYY-MM format
 * @param {string} toMonth    Later month in YYYY-MM format (defaults to current month)
 *
 * @returns {number}  Number of months (minimum 0)
 *
 * @example
 *   getMonthsBetween("2025-01", "2025-04")  // → 3
 */
export function getMonthsBetween(fromMonth, toMonth = null) {
  const now = toMonth || getCurrentYearMonth();
  const [fy, fm] = fromMonth.split("-").map(Number);
  const [ty, tm] = now.split("-").map(Number);
  const months = (ty - fy) * 12 + (tm - fm);
  return Math.max(0, months);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers (not exported)
// ─────────────────────────────────────────────────────────────────────────────

/** Round to 2 decimal places */
function round2(value) {
  return Math.round(value * 100) / 100;
}

/** Get current YYYY-MM string */
function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
