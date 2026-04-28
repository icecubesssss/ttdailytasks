// === TT Focus Guard - YouTube Focus Script ===

function updateYouTubeFocusMode(isBlocking) {
  if (isBlocking) {
    document.documentElement.classList.add("tt-youtube-focus");
  } else {
    document.documentElement.classList.remove("tt-youtube-focus");
  }
}

// --- Download Music Feature ---
function injectDownloadButton() {
  if (document.getElementById("tt-download-button")) return;

  // Find the actions bar where Like/Share buttons are
  const actionsBar = document.querySelector("#top-level-buttons-computed") || 
                     document.querySelector("ytd-watch-metadata #actions #top-level-buttons-computed") ||
                     document.querySelector("#menu-container #buttons");
  
  if (!actionsBar) return;

  const btn = document.createElement("button");
  btn.id = "tt-download-button";
  btn.className = "tt-download-btn";
  btn.title = "Tải nhạc MP3 cho TT Daily Task";
  btn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
    <span>Tải Nhạc TT</span>
  `;

  btn.onclick = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("v");
    if (videoId) {
      const downloadUrl = `https://api.vevioz.com/@download/128-mp3-${videoId}`;
      window.open(downloadUrl, "_blank");
    } else {
      alert("Không tìm thấy Video ID. Hãy chắc chắn bạn đang xem một video.");
    }
  };

  actionsBar.prepend(btn);
}

// Check initial state — guard against invalidated context
try {
  chrome.storage.local.get("isBlocking", (data) => {
    updateYouTubeFocusMode(data.isBlocking);
  });
} catch (e) {}

// Listen for state changes
try {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.isBlocking) {
      updateYouTubeFocusMode(changes.isBlocking.newValue);
    }
  });
} catch (e) {}

// Watch for DOM changes to inject button (YouTube is a SPA)
// Defer observer until body is ready — script runs at document_start
function startYouTubeObserver() {
  if (!document.body) return;

  const observer = new MutationObserver(() => {
    // Stop if extension context has been invalidated
    try { chrome.runtime.id; } catch {
      observer.disconnect();
      return;
    }
    if (window.location.pathname === "/watch") {
      injectDownloadButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial check (body now available)
  if (window.location.pathname === "/watch") {
    injectDownloadButton();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startYouTubeObserver);
} else {
  startYouTubeObserver();
}
