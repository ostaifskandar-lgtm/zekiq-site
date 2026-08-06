/**
 * ZEKiQ guest QR — push worker.
 *
 * The page is frozen by the phone as soon as the tab goes to the background, so order news cannot
 * come from the page itself. This worker is woken by the operating system instead, and it is the
 * only thing that still runs when the guest has put the phone in his pocket.
 */
const FALLBACK_URL = "/table/index.html";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = {}; }
  const title = String(data.title || "ZEKiQ");
  const body = String(data.body || "");
  const tag = String(data.tag || "zekiq-order");
  const url = String(data.url || FALLBACK_URL);
  if (!body) return;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows.find(c => c.visibilityState === "visible");
    if (open) {
      /* He is already looking at the page — let it show its own bar instead of a system banner. */
      open.postMessage({ zekiqPush: true, title, body, tag });
      return;
    }
    await self.registration.showNotification(title, {
      body,
      tag,
      renotify: true,
      requireInteraction: tag === "zekiq-farewell",
      icon: "/table/icon-192.png",
      badge: "/table/icon-192.png",
      vibrate: [18, 40, 18],
      data: { url },
    });
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || FALLBACK_URL;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        try { client.postMessage({ zekiqPushOpened: true, tag: event.notification.tag }); } catch (_) {}
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
