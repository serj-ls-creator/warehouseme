/**
 * Warm the service-worker cache with a list of URLs (e.g. item photos).
 * Uses the Cache API directly so images are available offline even if
 * the user hasn't scrolled to them yet.
 */
export const precacheUrls = async (urls: string[]) => {
  if (!("caches" in window) || urls.length === 0) return;
  try {
    const cache = await caches.open("supabase-storage");
    const existing = await cache.keys();
    const cached = new Set(existing.map((r) => r.url));
    const toFetch = urls.filter((u) => u && !cached.has(u));
    if (toFetch.length === 0) return;
    // fetch in small batches to avoid hammering the network
    const BATCH = 6;
    for (let i = 0; i < toFetch.length; i += BATCH) {
      const batch = toFetch.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            const resp = await fetch(url, { mode: "cors", credentials: "omit" });
            if (resp.ok) await cache.put(url, resp);
          } catch {
            // ignore – best-effort
          }
        })
      );
    }
  } catch {
    // Cache API not available or quota exceeded – silent fail
  }
};
