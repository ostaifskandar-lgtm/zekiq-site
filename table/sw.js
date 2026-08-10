/**
 * ZEKiQ guest QR — push worker.
 *
 * The page is frozen by the phone as soon as the tab goes to the background, so order news cannot
 * come from the page itself. This worker is woken by the operating system instead, and it is the
 * only thing that still runs when the guest has put the phone in his pocket.
 *
 * Farewell deep-link uses ?rate=1 (not #rate) — Clients.openWindow often drops the hash, so the
 * guest used to land on the menu instead of the rating sheet.
 */
const FALLBACK_URL = "/table/index.html";
const RATE_URL = "/table/index.html?rate=1";

function resolveNotifyUrl(tag, dataUrl) {
  if (String(tag || "") === "zekiq-farewell") return RATE_URL;
  const u = String(dataUrl || "").trim();
  return u || FALLBACK_URL;
}

/** Keep table token (?t=…) when forcing the rating sheet on an already-open tab. */
function rateUrlPreservingQuery(clientUrl) {
  try {
    const u = new URL(String(clientUrl || ""), self.location.origin);
    u.searchParams.set("rate", "1");
    u.hash = "";
    return u.pathname + u.search;
  } catch (_) {
    return RATE_URL;
  }
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = {}; }
  const title = String(data.title || "ZEKiQ");
  const body = String(data.body || "");
  const tag = String(data.tag || "zekiq-order");
  const url = resolveNotifyUrl(tag, data.url);
  if (!body) return;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows.find(c => c.visibilityState === "visible");
    if (open) {
      /* He is already looking at the page — let it show its own bar instead of a system banner. */
      open.postMessage({ zekiqPush: true, title, body, tag, url, openRate: tag === "zekiq-farewell" });
      return;
    }
    await self.registration.showNotification(title, {
      body,
      tag,
      renotify: true,
      requireInteraction: tag === "zekiq-farewell",
      icon: "/table/icons/icon-192.png",
      badge: "/table/icons/icon-192.png",
      vibrate: [18, 40, 18],
      data: { url, tag, openRate: tag === "zekiq-farewell" },
    });
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const tag = String(
    (event.notification.data && event.notification.data.tag) || event.notification.tag || "",
  );
  const url = resolveNotifyUrl(tag, event.notification.data && event.notification.data.url);
  const openRate = tag === "zekiq-farewell" || !!(event.notification.data && event.notification.data.openRate);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const tableClient =
      windows.find(c => /\/table(\/|$|\?|#)/.test(String(c.url || ""))) || windows[0];
    if (tableClient && "focus" in tableClient) {
      await tableClient.focus();
      if (openRate) {
        try {
          const target = rateUrlPreservingQuery(tableClient.url);
          if (typeof tableClient.navigate === "function") {
            await tableClient.navigate(target);
          }
        } catch (_) {}
      }
      try {
        tableClient.postMessage({
          zekiqPushOpened: true,
          tag,
          openRate,
          url: openRate ? rateUrlPreservingQuery(tableClient.url) : url,
        });
      } catch (_) {}
      return;
    }
    if (self.clients.openWindow) {
      const opened = await self.clients.openWindow(url);
      if (opened && openRate) {
        try {
          opened.postMessage({
            zekiqPushOpened: true,
            tag: "zekiq-farewell",
            openRate: true,
            url,
          });
        } catch (_) {}
      }
    }
  })());
});
