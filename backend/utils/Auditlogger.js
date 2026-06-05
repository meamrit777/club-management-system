import AuditLog from "../models/AuditLogModel.js";

/**
 * auditLog
 * Records a sensitive admin action to the AuditLog collection.
 *
 * Call this from controllers AFTER a successful operation.
 * A failure here must NEVER crash or roll back the main operation —
 * audit logging is best-effort (errors are swallowed and console-warned).
 *
 * @param {Object}   params
 * @param {string}   params.action        Short uppercase identifier, e.g. "LOAN_APPROVED"
 * @param {ObjectId} params.performedBy   _id of the admin/super_admin who acted
 * @param {string}   params.targetType    Mongoose model name, e.g. "Loan", "User"
 * @param {ObjectId} [params.targetId]    _id of the record that was affected
 * @param {string}   [params.targetLabel] Human-readable label, e.g. "Loan ₹50,000 — Milan Shrestha"
 * @param {*}        [params.oldValue]    State before the change (plain object or null)
 * @param {*}        [params.newValue]    State after the change (plain object or null)
 * @param {string}   [params.note]        Free-text explanation
 * @param {Object}   [params.req]         Express request object — used to extract IP and User-Agent
 *
 * @returns {Promise<void>}
 *
 * @example
 *   await auditLog({
 *     action:       "LOAN_APPROVED",
 *     performedBy:  req.user._id,
 *     targetType:   "Loan",
 *     targetId:     loan._id,
 *     targetLabel:  `₹${loan.principal} — ${member.name}`,
 *     oldValue:     { status: "pending" },
 *     newValue:     { status: "active", disbursedDate },
 *     req,
 *   });
 */
export async function auditLog({
  action,
  performedBy,
  targetType,
  targetId = null,
  targetLabel = null,
  oldValue = null,
  newValue = null,
  note = null,
  req = null,
}) {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetType,
      targetId,
      targetLabel,
      oldValue,
      newValue,
      note,
      ipAddress: req ? extractIP(req) : null,
      userAgent: req ? req.get("User-Agent") || null : null,
      timestamp: new Date(),
    });
  } catch (err) {
    // Audit log failure is non-fatal — log to console but do not throw
    console.warn("⚠️  [auditLog] Failed to write audit entry:", err.message);
    console.warn("   Action:", action, "| Target:", targetType, targetId?.toString());
  }
}

// ─── Helper: extract client IP from request ───────────────────────────────
function extractIP(req) {
  // Handles cases where the server is behind a proxy (Nginx, AWS ALB, etc.)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list — first entry is the real client IP
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || null;
}
