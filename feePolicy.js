// feePolicy.js

export function isFeeWaived(user, loan, type) {
  // Loan-level override wins
  if (loan?.feePolicy === "all") return true;

  if (loan?.feePolicy === "setup-only") {
    return type === "setup";
  }

  if (loan?.feePolicy === "grace-only") {
    return type === "setup" || type === "servicing";
  }

  // User-level default
  const p = user?.feePolicy || "none";

  if (p === "all") return true;
  if (p === "setup-only" && type === "setup") return true;
  if (p === "grace-only" && (type === "setup" || type === "servicing")) return true;

  return false;
}
