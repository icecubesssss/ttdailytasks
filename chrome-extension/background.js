// === TT Focus Guard - Background Service Worker ===

const DEFAULT_BLOCKED_SITES = [
  { domain: "facebook.com", label: "Facebook", enabled: true },
  { domain: "tiktok.com", label: "TikTok", enabled: true },
  { domain: "instagram.com", label: "Instagram", enabled: true },
  { domain: "youtube.com", label: "YouTube", enabled: true },
  { domain: "twitter.com", label: "Twitter/X", enabled: true },
  { domain: "x.com", label: "X", enabled: true },
  { domain: "reddit.com", label: "Reddit", enabled: true },
  { domain: "threads.net", label: "Threads", enabled: true },
  { domain: "pinterest.com", label: "Pinterest", enabled: true },
  { domain: "netflix.com", label: "Netflix", enabled: true },
  { domain: "twitch.tv", label: "Twitch", enabled: true },
  { domain: "discord.com", label: "Discord", enabled: true },
];

// Initialize storage on install or startup
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["blockedSites", "isBlocking", "focusStartTime", "taskTitle", "totalFocusSessions"]);
  
  let sites = data.blockedSites || DEFAULT_BLOCKED_SITES;
  
  // Force YouTube off so Focus Mode CSS can work instead of complete block
  sites = sites.map(s => s.domain === "youtube.com" ? { ...s, enabled: false } : s);
  await chrome.storage.local.set({ blockedSites: sites });

  if (data.isBlocking === undefined) {
    await chrome.storage.local.set({ isBlocking: false });
  }
  if (data.totalFocusSessions === undefined) {
    await chrome.storage.local.set({ totalFocusSessions: 0, totalFocusTime: 0, blockedAttempts: 0 });
  }
});

// Listen for messages from popup, content scripts, or web app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_BLOCKING") {
    handleToggleBlocking(message.enabled, message.taskTitle).then(() => {
      sendResponse({ success: true });
    });
    return true; // async
  }

  if (message.type === "GET_STATUS") {
    chrome.storage.local.get(["isBlocking", "focusStartTime", "taskTitle", "blockedSites", "totalFocusSessions", "totalFocusTime", "blockedAttempts"]).then(data => {
      sendResponse(data);
    });
    return true;
  }

  if (message.type === "UPDATE_SITES") {
    chrome.storage.local.set({ blockedSites: message.sites }).then(async () => {
      const data = await chrome.storage.local.get("isBlocking");
      if (data.isBlocking) {
        await applyBlockingRules(message.sites);
      }
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "ADD_SITE") {
    handleAddSite(message.domain, message.label).then((result) => {
      sendResponse(result);
    });
    return true;
  }

  if (message.type === "REMOVE_SITE") {
    handleRemoveSite(message.domain).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  // From web app content script — fire-and-forget, không cần sendResponse
  // (content.js dùng safeSendMessage không await response)
  // Không return true → tránh lỗi "message channel closed"
  if (message.type === "TT_FOCUS_START") {
    handleToggleBlocking(true, message.taskTitle);
    return false;
  }

  if (message.type === "TT_FOCUS_END") {
    handleToggleBlocking(false);
    return false;
  }
});

async function handleToggleBlocking(enabled, taskTitle) {
  const data = await chrome.storage.local.get(["blockedSites", "totalFocusSessions", "isBlocking", "taskTitle", "focusStartTime", "totalFocusTime"]);
  
  if (enabled) {
    if (data.isBlocking && data.taskTitle === taskTitle) return; // Prevent redundant update

    await chrome.storage.local.set({
      isBlocking: true,
      focusStartTime: data.isBlocking ? data.focusStartTime : Date.now(),
      taskTitle: taskTitle || "Tập trung làm việc",
      totalFocusSessions: data.isBlocking ? data.totalFocusSessions : (data.totalFocusSessions || 0) + 1,
    });
    await applyBlockingRules(data.blockedSites || DEFAULT_BLOCKED_SITES);
    
    // Update badge
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
  } else {
    if (!data.isBlocking) return; // Prevent redundant update

    // Calculate focus time
    const sessionTime = data.focusStartTime ? Date.now() - data.focusStartTime : 0;
    
    await chrome.storage.local.set({
      isBlocking: false,
      focusStartTime: null,
      taskTitle: null,
      totalFocusTime: (data.totalFocusTime || 0) + sessionTime,
    });
    await removeBlockingRules();
    
    chrome.action.setBadgeText({ text: "" });
  }
}

async function applyBlockingRules(sites) {
  // Get existing rule IDs
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(r => r.id);

  // Create new rules for enabled sites
  const enabledSites = sites.filter(s => s.enabled);
  const addRules = enabledSites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        extensionPath: `/blocked.html?domain=${encodeURIComponent(site.domain)}&label=${encodeURIComponent(site.label)}`
      }
    },
    condition: {
      urlFilter: `||${site.domain}`,
      resourceTypes: ["main_frame"]
    }
  }));

  // Atomic: remove old + add new trong một lần gọi duy nhất → tránh race condition "duplicate ID"
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules,
  });


  // FORCE REDIRECT EXISTING TABS
  // declarativeNetRequest only blocks *new* network requests. If a user already has facebook open, 
  // it might not be blocked until they click something or reload. We proactively find them and redirect.
  try {
    const allTabs = await chrome.tabs.query({});
    for (const tab of allTabs) {
      if (!tab.url) continue;
      
      try {
        const tabUrl = new URL(tab.url);
        if (tabUrl.protocol !== 'http:' && tabUrl.protocol !== 'https:') continue;

        for (const site of enabledSites) {
          if (tabUrl.hostname === site.domain || tabUrl.hostname.endsWith(`.${site.domain}`)) {
            console.log(`[TT Focus Guard] Redirecting open tab ${tab.url} to block page`);
            const redirectUrl = chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(site.domain)}&label=${encodeURIComponent(site.label)}`);
            await chrome.tabs.update(tab.id, { url: redirectUrl });
            break; // Stop checking other blocked sites for this tab
          }
        }
      } catch (e) {
        // invalid or internal URL (like chrome://), safe to ignore
      }
    }
  } catch (error) {
    console.error("Error redirecting existing tabs:", error);
  }
}

async function removeBlockingRules() {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(r => r.id);
  
  if (existingIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existingIds });
  }
}

async function handleAddSite(domain, label) {
  const data = await chrome.storage.local.get("blockedSites");
  const sites = data.blockedSites || [];
  
  // Check duplicate
  if (sites.some(s => s.domain === domain)) {
    return { success: false, error: "Trang web này đã có trong danh sách!" };
  }
  
  sites.push({ domain, label: label || domain, enabled: true });
  await chrome.storage.local.set({ blockedSites: sites });
  
  const status = await chrome.storage.local.get("isBlocking");
  if (status.isBlocking) {
    await applyBlockingRules(sites);
  }
  
  return { success: true };
}

async function handleRemoveSite(domain) {
  const data = await chrome.storage.local.get("blockedSites");
  const sites = (data.blockedSites || []).filter(s => s.domain !== domain);
  await chrome.storage.local.set({ blockedSites: sites });
  
  const status = await chrome.storage.local.get("isBlocking");
  if (status.isBlocking) {
    await applyBlockingRules(sites);
  }
}

// Track blocked attempts
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener(async () => {
  const data = await chrome.storage.local.get("blockedAttempts");
  await chrome.storage.local.set({ blockedAttempts: (data.blockedAttempts || 0) + 1 });
});

// === HEARTBEAT IDLE DETECTION ===
// Detect OS-level idle (no keyboard/mouse across ALL apps) and auto-pause running tasks.
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/tt-daily-task/databases/(default)/documents';
const TASKS_PATH = `${FIRESTORE_BASE}/artifacts/tt-daily-task/public/data/tasks`;
const IDLE_TIMEOUT_SEC = 300; // 5 phút

// Set idle detection threshold
chrome.idle.setDetectionInterval(IDLE_TIMEOUT_SEC);

// === FIRESTORE POLLING — sync blocking state with server ===
// Khi Apps Script hoặc bất kỳ nguồn nào pause task từ server,
// Đồng bộ trạng thái blocking với Firestore — chạy cả hai chiều:
// - isBlocking=true nhưng không còn task running → tắt blocking
// - isBlocking=false nhưng có task đang running → bật blocking (re-sync sau khi reinstall)
const POLL_INTERVAL_MS = 60_000; // 1 phút

async function syncBlockingWithFirestore() {
  try {
    const resp = await fetch(TASKS_PATH);
    if (!resp.ok) {
      console.warn('[TT Focus Guard] Poll: failed to read tasks:', resp.status);
      return;
    }
    const result = await resp.json();
    const docs = result.documents || [];

    // Tìm task đang running
    const runningDoc = docs.find(doc => {
      const f = doc.fields || {};
      return (f.status || {}).stringValue === 'running';
    });

    const data = await chrome.storage.local.get(['isBlocking']);

    if (runningDoc && !data.isBlocking) {
      // Task đang chạy nhưng extension không biết (vd: vừa reinstall)
      const taskTitle = (runningDoc.fields?.title || {}).stringValue || 'Tập trung làm việc';
      console.log(`[TT Focus Guard] Poll: phát hiện task running "${taskTitle}" → bật blocking`);
      await handleToggleBlocking(true, taskTitle);
    } else if (!runningDoc && data.isBlocking) {
      // Không còn task running nhưng extension vẫn đang block
      console.log('[TT Focus Guard] Poll: không còn task running → tắt blocking');
      await handleToggleBlocking(false);
    }
  } catch (err) {
    console.error('[TT Focus Guard] Poll error:', err);
  }
}

// Chạy ngay khi service worker khởi động
syncBlockingWithFirestore();

// Dùng chrome.alarms để poll định kỳ (hoạt động kể cả khi SW sleep)
chrome.alarms.create('firestorePoll', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'firestorePoll') {
    syncBlockingWithFirestore();
  }
});


// Listen for idle state changes
chrome.idle.onStateChanged.addListener(async (state) => {
  // Only act when focus mode is active AND user is idle/locked
  const data = await chrome.storage.local.get(['isBlocking']);
  if (!data.isBlocking) return;
  if (state !== 'idle' && state !== 'locked') return;

  console.log(`[TT Focus Guard] User ${state} > ${IDLE_TIMEOUT_SEC}s → auto-pausing tasks`);

  try {
    // Read all tasks
    const resp = await fetch(TASKS_PATH);
    if (!resp.ok) {
      console.error('[TT Focus Guard] Failed to read tasks:', resp.status);
      return;
    }
    const result = await resp.json();
    const docs = result.documents || [];
    const now = Date.now();

    for (const doc of docs) {
      const f = doc.fields || {};
      if ((f.status || {}).stringValue !== 'running') continue;

      // SKIP AUTOMATED TASKS: they follow the schedule regardless of user presence
      if ((f.isAutomated || {}).booleanValue) {
        console.log(`[TT Focus Guard] Skipping idle-pause for automated task: ${(f.title || {}).stringValue}`);
        continue;
      }

      const lastHB = Number((f.lastHeartbeat || {}).integerValue || 0);
      const lastStart = Number((f.lastStartTime || {}).integerValue || 0);
      const prevTracked = Number((f.totalTrackedTime || {}).integerValue || 0);

      // Calculate active time up to last heartbeat (or lastStart if no HB)
      const refTime = lastHB || lastStart;
      const activeTime = refTime ? Math.max(0, refTime - lastStart) : 0;

      const docPath = doc.name.split('/documents/')[1];
      const mask = ['status','totalTrackedTime','lastStartTime','currentWorker',
                    'lastHeartbeat','autoPausedAt','autoPauseReason']
        .map(p => `updateMask.fieldPaths=${p}`).join('&');

      const patchResp = await fetch(`${FIRESTORE_BASE}/${docPath}?${mask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'paused' },
            totalTrackedTime: { integerValue: String(prevTracked + activeTime) },
            lastStartTime: { nullValue: null },
            currentWorker: { nullValue: null },
            lastHeartbeat: { nullValue: null },
            autoPausedAt: { integerValue: String(now) },
            autoPauseReason: { stringValue: 'heartbeat_timeout' }
          }
        })
      });

      if (patchResp.ok) {
        console.log(`[TT Focus Guard] Auto-paused: ${(f.title || {}).stringValue}`);
      } else {
        console.error(`[TT Focus Guard] Failed to pause task:`, patchResp.status);
      }
    }

    // Turn off blocking mode since user is idle
    await handleToggleBlocking(false);
  } catch (err) {
    console.error('[TT Focus Guard] Idle auto-pause error:', err);
  }
});

