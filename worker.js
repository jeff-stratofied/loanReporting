// worker.js — updated to use env bindings

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "https://jeff-stratofied.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function withCORS(res) {
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
  headers.set("X-Debug-Worker", "platformConfig-v4");  // Bump for debugging
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

const GITHUB_API_BASE = `https://api.github.com/repos`;

async function loadFromGitHub(env, path) {
  const url = `${GITHUB_API_BASE}/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker',
      'Accept': 'application/vnd.github.v3+json'
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub GET failed for ${path}: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const content = JSON.parse(atob(data.content));
  return { content, sha: data.sha };
}

async function saveJsonToGitHub(env, { path, content, message, sha: providedSha }) {
  const url = `${GITHUB_API_BASE}/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`;
  const headers = {
    'Authorization': `token ${env.GITHUB_TOKEN}`,
    'User-Agent': 'Cloudflare-Worker',
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json'
  };

  let currentSha = providedSha;
  if (!currentSha) {
    const getRes = await fetch(url, { headers });
    if (!getRes.ok) {
      const errText = await getRes.text();
      throw new Error(`GitHub HEAD/GET for SHA failed: ${getRes.status} - ${errText}`);
    }
    const getData = await getRes.json();
    currentSha = getData.sha;
  }

  const body = {
    message,
    content: btoa(content),
    sha: currentSha
  };

  const putRes = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub PUT failed for ${path}: ${putRes.status} - ${errText}`);
  }

  const putData = await putRes.json();
  return new Response(JSON.stringify({ sha: putData.content.sha }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleFetch(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const url = new URL(request.url);

    if (url.pathname === "/loans") {
      if (request.method === "GET") {
        const { content, sha } = await loadFromGitHub(env, env.GITHUB_FILE_PATH || "data/loans.json");
        return withCORS(Response.json({ loans: content.loans || content, sha }));
      }

      if (request.method === "POST") {
        const body = await request.json();
        const contentStr = JSON.stringify({ loans: body.loans }, null, 2);
        return withCORS(await saveJsonToGitHub(env, {
          path: env.GITHUB_FILE_PATH || "data/loans.json",
          content: contentStr,
          message: "Update loans via admin",
          sha: body.sha
        }));
      }

      return withCORS(new Response("Method not allowed", { status: 405 }));
    }

    if (url.pathname === "/platformConfig") {
      if (request.method === "GET") {
        const { content, sha } = await loadFromGitHub(env, "data/platformConfig.json");  // Hardcoded for config; add var if needed
        return withCORS(Response.json({ ...content, sha }));
      }

      if (request.method === "POST") {
        const body = await request.json();
        const contentStr = JSON.stringify(body, null, 2);
        return withCORS(await saveJsonToGitHub(env, {
          path: "data/platformConfig.json",
          content: contentStr,
          message: "Update platform config via admin"
          // sha fetched inside saveJsonToGitHub if not provided
        }));
      }

      return withCORS(new Response("Method not allowed", { status: 405 }));
    }

    return withCORS(new Response("Not found", { status: 404 }));
  } catch (err) {
    console.error('Worker error:', err.message, err.stack);
    return withCORS(new Response(
      `Worker error: ${err.message}\nStack: ${err.stack || 'N/A'}`,
      { status: 500 }
    ));
  }
}

export default { fetch: handleFetch };
