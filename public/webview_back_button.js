(function () {
  function getAppOrigin() {
    try {
      var data = JSON.parse(window.name);
      if (data && data.xl) return data.xl;
    } catch (e) {}
    return null;
  }

  function saveAppOrigin() {
    window.name = JSON.stringify({ xl: window.location.origin });
  }

  function isAppPage() {
    var saved = getAppOrigin();
    // 首次运行（没有保存的 origin）→ 当前页就是 APP
    if (!saved) {
      saveAppOrigin();
      return true;
    }
    // 比对 origin：相同 = APP 页面，不同 = 外部页面
    return window.location.origin === saved;
  }

  function run() {
    if (!document.body) {
      setTimeout(run, 10);
      return;
    }

    if (isAppPage()) return;

    if (document.getElementById("xl-back-to-app-btn")) return;

    var btn = document.createElement("div");
    btn.id = "xl-back-to-app-btn";
    btn.textContent = "\u2190 \u56de\u5230\u8f6f\u4ef6";
    btn.style.cssText = [
      "position:fixed",
      "top:10px",
      "left:10px",
      "z-index:2147483647",
      "background:#2080f0",
      "color:#fff",
      "padding:6px 14px",
      "border-radius:6px",
      "cursor:pointer",
      "font-size:13px",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "box-shadow:0 2px 8px rgba(0,0,0,.3)",
      "user-select:none",
      "line-height:1.6",
      "transition:opacity .2s",
    ].join(";");

    btn.addEventListener("mouseenter", function () {
      btn.style.opacity = "0.85";
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.opacity = "1";
    });
    btn.addEventListener("click", function () {
      var origin = getAppOrigin() || "http://localhost:1420";
      window.location.replace(origin + "/#/dashboard");
    });

    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
