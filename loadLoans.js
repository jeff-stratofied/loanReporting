// loadLoans.js

const API_URL = "https://loanreporting-api.jeff-263.workers.dev/loans";

// ===============================
// loadLoans.js  (API fetch only)
// ===============================

// Fetch loans from Cloudflare Worker
export async function loadLoans() {
  const url = "https://loanreporting-api.jeff-263.workers.dev/loans";

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error("Fetch failed:", res.status, res.statusText);
      return { loans: [], sha: null };
    }

    const data = await res.json();

    console.log("RAW API RESPONSE SHAPE:", {
    hasLoansKey: "loans" in data,
    loansCount: data.loans?.length ?? "no loans array",
    firstLoanKeys: data.loans?.[0] ? Object.keys(data.loans[0]) : "empty",
    firstLoanSample: data.loans?.[0] ? {
      loanId: data.loans[0].loanId,
      loanName: data.loans[0].loanName,
      school: data.loans[0].school,
      principal: data.loans[0].principal,
      rate: data.loans[0].rate,
      loanStartDate: data.loans[0].loanStartDate
    } : "no first loan"
  });

  if (Array.isArray(data.loans)) {
    return data;
  }

    // Worker returns: { loans:[...], sha:"..." }
    if (Array.isArray(data.loans)) {
      return data;        // <-- CORRECT
    }

    console.warn("Unexpected API shape:", data);
    return { loans: [], sha: null };

  } catch (err) {
    console.error("API error:", err);
    return { loans: [], sha: null };
  }
}





// ----------------------------------------------------
// SAVE loans  (POST { loans, sha })
// ----------------------------------------------------
export async function saveLoans(loans, sha) {
  const payload = { loans };
  if (sha) payload.sha = sha;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Save API Error:", res.status, text);
    throw new Error(`Save error: ${res.status}`);
  }

  return await res.json();  // includes content.sha
}
