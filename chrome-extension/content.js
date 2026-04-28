// === TT Focus Guard - Content Script ===
// Bridges the TT Daily Task web app with the extension

(function() {
  "use strict";

  // Cờ báo hiệu extension context đã bị invalidated (remove/reload extension)
  // Khi bật cờ này, tất cả listener tự gỡ mình để ngăn lỗi tiếp theo
  let _contextInvalidated = false;

  function markInvalidated() {
    if (_contextInvalidated) return;
    _contextInvalidated = true;
    // Gỡ message listener để web app không tiếp tục trigger lỗi
    window.removeEventListener("message", onWebAppMessage);
  }

  // Helper: gửi message tới background, tự-cleanup nếu context bị invalidated
  function safeSendMessage(msg) {
    if (_contextInvalidated) return;

    try {
      chrome.runtime.sendMessage(msg).catch(err => {
        const errStr = err?.message || String(err || '');
        if (errStr.includes('Extension context invalidated')) {
          markInvalidated();
          return;
        }
        const isBenign =
          errStr.includes('receiving end does not exist') ||
          errStr.includes('message channel closed');
        if (!isBenign) {
          console.error('[TT Focus Guard] Lỗi gửi background:', err);
        }
      });
    } catch (err) {
      // sendMessage throw synchronously → context bị invalidated
      markInvalidated();
    }
  }

  // Handler tách ra để có thể removeEventListener sau này
  function onWebAppMessage(event) {
    if (event.source !== window) return;
    if (_contextInvalidated) return;

    if (event.data?.type === "TT_FOCUS_START") {
      console.log("[TT Focus Guard] Nhận được tín hiệu TT_FOCUS_START từ web app", event.data);
      safeSendMessage({
        type: "TT_FOCUS_START",
        taskTitle: event.data.taskTitle || "Tập trung làm việc"
      });
    }

    if (event.data?.type === "TT_FOCUS_END") {
      console.log("[TT Focus Guard] Nhận được tín hiệu TT_FOCUS_END từ web app");
      safeSendMessage({ type: "TT_FOCUS_END" });
    }
  }

  // Đăng ký message listener
  window.addEventListener("message", onWebAppMessage);

  // Notify web app that extension is installed
  console.log("[TT Focus Guard] Content script đã tải thành công!");
  window.postMessage({ type: "TT_FOCUS_GUARD_READY" }, "*");

  // Also observe DOM for focus mode changes as fallback
  // Defer until body is available to avoid MutationObserver on null
  function startObserver() {
    if (!document.body) return;

    const observer = new MutationObserver(() => {
      if (_contextInvalidated) {
        observer.disconnect();
        return;
      }

      const focusOverlay = document.querySelector('.fixed.inset-0.bg-slate-950.z-\\[110\\]');

      if (focusOverlay && !window.__ttFocusActive) {
        window.__ttFocusActive = true;
        const titleEl = focusOverlay.querySelector('h2');
        const taskTitle = titleEl?.textContent || "Tập trung làm việc";
        safeSendMessage({ type: "TT_FOCUS_START", taskTitle });
      } else if (!focusOverlay && window.__ttFocusActive) {
        window.__ttFocusActive = false;
        safeSendMessage({ type: "TT_FOCUS_END" });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }
})();
