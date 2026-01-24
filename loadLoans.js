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
      return [];
    }

    const data = await res.json();

    // Worker returns: { loans:[...], sha:"..." }
    if (Array.isArray(data.loans)) {
      // expose sha for save flows / debugging
  window.__LOANS_SHA__ = data.sha || null;

  // ALWAYS return array
  return data.loans;
}

    console.warn("Unexpected API shape:", data);
    return [];

  } catch (err) {
    console.error("API error:", err);
    return [];
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

window.loadLoans = loadLoans;

