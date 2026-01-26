// ===================================================
// Platform Config (single source of truth)
// ===================================================

export let PLATFORM_CONFIG = {
  fees: {
    setupFee: 150,
    monthlyServicingBps: 25
  },
  users: {}
};

// ----------------------------------
// Load platform config from GitHub
// ----------------------------------
export async function loadPlatformConfig(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load platform config: ${res.status}`);
  }

  const cfg = await res.json();

  // Merge (do not replace object reference)
  PLATFORM_CONFIG.fees = cfg.fees || PLATFORM_CONFIG.fees;
  PLATFORM_CONFIG.users = cfg.users || {};
}

// ----------------------------------
// Save platform config back to GitHub
// (ADMIN ONLY)
// ----------------------------------
export async function savePlatformConfig() {
  if (!window.saveToBackend) {
    console.warn("saveToBackend not available (read-only page)");
    return;
  }

  return window.saveToBackend(
    "platformConfig.json",
    JSON.stringify(PLATFORM_CONFIG, null, 2),
    "Update platform config"
  );
}
