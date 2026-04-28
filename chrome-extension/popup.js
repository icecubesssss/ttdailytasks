// === TT Focus Guard - Popup Logic ===

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let timerInterval = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadStatus();
  setupListeners();
});

async function loadStatus() {
  const data = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
  
  const statusDot = $("#statusDot");
  const timerSection = $("#timerSection");
  const infoBanner = $("#infoBanner");
  const bannerIcon = $("#bannerIcon");
  const bannerText = $("#bannerText");
  
  if (data.isBlocking) {
    statusDot.classList.add("active");
    timerSection.style.display = "block";
    infoBanner.style.background = "linear-gradient(135deg, #064E3B, #0F3A2C)";
    infoBanner.style.borderColor = "rgba(16, 185, 129, 0.3)";
    bannerIcon.textContent = "🛡️";
    bannerText.textContent = "Ext đang tự động chặn web gây xao nhãng!";
    
    if (data.taskTitle) {
      $("#timerTask").textContent = `📌 ${data.taskTitle}`;
    }
    
    startTimer(data.focusStartTime);
  } else {
    statusDot.classList.remove("active");
    timerSection.style.display = "none";
    infoBanner.style.background = "linear-gradient(135deg, #1E293B, #172033)";
    infoBanner.style.borderColor = "rgba(99, 102, 241, 0.1)";
    bannerIcon.textContent = "⏸️";
    bannerText.textContent = "Đang rảnh rỗi chờ Task mới...";
    stopTimer();
  }

  // Stats
  $("#statSessions").textContent = data.totalFocusSessions || 0;
  $("#statBlocked").textContent = data.blockedAttempts || 0;
  
  const totalMs = data.totalFocusTime || 0;
  const hours = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  $("#statTime").textContent = hours > 0 ? `${hours}h${mins}m` : `${mins}m`;

  // Sites list
  renderSites(data.blockedSites || []);
}

function renderSites(sites) {
  const list = $("#sitesList");
  const count = $("#sitesCount");
  
  count.textContent = `${sites.filter(s => s.enabled).length} trang`;
  
  list.innerHTML = sites.map(site => `
    <div class="site-item" data-domain="${site.domain}">
      <div class="site-info">
        <div class="site-icon">
          <img src="https://www.google.com/s2/favicons?domain=${site.domain}&sz=32" alt="" onerror="this.style.display='none'">
        </div>
        <div>
          <div class="site-name">${site.label}</div>
          <div class="site-domain">${site.domain}</div>
        </div>
      </div>
      <div class="site-actions">
        <label class="mini-switch">
          <input type="checkbox" ${site.enabled ? "checked" : ""} data-toggle-domain="${site.domain}">
          <span class="mini-slider"></span>
        </label>
        <button class="delete-btn" data-delete-domain="${site.domain}" title="Xoá">✕</button>
      </div>
    </div>
  `).join("");

  // Attach toggle listeners
  list.querySelectorAll("[data-toggle-domain]").forEach(input => {
    input.addEventListener("change", async (e) => {
      const domain = e.target.dataset.toggleDomain;
      const enabled = e.target.checked;
      
      const data = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
      const sites = data.blockedSites || [];
      const updated = sites.map(s => s.domain === domain ? { ...s, enabled } : s);
      
      await chrome.runtime.sendMessage({ type: "UPDATE_SITES", sites: updated });
      renderSites(updated);
    });
  });

  // Attach delete listeners
  list.querySelectorAll("[data-delete-domain]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const domain = e.target.dataset.deleteDomain;
      await chrome.runtime.sendMessage({ type: "REMOVE_SITE", domain });
      
      const data = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
      renderSites(data.blockedSites || []);
    });
  });
}

function setupListeners() {

  // Add site form
  $("#addSiteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#newSiteInput");
    let domain = input.value.trim().toLowerCase();
    
    if (!domain) return;
    
    // Clean up domain
    domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
    
    if (!domain.includes(".")) {
      domain += ".com";
    }
    
    const result = await chrome.runtime.sendMessage({ 
      type: "ADD_SITE", 
      domain, 
      label: domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1) 
    });
    
    if (result.success) {
      input.value = "";
      const data = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
      renderSites(data.blockedSites || []);
    } else {
      input.style.borderColor = "#EF4444";
      setTimeout(() => { input.style.borderColor = ""; }, 1500);
    }
  });
}

function startTimer(startTime) {
  stopTimer();
  
  const update = () => {
    const elapsed = Date.now() - startTime;
    const h = Math.floor(elapsed / 3600000);
    const m = Math.floor((elapsed % 3600000) / 60000);
    const s = Math.floor((elapsed % 60000) / 1000);
    
    const display = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const el = $("#timerDisplay");
    if (el) el.textContent = display;
  };
  
  update();
  timerInterval = setInterval(update, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
