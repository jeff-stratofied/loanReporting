function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://jeff-stratofied.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function withCORS(res) {
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) =>
    headers.set(k, v)
  );

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers
  });
}


const workerRequest = (...args) => globalThis.fetch(...args);

/**
 * Load loans from GitHub
 */
async function loadLoans() {
  const url =
    "https://raw.githubusercontent.com/jeff-stratofied/loanreporting/main/data/loans.json";

  const res = await workerRequest(url);
  if (!res.ok) {
    throw new Error(
      `GitHub fetch failed: ${res.status} ${res.statusText}`
    );
  }

  const raw = await res.json();

  return (raw.loans || raw).map(l => ({
    id: l.loanId ?? l.id,
    name: l.loanName ?? l.name,
    school: l.school,
    purchaseDate: l.purchaseDate,
    loanStartDate: l.loanStartDate,
    purchasePrice: Number(l.principal ?? l.purchasePrice),
    nominalRate: Number(l.rate ?? l.nominalRate),
    termYears: Number(l.termYears),
    graceYears: Number(l.graceYears)
  }));
}

/**
 * Main fetch handler
 */
async function handleFetch(request) {

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const url = new URL(request.url);

    if (url.pathname === "/platformConfig") {

      if (request.method === "GET") {
        const res = await fetch(
          "https://raw.githubusercontent.com/jeff-stratofied/loanreporting/main/data/platformConfig.json",
          { cache: "no-store" }
        );

        if (!res.ok) {
          return withCORS(
            new Response("Failed to load platform config", { status: 500 })
          );
        }

        return withCORS(
          new Response(await res.text(), {
            headers: { "Content-Type": "application/json" }
          })
        );
      }

      if (request.method === "POST") {
        const body = await request.json();

        return withCORS(
          await saveJsonToGitHub({
            path: "data/platformConfig.json",
            content: JSON.stringify(body, null, 2),
            message: "Update platform config"
          })
        );
      }

      return withCORS(
        new Response("Method not allowed", { status: 405 })
      );
    }

    const loans = await loadLoans();
    return withCORS(Response.json(loans));

  } catch (err) {
    return withCORS(
      new Response("Worker error: " + err.message, { status: 500 })
    );
  }
}



export default { fetch: handleFetch };
