(function () {
  "use strict";
  if (typeof document === "undefined") return;
  if (!/^\/pos(\/|$)/.test(location.pathname)) return;
  if (document.getElementById("zekiq-pos-selected-price-css")) return;

  var s = document.createElement("style");
  s.id = "zekiq-pos-selected-price-css";
  s.textContent =
    '[class*="border-l-blue-600"] .text-amber-600,' +
    '[class*="border-l-blue-600"] .text-violet-700,' +
    '[class*="border-l-blue-600"] .tabular-nums.text-sm.font-bold:not(.line-through){' +
    "font-size:1.0625rem!important;font-weight:900!important;color:#1d4ed8!important;letter-spacing:-.02em}" +
    '[class*="border-l-blue-600"] .text-right span:last-child{' +
    "font-size:1.0625rem!important;font-weight:900!important;color:#1d4ed8!important}";
  document.head.appendChild(s);
})();
