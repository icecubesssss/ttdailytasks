This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where comments have been removed, empty lines have been removed.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: node_modules/**, dist/**, build/**, .git/**, package-lock.json, yarn.lock, public/**, *.log, *.zip, backup_cleanup/**, account.json, lint_output.txt, *.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp, repomix-output.md, src/assets/**
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Empty lines have been removed from all files
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
chrome-extension/
  icons/
    icon128.png
    icon16.png
    icon48.png
  background.js
  blocked.css
  blocked.html
  blocked.js
  content.js
  manifest.json
  popup.css
  popup.html
  popup.js
  youtube-focus.js
  youtube.css
docs/
  architecture.md
  GUIDELINES.md
  prompt.md
scripts/
  migrate-assignee-admin.mjs
  migrate-assignee.mjs
src/
  components/
    auth/
      LoginScreen.tsx
      SplashScreen.tsx
    calendar/
      CalendarHeader.tsx
      CalendarSubComponents.tsx
      CalendarView.tsx
      GridView.tsx
      SetupGuide.tsx
      WeeklyOverview.tsx
      WeeklyTaskCard.tsx
    focus/
      DuoFocusBanner.tsx
      FocusChecklist.tsx
      FocusView.tsx
      MusicPrompt.tsx
      TimerRing.tsx
    layout/
      AppHeader.tsx
      AppMainContent.tsx
      AppOverlays.tsx
      AppProviders.tsx
      Dashboard.tsx
      MixerSidebar.tsx
      MusicSidebar.tsx
    shop/
      ClosetView.tsx
      ShopView.tsx
    stats/
      productivity/
        ProductivityCharts.tsx
        ProductivityInsights.tsx
        ProductivityStatCard.tsx
      subcomponents/
        StatsComponents.tsx
      widgets/
        DailyQuestWidget.tsx
        DuoFocusWidget.tsx
        MascotAssistantWidget.tsx
      ProductivityReport.tsx
      StatsView.tsx
      StreakCalendar.tsx
    tasks/
      subcomponents/
        TaskComponents.tsx
      TaskBoard.tsx
      TaskForm.tsx
      TaskItem.tsx
      TaskListView.tsx
  contexts/
    TaskActionContext.tsx
    TaskContext.tsx
    UserContext.tsx
  hooks/
    useActivityResume.ts
    useAiActions.ts
    useAppBootstrap.ts
    useAppEffects.ts
    useAppUiActions.ts
    useAppViewModel.ts
    useAudio.ts
    useAutoTaskLogic.ts
    useCalendarAutoSync.ts
    useDailyQuest.ts
    useDeepLinks.ts
    useFocusMusic.ts
    useFocusTimer.ts
    useHeartbeat.ts
    useNow.ts
    useProductivityStats.ts
    useTaskActions.ts
    useTTApp.ts
    useUserStats.ts
  services/
    ai.ts
    aiService.ts
    dailyQuestService.ts
    taskService.ts
    userService.ts
  shared/
    Badge.tsx
    Button.tsx
    Card.tsx
    Modal.tsx
  store/
    useAppStore.ts
  utils/
    calendarUtils.ts
    constants.ts
    helpers.ts
    musicStore.ts
  App.css
  App.tsx
  firebase.ts
  index.css
  main.tsx
  vite-env.d.ts
.ai-instructions.md
.env.example
.gitignore
eslint.config.js
firebase.json
index.html
package.json
postcss.config.js
README.md
repomix.config.json
SECURITY.md
tailwind.config.js
tsconfig.json
tsconfig.node.json
vite.config.js
```

# Files

## File: chrome-extension/background.js
````javascript
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
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["blockedSites", "isBlocking", "focusStartTime", "taskTitle", "totalFocusSessions"]);
  let sites = data.blockedSites || DEFAULT_BLOCKED_SITES;
  sites = sites.map(s => s.domain === "youtube.com" ? { ...s, enabled: false } : s);
  await chrome.storage.local.set({ blockedSites: sites });
  if (data.isBlocking === undefined) {
    await chrome.storage.local.set({ isBlocking: false });
  }
  if (data.totalFocusSessions === undefined) {
    await chrome.storage.local.set({ totalFocusSessions: 0, totalFocusTime: 0, blockedAttempts: 0 });
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_BLOCKING") {
    handleToggleBlocking(message.enabled, message.taskTitle).then(() => {
      sendResponse({ success: true });
    });
    return true;
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
    if (data.isBlocking && data.taskTitle === taskTitle) return;
    await chrome.storage.local.set({
      isBlocking: true,
      focusStartTime: data.isBlocking ? data.focusStartTime : Date.now(),
      taskTitle: taskTitle || "Tập trung làm việc",
      totalFocusSessions: data.isBlocking ? data.totalFocusSessions : (data.totalFocusSessions || 0) + 1,
    });
    await applyBlockingRules(data.blockedSites || DEFAULT_BLOCKED_SITES);
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
  } else {
    if (!data.isBlocking) return;
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
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules,
  });
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
            break;
          }
        }
      } catch (e) {
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
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener(async () => {
  const data = await chrome.storage.local.get("blockedAttempts");
  await chrome.storage.local.set({ blockedAttempts: (data.blockedAttempts || 0) + 1 });
});
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/tt-daily-task/databases/(default)/documents';
const TASKS_PATH = `${FIRESTORE_BASE}/artifacts/tt-daily-task/public/data/tasks`;
const IDLE_TIMEOUT_SEC = 300;
chrome.idle.setDetectionInterval(IDLE_TIMEOUT_SEC);
const POLL_INTERVAL_MS = 60_000;
async function syncBlockingWithFirestore() {
  try {
    const resp = await fetch(TASKS_PATH);
    if (!resp.ok) {
      console.warn('[TT Focus Guard] Poll: failed to read tasks:', resp.status);
      return;
    }
    const result = await resp.json();
    const docs = result.documents || [];
    const runningDoc = docs.find(doc => {
      const f = doc.fields || {};
      return (f.status || {}).stringValue === 'running';
    });
    const data = await chrome.storage.local.get(['isBlocking']);
    if (runningDoc && !data.isBlocking) {
      const taskTitle = (runningDoc.fields?.title || {}).stringValue || 'Tập trung làm việc';
      console.log(`[TT Focus Guard] Poll: phát hiện task running "${taskTitle}" → bật blocking`);
      await handleToggleBlocking(true, taskTitle);
    } else if (!runningDoc && data.isBlocking) {
      console.log('[TT Focus Guard] Poll: không còn task running → tắt blocking');
      await handleToggleBlocking(false);
    }
  } catch (err) {
    console.error('[TT Focus Guard] Poll error:', err);
  }
}
syncBlockingWithFirestore();
chrome.alarms.create('firestorePoll', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'firestorePoll') {
    syncBlockingWithFirestore();
  }
});
chrome.idle.onStateChanged.addListener(async (state) => {
  const data = await chrome.storage.local.get(['isBlocking']);
  if (!data.isBlocking) return;
  if (state !== 'idle' && state !== 'locked') return;
  console.log(`[TT Focus Guard] User ${state} > ${IDLE_TIMEOUT_SEC}s → auto-pausing tasks`);
  try {
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
      if ((f.isAutomated || {}).booleanValue) {
        console.log(`[TT Focus Guard] Skipping idle-pause for automated task: ${(f.title || {}).stringValue}`);
        continue;
      }
      const lastHB = Number((f.lastHeartbeat || {}).integerValue || 0);
      const lastStart = Number((f.lastStartTime || {}).integerValue || 0);
      const prevTracked = Number((f.totalTrackedTime || {}).integerValue || 0);
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
    await handleToggleBlocking(false);
  } catch (err) {
    console.error('[TT Focus Guard] Idle auto-pause error:', err);
  }
});
````

## File: chrome-extension/blocked.css
````css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #050810;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  color: #E2E8F0;
  overflow: hidden;
  position: relative;
}
.background-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: float 20s infinite ease-in-out;
}
.orb-1 {
  width: 400px;
  height: 400px;
  background: #6366F1;
  top: -100px;
  right: -50px;
  animation-delay: 0s;
}
.orb-2 {
  width: 350px;
  height: 350px;
  background: #EC4899;
  bottom: -80px;
  left: -50px;
  animation-delay: -7s;
}
.orb-3 {
  width: 300px;
  height: 300px;
  background: #10B981;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.1); }
  50% { transform: translate(-20px, 20px) scale(0.9); }
  75% { transform: translate(40px, 30px) scale(1.05); }
}
.container {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 500px;
  padding: 40px 30px;
  animation: slideUp 0.6s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.shield-icon {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
}
.shield-icon span {
  font-size: 80px;
  display: block;
  animation: breathe 3s infinite ease-in-out;
  filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.4));
}
.shield-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulseGlow 3s infinite ease-in-out;
}
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}
.title {
  font-size: 32px;
  font-weight: 900;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #818CF8, #EC4899, #F472B6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}
.blocked-domain {
  font-size: 14px;
  color: #EF4444;
  font-weight: 800;
  padding: 6px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 28px;
}
.quote-box {
  margin-bottom: 32px;
  padding: 20px 24px;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}
.quote {
  font-size: 16px;
  font-weight: 700;
  color: #CBD5E1;
  line-height: 1.6;
  font-style: italic;
}
.timer-box {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 20px;
}
.timer-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #6EE7B7;
  margin-bottom: 8px;
}
.timer {
  font-size: 56px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #34D399, #10B981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -2px;
  margin-bottom: 6px;
}
.task-name {
  font-size: 13px;
  color: #6EE7B7;
  font-weight: 700;
  opacity: 0.7;
}
.actions {
  margin-bottom: 24px;
}
.btn {
  padding: 12px 28px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}
.btn-back {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: #818CF8;
}
.btn-back:hover {
  background: rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
}
.footer-text {
  font-size: 10px;
  color: #334155;
  font-weight: 600;
  letter-spacing: 0.5px;
}
````

## File: chrome-extension/blocked.html
````html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🛡️ Trang này đã bị chặn - TT Focus Guard</title>
  <link rel="stylesheet" href="blocked.css">
</head>
<body>
  <div class="background-effects">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  </div>
  <div class="container">
    <div class="shield-icon">
      <div class="shield-glow"></div>
      <span>🛡️</span>
    </div>
    <h1 class="title">Trang này đã bị chặn!</h1>
    <p class="blocked-domain" id="blockedDomain"></p>
    <div class="quote-box">
      <p class="quote" id="quote"></p>
    </div>
    <div class="timer-box">
      <p class="timer-label">Đang tập trung được</p>
      <div class="timer" id="timer">00:00:00</div>
      <p class="task-name" id="taskName"></p>
    </div>
    <div class="actions">
      <button class="btn btn-back" id="btnBack">← Quay lại trang trước</button>
    </div>
    <p class="footer-text">TT Focus Guard • Bảo vệ sự tập trung của bạn ✨</p>
  </div>
  <script src="blocked.js"></script>
</body>
</html>
````

## File: chrome-extension/blocked.js
````javascript
const QUOTES = [
  "\"Kỷ luật là cầu nối giữa mục tiêu và thành tựu.\" — Jim Rohn",
  "\"Sự tập trung là vũ khí bí mật của người thành công.\"",
  "\"Ê! Quay lại làm việc đi! Mạng xã hội đợi bạn sau! 😤\"",
  "\"Đừng để 5 phút lướt web biến thành 2 tiếng mất tập trung.\"",
  "\"Bạn đang làm rất tốt! Đừng phá hỏng nó bằng sự phân tâm.\"",
  "\"Thành công là tổng của những nỗ lực nhỏ, lặp đi lặp lại mỗi ngày.\"",
  "\"Tương lai thuộc về những ai tin vào vẻ đẹp của ước mơ mình.\" — Eleanor Roosevelt",
  "\"Mỗi phút tập trung hôm nay là một bước tiến cho ngày mai.\"",
  "\"Người chiến thắng không phải người giỏi nhất, mà là người kiên trì nhất.\"",
  "\"Tập trung vào điều quan trọng. Mọi thứ khác đều có thể đợi. 🎯\"",
  "\"Đây không phải lúc để lướt feed. Hãy hoàn thành công việc trước! 💪\"",
  "\"Bạn đã hứa với bản thân sẽ tập trung. Hãy giữ lời hứa đó!\"",
];
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const domain = params.get("domain") || "unknown";
  const label = params.get("label") || domain;
  document.getElementById("blockedDomain").textContent = `🚫 ${domain}`;
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById("quote").textContent = randomQuote;
  try {
    const data = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
    if (data.focusStartTime) {
      startTimer(data.focusStartTime);
    }
    if (data.taskTitle) {
      document.getElementById("taskName").textContent = `📌 ${data.taskTitle}`;
    }
  } catch (e) {
    console.log("Could not get focus status");
  }
  document.getElementById("btnBack").addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  });
  setInterval(() => {
    const quoteEl = document.getElementById("quote");
    quoteEl.style.opacity = "0";
    quoteEl.style.transform = "translateY(10px)";
    quoteEl.style.transition = "all 0.3s ease";
    setTimeout(() => {
      const newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      quoteEl.textContent = newQuote;
      quoteEl.style.opacity = "1";
      quoteEl.style.transform = "translateY(0)";
    }, 300);
  }, 8000);
});
function startTimer(startTime) {
  const update = () => {
    const elapsed = Date.now() - startTime;
    const h = Math.floor(elapsed / 3600000);
    const m = Math.floor((elapsed % 3600000) / 60000);
    const s = Math.floor((elapsed % 60000) / 1000);
    document.getElementById("timer").textContent =
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  update();
  setInterval(update, 1000);
}
````

## File: chrome-extension/content.js
````javascript
(function() {
  "use strict";
  let _contextInvalidated = false;
  function markInvalidated() {
    if (_contextInvalidated) return;
    _contextInvalidated = true;
    window.removeEventListener("message", onWebAppMessage);
  }
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
      markInvalidated();
    }
  }
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
  window.addEventListener("message", onWebAppMessage);
  console.log("[TT Focus Guard] Content script đã tải thành công!");
  window.postMessage({ type: "TT_FOCUS_GUARD_READY" }, "*");
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
````

## File: chrome-extension/manifest.json
````json
{
  "manifest_version": 3,
  "name": "TT Focus Guard",
  "version": "1.0.0",
  "description": "Chặn các trang web gây mất tập trung khi bạn đang làm việc. Tích hợp với TT Daily Task.",
  "permissions": [
    "storage",
    "declarativeNetRequest",
    "declarativeNetRequestFeedback",
    "tabs",
    "idle",
    "alarms"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["blocked.html", "blocked.css", "blocked.js"],
      "matches": ["<all_urls>"]
    }
  ],
  "content_scripts": [
    {
      "matches": [
        "http://localhost:*/*",
        "http://127.0.0.1:*/*",
        "https://*.web.app/*",
        "https://*.firebaseapp.com/*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle"
    },
    {
      "matches": [
        "*://*.youtube.com/*"
      ],
      "css": ["youtube.css"],
      "js": ["youtube-focus.js"],
      "run_at": "document_start"
    }
  ]
}
````

## File: chrome-extension/popup.css
````css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  width: 360px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  background: #0B1120;
  color: #E2E8F0;
  overflow-x: hidden;
}
.popup {
  padding: 16px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(99, 102, 241, 0.15);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo {
  font-size: 28px;
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.4));
}
.header h1 {
  font-size: 15px;
  font-weight: 900;
  background: linear-gradient(135deg, #818CF8, #EC4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.3px;
}
.subtitle {
  font-size: 10px;
  color: #64748B;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 1px;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #475569;
  transition: all 0.3s ease;
}
.status-dot.active {
  background: #10B981;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
  animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 12px rgba(16, 185, 129, 0.6); }
  50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.9); }
}
.info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #1E293B, #172033);
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}
.info-icon {
  font-size: 18px;
}
.info-text {
  font-size: 11px;
  font-weight: 700;
  color: #E2E8F0;
  line-height: +1.4;
}
.timer-section {
  text-align: center;
  padding: 16px;
  margin-top: 10px;
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.1);
  border-radius: 16px;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.timer-display {
  font-size: 36px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #34D399, #10B981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -1px;
  margin-bottom: 4px;
}
.timer-task {
  font-size: 11px;
  color: #6EE7B7;
  font-weight: 700;
  opacity: 0.8;
}
.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: #1E293B;
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.08);
}
.stat-value {
  font-size: 18px;
  font-weight: 900;
  color: #818CF8;
}
.stat-label {
  font-size: 9px;
  font-weight: 700;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
.sites-section {
  background: #1E293B;
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.08);
  overflow: hidden;
  margin-bottom: 12px;
}
.sites-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.sites-header h2 {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94A3B8;
}
.sites-count {
  font-size: 10px;
  font-weight: 700;
  color: #6366F1;
  background: rgba(99, 102, 241, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}
.sites-list {
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
.sites-list::-webkit-scrollbar {
  width: 4px;
}
.sites-list::-webkit-scrollbar-track {
  background: transparent;
}
.sites-list::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
.site-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  transition: background 0.2s ease;
}
.site-item:hover {
  background: rgba(255, 255, 255, 0.02);
}
.site-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.site-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.site-icon img {
  width: 14px;
  height: 14px;
}
.site-name {
  font-size: 12px;
  font-weight: 700;
  color: #CBD5E1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.site-domain {
  font-size: 9px;
  color: #64748B;
  font-weight: 600;
}
.site-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.mini-switch {
  position: relative;
  width: 32px;
  height: 18px;
}
.mini-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.mini-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #334155;
  border-radius: 18px;
  transition: all 0.2s ease;
}
.mini-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 2px;
  bottom: 2px;
  background-color: #64748B;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.mini-switch input:checked + .mini-slider {
  background: #6366F1;
}
.mini-switch input:checked + .mini-slider:before {
  transform: translateX(14px);
  background: white;
}
.delete-btn {
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  font-size: 14px;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1;
}
.delete-btn:hover {
  color: #EF4444;
  background: rgba(239, 68, 68, 0.1);
}
.add-site-form {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}
.add-site-form input {
  flex: 1;
  background: #0F172A;
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 8px;
  padding: 7px 10px;
  color: #E2E8F0;
  font-size: 11px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s ease;
}
.add-site-form input::placeholder {
  color: #475569;
}
.add-site-form input:focus {
  border-color: #6366F1;
}
.add-site-form button {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #6366F1, #818CF8);
  color: white;
  font-size: 16px;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.add-site-form button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
.footer {
  text-align: center;
  padding-top: 4px;
}
.footer span {
  font-size: 9px;
  color: #475569;
  font-weight: 600;
}
````

## File: chrome-extension/popup.html
````html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TT Focus Guard</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup">
    <div class="header">
      <div class="header-left">
        <div class="logo">🛡️</div>
        <div>
          <h1>TT Focus Guard</h1>
          <p class="subtitle">Bảo vệ sự tập trung của bạn</p>
        </div>
      </div>
      <div class="status-dot" id="statusDot"></div>
    </div>
    <div class="info-banner" id="infoBanner">
      <span class="info-icon" id="bannerIcon">⏸️</span>
      <span class="info-text" id="bannerText">Đang rảnh rỗi chờ Task mới...</span>
    </div>
    <div class="timer-section" id="timerSection" style="display: none;">
      <div class="timer-display" id="timerDisplay">00:00:00</div>
      <div class="timer-task" id="timerTask"></div>
    </div>
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-value" id="statSessions">0</span>
        <span class="stat-label">Phiên</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" id="statTime">0h</span>
        <span class="stat-label">Tổng giờ</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" id="statBlocked">0</span>
        <span class="stat-label">Đã chặn</span>
      </div>
    </div>
    <div class="sites-section">
      <div class="sites-header">
        <h2>Danh sách chặn</h2>
        <span class="sites-count" id="sitesCount">0 trang</span>
      </div>
      <div class="sites-list" id="sitesList">
      </div>
      <form class="add-site-form" id="addSiteForm">
        <input type="text" id="newSiteInput" placeholder="Thêm trang web (vd: zalo.me)" autocomplete="off">
        <button type="submit" id="addSiteBtn">+</button>
      </form>
    </div>
    <div class="footer">
      <span>✨ Tích hợp với TT Daily Task</span>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
````

## File: chrome-extension/popup.js
````javascript
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
  $("#statSessions").textContent = data.totalFocusSessions || 0;
  $("#statBlocked").textContent = data.blockedAttempts || 0;
  const totalMs = data.totalFocusTime || 0;
  const hours = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  $("#statTime").textContent = hours > 0 ? `${hours}h${mins}m` : `${mins}m`;
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
  $("#addSiteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#newSiteInput");
    let domain = input.value.trim().toLowerCase();
    if (!domain) return;
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
````

## File: chrome-extension/youtube-focus.js
````javascript
function updateYouTubeFocusMode(isBlocking) {
  if (isBlocking) {
    document.documentElement.classList.add("tt-youtube-focus");
  } else {
    document.documentElement.classList.remove("tt-youtube-focus");
  }
}
function injectDownloadButton() {
  if (document.getElementById("tt-download-button")) return;
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
try {
  chrome.storage.local.get("isBlocking", (data) => {
    updateYouTubeFocusMode(data.isBlocking);
  });
} catch (e) {}
try {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.isBlocking) {
      updateYouTubeFocusMode(changes.isBlocking.newValue);
    }
  });
} catch (e) {}
function startYouTubeObserver() {
  if (!document.body) return;
  const observer = new MutationObserver(() => {
    try { chrome.runtime.id; } catch {
      observer.disconnect();
      return;
    }
    if (window.location.pathname === "/watch") {
      injectDownloadButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (window.location.pathname === "/watch") {
    injectDownloadButton();
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startYouTubeObserver);
} else {
  startYouTubeObserver();
}
````

## File: chrome-extension/youtube.css
````css
html.tt-youtube-focus ytd-browse[page-subtype="home"] ytd-rich-grid-renderer {
  display: none !important;
}
html.tt-youtube-focus ytd-browse[page-subtype="home"] #primary::after {
  content: "😎 Chế độ tập trung đang bật. Hãy dùng thanh tìm kiếm để tìm chính xác thứ bạn cần!";
  display: block;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-top: 15vh;
  color: #64748B;
  padding: 40px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px dashed rgba(99, 102, 241, 0.4);
  border-radius: 20px;
}
html.tt-youtube-focus ytd-reel-shelf-renderer,
html.tt-youtube-focus ytd-rich-shelf-renderer,
html.tt-youtube-focus a[title="Shorts"],
html.tt-youtube-focus a[href^="/shorts/"],
html.tt-youtube-focus ytd-mini-guide-entry-renderer[aria-label="Shorts"],
html.tt-youtube-focus ytd-guide-entry-renderer a[title="Shorts"] {
  display: none !important;
}
html.tt-youtube-focus #secondary,
html.tt-youtube-focus #secondary-inner {
  display: none !important;
}
html.tt-youtube-focus ytd-watch-flexy[flexy] #primary.ytd-watch-flexy {
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding-right: 0 !important;
}
html.tt-youtube-focus #comments,
html.tt-youtube-focus ytd-comments {
  display: none !important;
}
html.tt-youtube-focus .ytp-endscreen-content {
  display: none !important;
}
html.tt-youtube-focus a[href^="/feed/explore"],
html.tt-youtube-focus a[href^="/feed/trending"] {
  display: none !important;
}
.tt-download-btn {
  background: rgba(99, 102, 241, 0.1) !important;
  border: 1px solid rgba(99, 102, 241, 0.2) !important;
  color: #818CF8 !important;
  border-radius: 18px !important;
  padding: 0 16px !important;
  height: 36px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin-left: 8px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  text-transform: none !important;
  font-family: inherit !important;
}
.tt-download-btn:hover {
  background: rgba(99, 102, 241, 0.2) !important;
  border-color: rgba(99, 102, 241, 0.4) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}
.tt-download-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}
````

## File: scripts/migrate-assignee.mjs
````javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv(ENV_PATH);

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const dryRun = !apply;

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

for (const [k, v] of Object.entries(firebaseConfig)) {
  if (!v) {
    console.error(`Missing env: ${k}. Ensure .env has VITE_* Firebase keys.`);
    process.exit(1);
  }
}

const appId = process.env.VITE_APP_ID || 'default-app-id';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const legacyEmailMap = {
  tit: 'dinhthai.ctv@gmail.com',
  tun: 'transontruc.03@gmail.com'
};

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

async function main() {
  const teamCol = collection(db, `artifacts/${appId}/public/data/teamMembers`);
  const teamSnap = await getDocs(teamCol);
  const emailToUid = new Map();
  const uidSet = new Set();
  teamSnap.forEach((d) => {
    const data = d.data();
    const uid = typeof data.uid === 'string' ? data.uid : d.id;
    const email = normalizeEmail(data.email);
    if (uid) uidSet.add(uid);
    if (uid && email) emailToUid.set(email, uid);
  });

  const tasksCol = collection(db, `artifacts/${appId}/public/data/tasks`);
  const tasksSnap = await getDocs(tasksCol);

  let scanned = 0;
  let alreadyUid = 0;
  let migrated = 0;
  let skippedUnknown = 0;
  let invalidAssignee = 0;

  const updates = [];

  tasksSnap.forEach((taskDoc) => {
    scanned += 1;
    const t = taskDoc.data();
    const assigneeId = typeof t.assigneeId === 'string' ? t.assigneeId.trim() : '';

    if (!assigneeId) {
      invalidAssignee += 1;
      return;
    }

    const directUidMatch = uidSet.has(assigneeId);
    if (directUidMatch) {
      alreadyUid += 1;
      return;
    }

    const key = assigneeId.toLowerCase();
    if (key !== 'tit' && key !== 'tun') {
      skippedUnknown += 1;
      return;
    }

    const mappedUid = emailToUid.get(legacyEmailMap[key]);
    if (!mappedUid) {
      skippedUnknown += 1;
      return;
    }

    updates.push({ id: taskDoc.id, from: assigneeId, to: mappedUid });
    migrated += 1;
  });

  console.log('Assignee migration summary:');
  console.log(`- Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}`);
  console.log(`- appId: ${appId}`);
  console.log(`- Team members loaded: ${emailToUid.size}`);
  console.log(`- Tasks scanned: ${scanned}`);
  console.log(`- Already UID: ${alreadyUid}`);
  console.log(`- Candidate migrated: ${migrated}`);
  console.log(`- Skipped unknown assignee: ${skippedUnknown}`);
  console.log(`- Empty/invalid assigneeId: ${invalidAssignee}`);

  if (updates.length > 0) {
    console.log('\nPreview updates (max 20):');
    updates.slice(0, 20).forEach((u) => {
      console.log(`- ${u.id}: ${u.from} -> ${u.to}`);
    });
  }

  if (dryRun || updates.length === 0) return;

  const chunkSize = 400;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const u of chunk) {
      batch.update(doc(db, `artifacts/${appId}/public/data/tasks/${u.id}`), {
        assigneeId: u.to
      });
    }
    await batch.commit();
    console.log(`Committed ${Math.min(i + chunkSize, updates.length)}/${updates.length}`);
  }

  console.log('\nMigration completed.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
````

## File: src/components/auth/LoginScreen.tsx
````typescript
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db, appId } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldAlert, Zap, Lock, User, Heart } from 'lucide-react';
interface LoginScreenProps {
  authError?: string | null;
}
const ALLOWED_USERS = {
  tit: {
    email: 'dinhthai.ctv@gmail.com',
    name: 'Tit',
    photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tit&backgroundColor=b6e3f4'
  },
  tun: {
    email: 'transontruc.03@gmail.com',
    name: 'Tun',
    photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tun&backgroundColor=ffdfbf'
  }
};
const SECRET_PASS = '04102023';
export default function LoginScreen({ authError }: LoginScreenProps) {
  const [localError, setLocalError] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);
    const userKey = username.trim().toLowerCase();
    // 1. Kiểm tra 2 tài khoản cục bộ
    if (!ALLOWED_USERS[userKey]) {
       setLocalError('Sai tên đăng nhập! Chỉ có Tit và Tun mới được vào Nhà này nhé!');
       setIsLoading(false);
       return;
    }
    if (password !== SECRET_PASS) {
       setLocalError('Sai mật khẩu rồi! Mật khẩu là ngày kỉ niệm (04102023) cơ mà?!');
       setIsLoading(false);
       return;
    }
    const { email, name, photo } = ALLOWED_USERS[userKey];
    try {
      let result;
      try {
         // 2. Cố gắng đăng nhập bình thường
         result = await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
         // 3. Nếu là lần đầu vào chưa có tài khoản -> TỰ ĐỘNG KHỞI TẠO TK CHO 2 BẠN!
         if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName: name, photoURL: photo });
         } else {
            throw err;
         }
      }
      const user = result.user;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'team_members', user.uid), {
        uid: user.uid,
        displayName: user.displayName || name,
        photoURL: user.photoURL || photo,
        email: user.email,
        lastActive: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Login Error", error);
      if (error.code === 'auth/operation-not-allowed') {
         setLocalError('Bạn chưa BẬT Phương thức Đăng Nhập Email/Password trong Firebase Console!');
      } else if (error.code === 'auth/email-already-in-use') {
         setLocalError('Hệ thống đang xài tệp lưu cũ trong máy bạn! Hãy bấm vào Terminal (bảng đen chạy nãy giờ gõ lệnh npm run dev), bấm Ctrl + C để dừng, rồi gõ "npm run dev" để chạy lại. Xong lên web bấm F5 nhen!');
      } else {
         setLocalError('Mã máy chủ báo: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden">
      {}
      <Heart size={300} className="text-pink-500/5 absolute -top-10 -left-10 rotate-12" />
      <Heart size={400} className="text-pink-500/5 absolute -bottom-20 -right-20 -rotate-12" />
      <div className="max-w-md w-full text-center space-y-8 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
           <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-spin"></div>
           <Zap className="text-indigo-500 w-12 h-12 animate-pulse" />
        </div>
        <div>
           <h1 className="text-4xl font-black tracking-tight drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">TIT & TUN TASKS</h1>
           <p className="text-slate-400 font-medium mt-2">Góc làm việc riêng tư của 2 tụi mình!</p>
        </div>
        {authError && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-500 p-4 rounded-2xl flex items-start gap-3 mt-4 text-left">
                <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold">Lỗi Cấu Hình Firebase</p>
                  <p className="opacity-80">{authError}</p>
                </div>
            </div>
        )}
        {localError && (
            <div className="bg-amber-500/10 border border-amber-500/40 text-amber-500 p-4 rounded-2xl flex items-start gap-3 mt-4 text-left animate-in slide-in-from-top-4">
                <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold">Lỗi Đăng Nhập</p>
                  <p className="opacity-80 break-words">{localError}</p>
                </div>
            </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4 pt-6">
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <User size={20} className="text-slate-500" />
              </div>
              <input
                 type="text"
                 required
                 value={username}
                 onChange={e => setUsername(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold"
                 placeholder="Tên đăng nhập (tit hoặc tun)"
              />
           </div>
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Lock size={20} className="text-slate-500" />
              </div>
              <input
                 type="password"
                 required
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold tracking-widest"
                 placeholder="Mật khẩu bí mật"
              />
           </div>
           <button
             type="submit"
             disabled={isLoading}
             className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:opacity-90 transition-all shadow-xl shadow-pink-500/20 active:scale-95 disabled:opacity-50 mt-4"
           >
             {isLoading ? 'ĐANG VÀO NHÀ...' : 'VÀO LÀM VIỆC THÔI'}
           </button>
        </form>
      </div>
    </div>
  );
}
````

## File: src/components/auth/SplashScreen.tsx
````typescript
import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
export default function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
      <div className="relative z-10 flex flex-col items-center gap-8">
        {}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse" />
          <div className="relative w-24 h-24 bg-slate-900 border border-white/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-pink-500/10" />
            <Sparkles size={40} className="text-white animate-bounce" />
          </div>
        </div>
        {}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white/70 animate-fade-in">
            TIT & TUN TASKS
          </h1>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Loader2 size={14} className="text-indigo-400 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Initializing Experience
            </span>
          </div>
        </div>
      </div>
      {}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Powered by Gemini AI • Premium Productivity
        </p>
      </div>
    </div>
  );
}
````

## File: src/components/calendar/CalendarHeader.tsx
````typescript
import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, LayoutGrid, List, Eye, EyeOff, RefreshCw, Zap
} from 'lucide-react';
import { OWNER_STYLES } from '../../utils/calendarUtils';
import { UserData } from '../../utils/helpers';
interface CalendarHeaderProps {
  isDark: boolean;
  weekLabel: string;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  subWeeks: (date: Date, amount: number) => Date;
  addWeeks: (date: Date, amount: number) => Date;
  viewMode: 'grid' | 'weekly';
  setViewMode: (mode: 'grid' | 'weekly') => void;
  goToday: () => void;
  showTit: boolean;
  setShowTit: (val: boolean) => void;
  showTun: boolean;
  setShowTun: (val: boolean) => void;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  userData: UserData;
  fetchEvents: () => void;
  loading: boolean;
}
export default function CalendarHeader({
  isDark, weekLabel, currentDate, setCurrentDate, subWeeks, addWeeks,
  viewMode, setViewMode, goToday, showTit, setShowTit, showTun, setShowTun,
  onUpdateSettings, userData, fetchEvents, loading
}: CalendarHeaderProps) {
  const autoSync = userData?.autoSyncCalendar === true;
  return (
    <div className={`p-4 md:p-6 rounded-3xl ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(d => subWeeks(d, 1))}
              className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
              <ChevronLeft size={18} />
            </button>
            <div className="text-center min-w-[140px]">
              <h3 className="font-black text-sm">{weekLabel}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {format(currentDate, 'MMMM yyyy', { locale: vi })}
              </p>
            </div>
            <button onClick={() => setCurrentDate(d => addWeeks(d, 1))}
              className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>
              <ChevronRight size={18} />
            </button>
          </div>
          <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-slate-900/50' : 'bg-slate-100/50'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
                ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Lưới
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
                ${viewMode === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={14} /> Tổng quan
            </button>
          </div>
          <button onClick={goToday}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            Hôm nay
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {}
          <button onClick={() => onUpdateSettings({ autoSyncCalendar: !autoSync })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
              ${autoSync ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-slate-500/10 text-slate-400 border border-transparent'}`}>
            <Zap size={12} className={autoSync ? 'fill-amber-500' : ''} />
            {autoSync ? 'Auto Sync ON' : 'Auto Sync OFF'}
          </button>
          <button onClick={() => {
            const newVal = !showTit;
            setShowTit(newVal);
            onUpdateSettings({ calendarVisibility: { ...userData?.calendarVisibility, tit: newVal } });
          }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
              ${showTit ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'bg-slate-500/10 text-slate-400 border border-transparent'}`}>
            {showTit ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className={`w-2 h-2 rounded-full ${OWNER_STYLES.tit.dot}`} /> Tít
          </button>
          <button onClick={() => {
            const newVal = !showTun;
            setShowTun(newVal);
            onUpdateSettings({ calendarVisibility: { ...userData?.calendarVisibility, tun: newVal } });
          }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all
              ${showTun ? 'bg-pink-500/20 text-pink-500 border border-pink-500/30' : 'bg-slate-500/10 text-slate-400 border border-transparent'}`}>
            {showTun ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className={`w-2 h-2 rounded-full ${OWNER_STYLES.tun.dot}`} /> Tún
          </button>
          <button onClick={fetchEvents} disabled={loading}
            className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
````

## File: src/components/calendar/CalendarSubComponents.tsx
````typescript
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { HOUR_HEIGHT, DAY_START_HOUR, DAY_END_HOUR, OWNER_STYLES } from '../../utils/calendarUtils';
import { CalendarEvent, Task } from '../../utils/helpers';
export function TimeNowIndicator() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = ((minutes - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
  if (top < 0 || top > (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT) return null;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg shadow-red-500/50" />
        <div className="flex-1 h-[2px] bg-red-500/80" />
      </div>
    </div>
  );
}
export function EventBlock({ event }: { event: CalendarEvent }) {
  if (!event.start || !event.end || event.isAllDay) return null;
  const startMin = event.start.getHours() * 60 + event.start.getMinutes();
  const endMin = event.end.getHours() * 60 + event.end.getMinutes();
  const top = ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max(24, ((endMin - startMin) / 60) * HOUR_HEIGHT);
  const style = OWNER_STYLES[event.owner] || OWNER_STYLES.tit;
  const timeStr = `${format(event.start, 'HH:mm')} – ${format(event.end, 'HH:mm')}`;
  return (
    <div
      className={`absolute left-1 right-1 rounded-xl px-2 py-1.5 overflow-hidden cursor-default
        bg-gradient-to-br ${style.gradient} text-white shadow-lg
        border border-white/10 transition-all hover:scale-[1.02] hover:shadow-xl hover:z-30`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '24px' }}
      title={`${event.title}\n${timeStr}${event.location ? '\n📍 ' + event.location : ''}`}
    >
      <p className="text-[10px] font-black leading-tight truncate">{event.title}</p>
      {height > 36 && <p className="text-[9px] opacity-80 font-semibold mt-0.5">{timeStr}</p>}
      {height > 54 && event.location && <p className="text-[8px] opacity-60 mt-0.5 truncate">📍 {event.location}</p>}
    </div>
  );
}
export function AllDayEvent({ event }: { event: CalendarEvent }) {
  const style = OWNER_STYLES[event.owner] || OWNER_STYLES.tit;
  return (
    <div className={`px-2 py-1 rounded-lg text-[9px] font-bold text-white bg-gradient-to-r ${style.gradient} truncate mb-0.5`}>
      {event.title}
    </div>
  );
}
export function TaskDeadlineMarker({ task, isDark }: { task: Task; isDark: boolean }) {
  if (!task.deadline) return null;
  const d = new Date(task.deadline);
  const min = d.getHours() * 60 + d.getMinutes();
  const top = ((min - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT;
  if (top < 0) return null;
  return (
    <div
      className={`absolute left-1 right-1 rounded-lg px-2 py-1 z-10
        ${task.status === 'completed' ? 'opacity-40' : ''}
        ${isDark ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}
      style={{ top: `${top}px`, height: '24px' }}
      title={`Task: ${task.title}`}
    >
      <p className={`text-[9px] font-bold truncate flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
        {task.status === 'completed' ? '✅' : '📌'} {task.title}
      </p>
    </div>
  );
}
````

## File: src/components/calendar/CalendarView.tsx
````typescript
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  startOfWeek, addDays, addWeeks, subWeeks,
  isSameDay, startOfDay, endOfDay, format
} from 'date-fns';
import { parseGCalEvent } from '../../utils/calendarUtils';
import { ASSIGNEES } from '../../utils/constants';
import { addTask } from '../../services/taskService';
import { getLegacyIdByEmail, Task, TeamMember, CalendarEvent } from '../../utils/helpers';
import SetupGuide from './SetupGuide';
import CalendarHeader from './CalendarHeader';
import GridView from './GridView';
import WeeklyOverview from './WeeklyOverview';
import { useTaskActionContext } from '../../contexts/TaskActionContext';
type OwnerKey = keyof typeof ASSIGNEES;
const isOwnerKey = (value: unknown): value is OwnerKey =>
  typeof value === 'string' && value in ASSIGNEES;
interface CalendarViewProps {
  isDark: boolean;
  calendarApiKey: string | null;
  calendarIdTit: string | null;
  calendarIdTun: string | null;
  appsScriptUrl: string | null;
  tasks: Task[];
  teamMembers: TeamMember[];
  currentAssigneeId: string | null;
  now: number;
  aiLoading: boolean;
  userData: any;
  onUpdateSettings: (updates: any) => void;
}
export default function CalendarView({
  isDark, calendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl, tasks,
  teamMembers, currentAssigneeId, now, aiLoading,
  userData, onUpdateSettings
}: CalendarViewProps) {
  const {
    toggleTaskStatus,
    handleDeleteTask,
    handlePriorityChange,
    handleUpdateDeadline,
    handleRenameTask,
    handleSubTaskAction,
    handleUpdateTask,
    handleAiSubtasks
  } = useTaskActionContext();
  const onStart = (id: string) => toggleTaskStatus(id, 'start');
  const onPause = (id: string) => toggleTaskStatus(id, 'pause');
  const onComplete = (id: string) => toggleTaskStatus(id, 'complete');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTit, setShowTit] = useState(userData?.calendarVisibility?.tit !== false);
  const [showTun, setShowTun] = useState(userData?.calendarVisibility?.tun !== false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'grid'>('weekly');
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  useEffect(() => {
    if (userData?.calendarVisibility) {
      const tit = userData.calendarVisibility.tit !== false;
      const tun = userData.calendarVisibility.tun !== false;
      requestAnimationFrame(() => {
        setShowTit((curr: boolean) => curr === tit ? curr : tit);
        setShowTun((curr: boolean) => curr === tun ? curr : tun);
      });
    }
  }, [userData?.calendarVisibility]);
  const fetchEvents = useCallback(async () => {
    if (!appsScriptUrl && !calendarApiKey) return;
    setLoading(true);
    setError(null);
    const tMin = startOfDay(weekStart);
    const tMax = endOfDay(addDays(weekStart, 6));
    const fetchViaAppsScript = async (calId: string, owner: string) => {
      if (!calId) return [];
      const params = new URLSearchParams({
        calendarId: calId,
        timeMin: tMin.toISOString(),
        timeMax: tMax.toISOString(),
      });
      const url = `${appsScriptUrl}?${params}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        if (data.error) return [];
        return (data.items || []).map((e: any) => parseGCalEvent(e, owner));
      } catch { return []; }
    };
    const fetchViaDirectApi = async (calId: string, owner: string) => {
      if (!calId) return [];
      const params = new URLSearchParams({
        key: calendarApiKey as string,
        timeMin: tMin.toISOString(),
        timeMax: tMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params}`;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          setError(prev => (prev ? prev + ' | ' : '') + `${owner}: ${errBody?.error?.message || res.status}`);
          return [];
        }
        const data = await res.json();
        return (data.items || []).map((e: any) => parseGCalEvent(e, owner));
      } catch { return []; }
    };
    const fetchOne = async (calId: string | null, owner: string) => {
      if (!calId) return [];
      if (appsScriptUrl) {
        const res = await fetchViaAppsScript(calId, owner);
        if (res.length > 0) return res;
      }
      if (calendarApiKey) return await fetchViaDirectApi(calId, owner);
      return [];
    };
    const [titEvents, tunEvents] = await Promise.all([
      fetchOne(calendarIdTit, 'tit'),
      fetchOne(calendarIdTun, 'tun'),
    ]);
    setEvents([...titEvents, ...tunEvents].filter(e => e.start && e.end));
    setLoading(false);
  }, [weekStart, calendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl]);
  useEffect(() => {
    const timer = setTimeout(() => fetchEvents(), 0);
    const handleFocus = () => fetchEvents();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchEvents]);
  useEffect(() => {
    if (!scrollRef.current) return;
    const scrollTo = (new Date().getHours() - 6) * 64;
    scrollRef.current.scrollTop = Math.max(0, scrollTo);
  }, [viewMode]);
  const visibleEvents = events.filter(e => (e.owner === 'tit' && showTit) || (e.owner === 'tun' && showTun));
  const getEventsForDay = (day: Date) => visibleEvents.filter(e => !e.isAllDay && isSameDay(e.start!, day));
  const getAllDayForDay = (day: Date) => visibleEvents.filter(e => e.isAllDay && isSameDay(e.start!, day));
  const getTasksForDay = (day: Date) => (tasks || []).filter(t => {
    if (!t.deadline || !isSameDay(new Date(t.deadline), day)) return false;
    if (t.status === 'completed' || t.status === 'completed_late') return false;
    const member = teamMembers?.find(m => m.uid === t.assigneeId);
    const legacyId = getLegacyIdByEmail(member?.email) || (t.assigneeId === 'tit' || t.assigneeId === 'tun' ? t.assigneeId : null);
    if (legacyId === 'tit') return showTit;
    if (legacyId === 'tun') return showTun;
    return true;
  });
  const handleConvertEventToTask = async (event: CalendarEvent) => {
    if (!event.start || !event.end) return;
    try {
      const durationMins = Math.max(25, Math.round((event.end.getTime() - event.start.getTime()) / 60000));
      const assignee = teamMembers?.find(m => {
        if (!m?.email) return false;
        const legacyId = (m.email.toLowerCase() === 'dinhthai.ctv@gmail.com') ? 'tit' :
                         (m.email.toLowerCase() === 'transontruc.03@gmail.com') ? 'tun' : null;
        return legacyId === event.owner;
      });
      const newTask: any = {
        title: event.title,
        createdBy: userData?.uid || "local-user",
        creatorName: userData?.displayName || "System",
        assigneeId: assignee?.uid || event.owner,
        assigneeName: assignee?.displayName || (isOwnerKey(event.owner) ? ASSIGNEES[event.owner].name : event.owner),
        assigneePhoto: assignee?.photoURL || (isOwnerKey(event.owner) ? ASSIGNEES[event.owner].photo : null),
        deadline: event.end.getTime(),
        scheduledStartTime: event.start.getTime(),
        scheduledEndTime: event.end.getTime(),
        priority: 'medium',
        timerType: 'countdown',
        limitTime: durationMins,
        isDone: false,
        status: 'idle',
        totalTrackedTime: 0,
        createdAt: Date.now(),
        subTasks: []
      };
      const docRef = await addTask(newTask);
      if (docRef?.id && onStart) {
        setTimeout(() => onStart(docRef.id), 500);
      }
    } catch (e) {
      console.error("Lỗi chuyển đổi Event thành Task:", e);
    }
  };
  if (!calendarApiKey && !appsScriptUrl) return <SetupGuide isDark={isDark} />;
  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
      <CalendarHeader
        isDark={isDark}
        weekLabel={`${format(weekStart, 'dd/MM')} – ${format(addDays(weekStart, 6), 'dd/MM/yyyy')}`}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        subWeeks={subWeeks}
        addWeeks={addWeeks}
        viewMode={viewMode}
        setViewMode={setViewMode}
        goToday={() => { setCurrentDate(new Date()); setSelectedDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); }}
        showTit={showTit} setShowTit={setShowTit}
        showTun={showTun} setShowTun={setShowTun}
        onUpdateSettings={onUpdateSettings}
        userData={userData}
        fetchEvents={fetchEvents}
        loading={loading}
      />
      {viewMode === 'grid' ? (
        <GridView
          isDark={isDark} loading={loading} error={error}
          visibleEvents={visibleEvents} weekDays={weekDays}
          getAllDayForDay={getAllDayForDay}
          getEventsForDay={getEventsForDay}
          getTasksForDay={getTasksForDay}
          scrollRef={scrollRef}
        />
      ) : (
        <WeeklyOverview
          isDark={isDark} weekDays={weekDays} events={visibleEvents} tasks={tasks}
          selectedDay={selectedDay} onSelectDay={setSelectedDay}
          getEventsForDay={getEventsForDay} getTasksForDay={getTasksForDay}
          onStart={onStart} onPause={onPause} onComplete={onComplete}
          onDelete={handleDeleteTask} onPriorityChange={(id, priority) => { handlePriorityChange(id, priority); }}
          onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask}
          onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction}
          onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks}
          now={now}
          aiLoading={aiLoading}
          onConvertEventToTask={handleConvertEventToTask}
          loading={loading} error={error}
          currentAssigneeId={currentAssigneeId}
          teamMembers={teamMembers}
          userEmail={userData?.email}
        />
      )}
      <div className="flex justify-center">
        <a href="https://calendar.google.com" target="_blank" rel="noopener"
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all hover:scale-105
            ${isDark ? 'bg-slate-800/50 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}>
          <ExternalLink size={14} /> Mở Google Calendar để thêm lịch
        </a>
      </div>
    </div>
  );
}
````

## File: src/components/calendar/GridView.tsx
````typescript
import React from 'react';
import { format, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { HOURS, DAY_START_HOUR, HOUR_HEIGHT } from '../../utils/calendarUtils';
import { TimeNowIndicator, EventBlock, TaskDeadlineMarker, AllDayEvent } from './CalendarSubComponents';
import { CalendarEvent, Task } from '../../utils/helpers';
interface GridViewProps {
  isDark: boolean;
  loading: boolean;
  error: string | null;
  visibleEvents: CalendarEvent[];
  weekDays: Date[];
  getAllDayForDay: (day: Date) => CalendarEvent[];
  getEventsForDay: (day: Date) => CalendarEvent[];
  getTasksForDay: (day: Date) => Task[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}
export default function GridView({
  isDark, loading, error, visibleEvents, weekDays,
  getAllDayForDay, getEventsForDay, getTasksForDay, scrollRef
}: GridViewProps) {
  return (
    <div className={`rounded-3xl overflow-hidden ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
      {loading && (
        <div className="flex items-center justify-center gap-2 p-3 text-xs font-bold text-indigo-500">
          <Loader2 size={14} className="animate-spin" /> Đang tải lịch...
        </div>
      )}
      {error && !loading && (
        <div className={`flex items-center justify-center gap-2 p-3 text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-500'}`}>
          ⚠️ {error}
        </div>
      )}
      {}
      {visibleEvents.some(e => e.isAllDay) && (
        <div className={`grid grid-cols-[60px_repeat(7,1fr)] border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
          <div className="flex items-center justify-center text-[9px] font-bold text-slate-500 uppercase">
            Cả ngày
          </div>
          {weekDays.map((day, i) => (
            <div key={i} className={`p-1.5 min-h-[28px] ${isDark ? 'border-slate-700/30' : 'border-slate-200/30'} border-l`}>
              {getAllDayForDay(day).map(e => <AllDayEvent key={e.id} event={e} />)}
            </div>
          ))}
        </div>
      )}
      <div ref={scrollRef} className="calendar-scroll overflow-y-auto max-h-[70vh]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-0">
          <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: `${(h - DAY_START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                <span className={`text-[10px] font-bold -mt-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>
          {weekDays.map((day, i) => (
            <div key={i}
              className={`relative ${isDark ? 'border-slate-700/30' : 'border-slate-200/30'} border-l`}
              style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
            >
              <div className={`sticky top-0 z-10 flex flex-col items-center py-2 border-b backdrop-blur-md
                ${isToday(day)
                  ? (isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50/90 border-indigo-200')
                  : (isDark ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white/90 border-slate-200/50')}`}>
                <span className={`text-[9px] font-bold uppercase ${isToday(day) ? 'text-indigo-500' : 'text-slate-500'}`}>
                  {format(day, 'EEE', { locale: vi })}
                </span>
                <span className={`text-lg font-black ${isToday(day) ? 'text-indigo-500' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>
              {HOURS.map(h => (
                <div key={h}
                  className={`absolute left-0 right-0 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200/60'}`}
                  style={{ top: `${(h - DAY_START_HOUR) * HOUR_HEIGHT}px` }}
                />
              ))}
              {isToday(day) && <TimeNowIndicator />}
              <div className="absolute inset-0">
                {getEventsForDay(day).map(e => <EventBlock key={e.id} event={e} isDark={isDark} />)}
                {getTasksForDay(day).map(t => <TaskDeadlineMarker key={t.id} task={t} isDark={isDark} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
````

## File: src/components/calendar/SetupGuide.tsx
````typescript
import React from 'react';
import { Calendar as CalIcon, ExternalLink } from 'lucide-react';
interface SetupGuideProps {
  isDark: boolean;
}
export default function SetupGuide({ isDark }: SetupGuideProps) {
  return (
    <div className={`p-8 rounded-[2.5rem] text-center space-y-6 ${isDark ? 'bg-slate-800/60 border border-slate-700' : 'bg-white border shadow-xl'}`}>
      <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg">
        <CalIcon size={36} className="text-white" />
      </div>
      <h3 className="text-xl font-black">Kết Nối Google Calendar</h3>
      <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Để hiển thị lịch trình của Tít & Tún, bạn cần cấu hình 3 biến môi trường trong file <code className="px-1.5 py-0.5 rounded bg-slate-700/50 text-indigo-400 text-xs">.env</code>:
      </p>
      <div className={`text-left p-5 rounded-2xl font-mono text-xs space-y-2 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-slate-50 border'}`}>
        <p><span className="text-emerald-500">VITE_GOOGLE_CALENDAR_API_KEY</span>=<span className="text-slate-400">your_api_key</span></p>
        <p><span className="text-indigo-400">VITE_CALENDAR_ID_TIT</span>=<span className="text-slate-400">dinhthai.ctv@gmail.com</span></p>
        <p><span className="text-pink-400">VITE_CALENDAR_ID_TUN</span>=<span className="text-slate-400">transontruc.03@gmail.com</span></p>
      </div>
      <div className={`text-left p-5 rounded-2xl text-xs space-y-3 ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
        <p className="font-black text-indigo-500 uppercase tracking-widest text-[10px]">Hướng dẫn nhanh</p>
        <ol className={`list-decimal list-inside space-y-2 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <li>Vào <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-indigo-500 underline">Google Cloud Console</a> → Tạo API Key</li>
          <li>Bật <strong>Google Calendar API</strong> trong Library</li>
          <li>Mỗi người vào Google Calendar → Settings → chọn calendar → <strong>"Make available to public"</strong></li>
          <li>Copy Calendar ID (thường là email) vào file <code className="text-indigo-400">.env</code></li>
          <li>Restart dev server (<code className="text-indigo-400">npm run dev</code>)</li>
        </ol>
      </div>
      <div className="flex justify-center">
        <a href="https://calendar.google.com" target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-black text-sm hover:opacity-90 transition-all shadow-lg"
        >
          <ExternalLink size={16} /> Mở Google Calendar
        </a>
      </div>
    </div>
  );
}
````

## File: src/components/calendar/WeeklyOverview.tsx
````typescript
import React from 'react';
import { format, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Calendar as CalIcon, Clock, Settings, List } from 'lucide-react';
import { OWNER_STYLES } from '../../utils/calendarUtils';
import WeeklyTaskCard from './WeeklyTaskCard';
import { Task, TeamMember, CalendarEvent } from '../../utils/helpers';
type OwnerKey = keyof typeof OWNER_STYLES;
const isOwnerKey = (value: unknown): value is OwnerKey =>
  typeof value === 'string' && value in OWNER_STYLES;
interface WeeklyOverviewProps {
  isDark: boolean;
  weekDays: Date[];
  events: CalendarEvent[];
  tasks: Task[];
  selectedDay: number;
  onSelectDay: (idx: number) => void;
  getEventsForDay: (day: Date) => CalendarEvent[];
  getTasksForDay: (day: Date) => Task[];
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  currentAssigneeId: string | null;
  teamMembers: TeamMember[];
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority?: string) => void;
  onUpdateDeadline: (id: string, deadline: string) => void;
  onRenameTask: (id: string, title: string) => void;
  onSubTaskAdd: (
    taskId: string,
    subTaskId: string | null,
    action: 'add' | 'toggle' | 'rename' | 'delete',
    title?: string
  ) => Promise<void>;
  onSubTaskToggle: (
    taskId: string,
    subTaskId: string,
    action: 'add' | 'toggle' | 'rename' | 'delete',
    title?: string
  ) => Promise<void>;
  onSubTaskDelete: (
    taskId: string,
    subTaskId: string,
    action: 'add' | 'toggle' | 'rename' | 'delete'
  ) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAiSubtasks: (taskId: string, title: string) => void;
  now: number;
  aiLoading: boolean;
  loading: boolean;
  error: string | null;
  onConvertEventToTask: (event: CalendarEvent) => void;
  userEmail: string | null | undefined;
}
export default function WeeklyOverview({
  isDark, weekDays, events, tasks, selectedDay, onSelectDay, getEventsForDay, getTasksForDay,
  onStart, onPause, onComplete, currentAssigneeId, teamMembers,
  onDelete, onPriorityChange, onUpdateDeadline, onRenameTask,
  onSubTaskAdd, onSubTaskToggle, onSubTaskDelete, onUpdateTask, onAiSubtasks,
  now, aiLoading, loading, error, onConvertEventToTask, userEmail
}: WeeklyOverviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {loading && (
        <div className="flex items-center justify-center gap-2 p-3 text-xs font-bold text-indigo-500 animate-pulse">
          <Loader2 size={14} className="animate-spin" /> Đang cập nhật lịch trình...
        </div>
      )}
      {error && !loading && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
          ⚠️ Lỗi đồng bộ: {error}
        </div>
      )}
      {}
      <div className={`p-2 rounded-[2rem] ${isDark ? 'glass-dark border border-slate-700/50' : 'glass-light shadow-xl border border-white/20'} flex gap-2 overflow-x-auto no-scrollbar`}>
        {weekDays.map((day, i) => {
          const active = selectedDay === i;
          const today = isToday(day);
          return (
            <button
              key={i}
              onClick={() => onSelectDay(i)}
              className={`flex-1 min-w-[90px] p-4 rounded-3xl transition-all flex flex-col items-center gap-1.5 relative
                ${active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105 z-10'
                  : isDark
                    ? 'hover:bg-slate-800/80 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-indigo-200' : 'text-slate-500'}`}>
                {format(day, 'EEE', { locale: vi })}
              </span>
              <span className="text-xl font-black">{format(day, 'd')}</span>
              <span className={`text-[9px] font-bold ${active ? 'text-indigo-300' : 'text-slate-500/60'}`}>
                Tháng {format(day, 'MM')}
              </span>
              {today && !active && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
              {today && active && (
                <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-amber-400 text-[8px] font-black text-indigo-900 uppercase tracking-tighter shadow-sm">
                  Hôm nay
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className={`p-8 rounded-[3rem] ${isDark ? 'glass-dark border border-slate-700/30' : 'glass-light shadow-2xl border border-white/20'} min-h-[450px]`}>
          <h4 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center"><CalIcon size={18} /></div>
            Lịch trình ngày {format(weekDays[selectedDay], 'd/MM')}
          </h4>
          <div className="space-y-4 animate-in fade-in duration-700">
            {getEventsForDay(weekDays[selectedDay]).length > 0 ? (
              getEventsForDay(weekDays[selectedDay]).map((event, idx) => {
                const style = isOwnerKey(event.owner) ? OWNER_STYLES[event.owner] : OWNER_STYLES.tit;
                return (
                  <div key={event.id}
                    className={`group p-5 rounded-[2rem] border transition-all hover:scale-[1.02] active:scale-95 animate-in slide-in-from-right-4 duration-300
                      ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'} relative overflow-hidden [animation-delay:${idx * 50}ms]`}
                  >
                    <div className="flex items-start gap-4 pr-10">
                      <div className={`mt-1 w-12 h-12 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0`}>
                        <Clock size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-black text-base mb-1 truncate group-hover:text-indigo-400 transition-colors">{event.title}</h5>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                          <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-500/5"><Clock size={12} className="text-indigo-500" /> {event.start ? format(event.start, 'HH:mm') : '--:--'} – {event.end ? format(event.end, 'HH:mm') : '--:--'}</span>
                          {event.location && <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-500/5 truncate max-w-[150px]"><Settings size={12} className="text-pink-500" /> {event.location}</span>}
                        </div>
                      </div>
                      <div className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${event.owner === 'tit' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'}`}>
                        {style.label}
                      </div>
                    </div>
                    {}
                    <button
                      onClick={(e) => { e.stopPropagation(); onConvertEventToTask && onConvertEventToTask(event); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95"
                      title="Chuyển thành Task"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-72 text-center space-y-6 animate-pulse">
                <div className={`w-20 h-20 rounded-[2rem] ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} flex items-center justify-center text-slate-600`}>
                  <CalIcon size={40} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Trống lịch trình</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 italic">Tận hưởng thời gian nghỉ ngơi nhé!</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {}
        <div className={`p-8 rounded-[3rem] ${isDark ? 'glass-dark border border-slate-700/30' : 'glass-light shadow-2xl border border-white/20'} min-h-[450px]`}>
          <h4 className="text-sm font-black uppercase tracking-widest text-rose-500 mb-8 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center"><List size={18} /></div>
            Công việc hạn {format(weekDays[selectedDay], 'd/MM')}
          </h4>
          <div className="space-y-4 animate-in fade-in duration-700">
            {getTasksForDay(weekDays[selectedDay]).length > 0 ? (
              getTasksForDay(weekDays[selectedDay]).map((task) => (
                <WeeklyTaskCard
                  key={task.id}
                  task={task}
                  currentAssigneeId={currentAssigneeId}
                  teamMembers={teamMembers}
                  userEmail={userEmail}
                  isDark={isDark}
                  now={now}
                  aiLoading={aiLoading}
                  onStart={onStart}
                  onPause={onPause}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  onPriorityChange={onPriorityChange}
                  onUpdateDeadline={onUpdateDeadline}
                  onRenameTask={onRenameTask}
                  onSubTaskAdd={onSubTaskAdd}
                  onSubTaskToggle={onSubTaskToggle}
                  onSubTaskDelete={onSubTaskDelete}
                  onUpdateTask={onUpdateTask}
                  onAiSubtasks={onAiSubtasks}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-72 text-center space-y-6 animate-pulse">
                <div className={`w-20 h-20 rounded-[2rem] ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'} flex items-center justify-center text-slate-600`}>
                  <List size={40} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không có deadline</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 italic">Bạn đang kiểm soát rất tốt!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
````

## File: src/components/calendar/WeeklyTaskCard.tsx
````typescript
import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import {
  Play, Pause, Check, Trash2, Pencil, X, BrainCircuit, Circle, CheckCircle2, Clock, Timer, Calendar
} from 'lucide-react';
import { formatDuration, getLegacyIdByEmail, Task, TeamMember } from '../../utils/helpers';
import { TimerSettingsPopover } from '../tasks/subcomponents/TaskComponents';
interface WeeklyTaskCardProps {
  task: Task;
  currentAssigneeId: string | null;
  teamMembers: TeamMember[];
  userEmail: string | null | undefined;
  isDark: boolean;
  aiLoading: boolean;
  now: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority?: string) => void;
  onUpdateDeadline: (id: string, deadline: string) => void;
  onRenameTask: (id: string, title: string) => void;
  onSubTaskAdd: (
    taskId: string,
    subTaskId: string | null,
    action: 'add' | 'toggle' | 'rename' | 'delete',
    title?: string
  ) => Promise<void>;
  onSubTaskToggle: (
    taskId: string,
    subTaskId: string,
    action: 'add' | 'toggle' | 'rename' | 'delete',
    title?: string
  ) => Promise<void>;
  onSubTaskDelete: (
    taskId: string,
    subTaskId: string,
    action: 'add' | 'toggle' | 'rename' | 'delete'
  ) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onAiSubtasks: (taskId: string, title: string) => void;
}
export default function WeeklyTaskCard({
  task, currentAssigneeId, teamMembers, userEmail, isDark, aiLoading, now,
  onStart, onPause, onComplete, onDelete, onPriorityChange, onUpdateDeadline, onRenameTask,
  onSubTaskAdd, onSubTaskToggle, onSubTaskDelete, onUpdateTask, onAiSubtasks
}: WeeklyTaskCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);
  const [tempDeadline, setTempDeadline] = useState(task.deadline ? new Date(task.deadline - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');
  const legacyId = getLegacyIdByEmail(userEmail);
  const assigneeMember = teamMembers?.find(m => m.uid === task.assigneeId);
  const taskLegacyId = getLegacyIdByEmail(assigneeMember?.email) || (task.assigneeId === 'tit' || task.assigneeId === 'tun' ? task.assigneeId : null);
  const isAssignedToMe = task.assigneeId === currentAssigneeId || (task.assigneeId && taskLegacyId === legacyId);
  const isCreator = task.createdBy === currentAssigneeId;
  const isLocked = !!(task.assigneeId && !isAssignedToMe && !isCreator);
  const assigneeDisplayName = task.assigneeName || (taskLegacyId === 'tit' ? 'Tít' : taskLegacyId === 'tun' ? 'Tún' : 'Chưa gán');
  const handleTitleSubmit = () => {
    const val = editTitleRef.current?.value?.trim();
    if (val && val !== task.title) onRenameTask(task.id, val);
    setIsEditingTitle(false);
  };
  const handleDeadlineSubmit = () => {
    if (tempDeadline) onUpdateDeadline(task.id, tempDeadline);
    setIsEditingDeadline(false);
  };
  const elapsed = task.status === 'running' ? (task.totalTrackedTime || 0) + (now - (task.lastStartTime || now)) : (task.totalTrackedTime || 0);
  const displayTime = task.type === 'countdown' ? Math.max(0, (task.limitTime || 0) - elapsed) : elapsed;
  const isWorking = task.status === 'running';
  return (
    <div className={`group p-5 rounded-[2rem] border transition-all hover:scale-[1.01] animate-in slide-in-from-left-4 duration-300
      ${task.status === 'completed' ? 'opacity-60 grayscale-[0.3]' : ''}
      ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:rotate-12 flex-shrink-0
          ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
          {task.status === 'completed' ? '✅' : (task.priority === 'high' ? '🔥' : '📌')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                ref={editTitleRef}
                defaultValue={task.title}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                placeholder="Tiêu đề công việc"
                title="Sửa tiêu đề công việc"
                className={`flex-1 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-1 outline-none text-base font-black ${isDark ? 'text-white' : 'text-slate-800'}`}
              />
            ) : (
              <h5
                onClick={() => !isLocked && setIsEditingTitle(true)}
                className={`font-black text-base truncate cursor-text flex items-center gap-2 ${task.status === 'completed' ? 'line-through text-slate-500' : 'group-hover:text-indigo-500'} transition-colors`}
              >
                {task.title}
                {!isLocked && <Pencil size={12} className="opacity-0 group-hover:opacity-100 text-slate-400" />}
              </h5>
            )}
            {!isLocked && (
              <button onClick={() => onDelete(task.id)} title="Xóa task" className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
            <button
              onClick={() => !isLocked && onPriorityChange(task.id, task.priority)}
              disabled={isLocked}
              title={`Đổi mức độ ưu tiên (Hiện tại: ${task.priority || 'vừa'})`}
              className={`px-2 py-0.5 rounded-lg border transition-all ${isLocked ? 'cursor-default' : 'hover:scale-105 active:scale-95'} ${task.priority === 'high' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-500/5 border-slate-500/10'}`}
            >
              {task.priority || 'vừa'}
            </button>
            <span className={`px-2 py-0.5 rounded-lg border ${taskLegacyId === 'tit' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : (taskLegacyId === 'tun' ? 'bg-pink-500/10 text-pink-500 border-pink-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20')}`}>
              {assigneeDisplayName}
            </span>
            <div className="flex items-center">
              {isEditingDeadline ? (
                <input
                  type="datetime-local"
                  value={tempDeadline}
                  onChange={(e) => setTempDeadline(e.target.value)}
                  onBlur={handleDeadlineSubmit}
                  autoFocus
                  placeholder="Chọn thời hạn"
                  title="Đặt thời hạn hoàn thành"
                  className={`bg-indigo-500/10 border border-indigo-500/30 rounded px-1 py-0.5 outline-none text-[10px] ${isDark ? 'text-indigo-300 [color-scheme:dark]' : 'text-indigo-600 [color-scheme:light]'}`}
                />
              ) : (
                <button
                  onClick={() => !isLocked && setIsEditingDeadline(true)}
                  className={`flex items-center gap-1 hover:text-indigo-500 transition-colors ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <Calendar size={12} /> {task.deadline ? format(new Date(task.deadline), 'HH:mm dd/MM') : 'Hạn'}
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <button
                onClick={() => !isLocked && task.status !== 'completed' && setIsSettingsOpen(!isSettingsOpen)}
                disabled={isLocked || task.status === 'completed'}
                title="Cài đặt thời gian"
                className={`flex items-center gap-1 font-mono transition-all group/timer ${isWorking ? 'text-indigo-500' : 'text-slate-500'} ${(!isLocked && task.status !== 'completed') ? 'hover:text-indigo-400' : ''}`}
              >
                {task.type === 'countdown' ? <Timer size={12} className={isWorking ? 'animate-spin' : ''} /> : <Clock size={12} className={isWorking ? 'animate-spin' : ''} />}
                {formatDuration(displayTime)}
              </button>
              {isSettingsOpen && (
                <TimerSettingsPopover task={task} isDark={isDark} onUpdateTask={onUpdateTask} onClose={() => setIsSettingsOpen(false)} />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.status !== 'completed' && (
            <>
              {task.status === 'running' ? (
                <button
                  onClick={() => !isLocked && onPause(task.id)}
                  disabled={isLocked}
                  className={`p-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 ${!isLocked ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-slate-500/10 text-slate-400 opacity-50 cursor-not-allowed'}`}
                  title={!isLocked ? "Tạm dừng" : "Chỉ người nhận việc mới được tương tác"}
                >
                  <Pause size={16} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={() => !isLocked && onStart(task.id)}
                  disabled={isLocked}
                  className={`p-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 ${!isLocked ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-slate-500/10 text-slate-400 opacity-50 cursor-not-allowed'}`}
                  title={!isLocked ? "Bắt đầu" : "Chỉ người nhận việc mới được tương tác"}
                >
                  <Play size={16} fill="currentColor" />
                </button>
              )}
              <button
                onClick={() => !isLocked && onComplete(task.id)}
                disabled={isLocked}
                className={`p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 ${!isLocked ? 'bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500 hover:text-white' : 'bg-slate-500/10 text-slate-400 opacity-50 cursor-not-allowed'}`}
                title={!isLocked ? "Hoàn thành" : "Chỉ người nhận việc mới được tương tác"}
              >
                <Check size={16} strokeWidth={3} />
              </button>
            </>
          )}
          {task.status === 'completed' && (
            <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500">
              <Check size={20} strokeWidth={3} />
            </div>
          )}
        </div>
      </div>
      {((task.subTasks && task.subTasks.length > 0) || (task.status !== 'completed' && !isLocked)) && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
          {(task.subTasks || []).map(sub => (
            <div key={sub.id} className="flex items-center gap-2 group/sub">
              <button
                onClick={() => !isLocked && task.status !== 'completed' && onSubTaskToggle(task.id, sub.id, 'toggle')}
                disabled={isLocked || task.status === 'completed'}
                title={sub.isDone ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"}
                className={`transition-colors ${sub.isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
              >
                {sub.isDone ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              </button>
              {editingSubTaskId === sub.id ? (
                <input
                  autoFocus
                  type="text"
                  defaultValue={sub.title}
                  onBlur={(e) => {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) onSubTaskToggle(task.id, sub.id, 'rename', val);
                    setEditingSubTaskId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) onSubTaskToggle(task.id, sub.id, 'rename', val);
                      setEditingSubTaskId(null);
                    }
                  }}
                  placeholder="Tên việc nhỏ..."
                  title="Sửa tên việc nhỏ"
                  className={`flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5 outline-none text-[11px] ${isDark ? 'text-white' : 'text-slate-800'}`}
                />
              ) : (
                <span
                  onClick={() => !isLocked && task.status !== 'completed' && setEditingSubTaskId(sub.id)}
                  className={`text-[11px] font-bold flex-1 cursor-text flex items-center gap-2 ${sub.isDone ? 'text-slate-400 line-through' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}
                >
                  {sub.title}
                  {!isLocked && task.status !== 'completed' && <Pencil size={10} className="opacity-0 group-hover/sub:opacity-100 text-slate-400" />}
                </span>
              )}
              {!isLocked && task.status !== 'completed' && (
                <button
                  onClick={() => onSubTaskDelete(task.id, sub.id, 'delete')}
                  title="Xóa việc nhỏ"
                  className="opacity-0 group-hover/sub:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          {!isLocked && task.status !== 'completed' && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="+ Thêm việc nhỏ..."
                title="Thêm việc nhỏ mới"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const val = target.value.trim();
                    if (val) {
                      onSubTaskAdd(task.id, null, 'add', val);
                      target.value = '';
                    }
                  }
                }}
                className={`flex-1 bg-slate-100/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-indigo-500 transition-all ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
              />
              {(!task.subTasks || task.subTasks.length === 0) && (
                <button
                  onClick={() => onAiSubtasks(task.id, task.title)}
                  disabled={aiLoading}
                  title="AI gợi ý cách làm"
                  className="px-3 py-1.5 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 text-[10px] font-black uppercase text-violet-500 hover:bg-violet-500 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <BrainCircuit size={14} /> AI
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
````

## File: src/components/focus/DuoFocusBanner.tsx
````typescript
import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { getAvatarUrl, getAssigneeIdByEmail, Task, TeamMember, AvatarConfig } from '../../utils/helpers';
import { DEFAULT_AVATARS } from '../../utils/constants';
type PartnerInfo = TeamMember | { displayName: string; email: string; avatarConfig?: AvatarConfig | null };
interface DuoFocusBannerProps {
  task?: Task;
  partnerInfo?: PartnerInfo;
  now: number;
  isDark: boolean;
}
export default function DuoFocusBanner({ task, partnerInfo, now, isDark }: DuoFocusBannerProps) {
  if (!task || !partnerInfo) return null;
  const calculateDuration = () => {
    let total = task.totalTrackedTime || 0;
    if (task.status === 'running' && task.lastStartTime) {
      total += now - task.lastStartTime;
    }
    return Math.max(0, total);
  };
  const durationStr = new Date(calculateDuration()).toISOString().substr(11, 8).replace(/^00:/, '');
  const partnerAvatarKey = getAssigneeIdByEmail(partnerInfo.email);
  const partnerAvatarUrl = getAvatarUrl(
    partnerInfo.avatarConfig || (partnerAvatarKey ? DEFAULT_AVATARS[partnerAvatarKey] : undefined) || {}
  );
  return (
    <Motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 p-3 pr-5 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all ${
        isDark
          ? 'bg-slate-900/80 border-indigo-500/30 shadow-indigo-500/10'
          : 'bg-white/90 border-indigo-200 shadow-indigo-500/20'
      }`}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 rounded-full blur animate-pulse opacity-50"></div>
        <img
          src={partnerAvatarUrl}
          alt={partnerInfo.displayName}
          className="relative w-10 h-10 rounded-full border-2 border-indigo-400 object-cover"
        />
        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
          <Flame size={12} className="text-orange-500 animate-pulse" fill="currentColor" />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            Tít/Tún cũng đang cố gắng!
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        </div>
        <div className="flex items-end gap-2">
          <span className={`text-sm font-semibold truncate max-w-[150px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {task.title}
          </span>
          <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {durationStr}
          </span>
        </div>
      </div>
    </Motion.div>
  );
}
````

## File: src/components/focus/FocusChecklist.tsx
````typescript
import React from 'react';
import { CheckCircle2, Plus } from 'lucide-react';
import { getAvatarUrl, Task, UserData, SubTask } from '../../utils/helpers';
interface FocusChecklistProps {
  task: Task;
  userData: UserData;
  subTasks: SubTask[];
  subDone: number;
  showChecklist: boolean;
  onSubTaskToggle: (taskId: string, subId: string, type: 'toggle' | 'rename' | 'delete' | 'add', val?: string) => Promise<void>;
  onSubTaskAdd: (taskId: string, subId: string | null, type: 'add', val: string) => Promise<void>;
  subResetKey: string | number;
  newSubTaskRef: React.RefObject<HTMLInputElement | null>;
}
export default function FocusChecklist({
  task,
  userData,
  subTasks,
  subDone,
  showChecklist,
  onSubTaskToggle,
  onSubTaskAdd,
  subResetKey,
  newSubTaskRef
}: FocusChecklistProps) {
  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = newSubTaskRef.current?.value?.trim();
    if (!val) return;
    onSubTaskAdd(task.id, null, 'add', val);
    if (newSubTaskRef.current) {
      newSubTaskRef.current.value = '';
    }
  };
  return (
    <div className="w-full max-w-2xl space-y-3">
      <div className="p-4 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-black text-sm truncate">{task.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              {task.assigneeName || 'Team'} {subTasks.length > 0 ? `• ${subDone}/${subTasks.length} xong` : ''}
            </p>
          </div>
          <img src={getAvatarUrl(userData.avatarConfig || {})} className="w-8 h-8 rounded-full border border-white/20" alt="" />
        </div>
        {subTasks.length > 0 && (
          <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${(subDone / subTasks.length) * 100}%` }} />
          </div>
        )}
      </div>
      {showChecklist && subTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 animate-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-2 max-h-36 overflow-y-auto pr-2 custom-scrollbar">
            {subTasks.map(sub => (
              <button key={sub.id} onClick={() => onSubTaskToggle(task.id, sub.id, 'toggle')}
                className="flex items-center gap-2.5 w-full group py-0.5 focus:outline-none">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                  ${sub.isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 group-hover:border-white/50'}`}>
                  {sub.isDone && <CheckCircle2 size={10} className="text-white" />}
                </div>
                <span className={`text-xs font-bold text-left
                  ${sub.isDone ? 'text-slate-500 line-through' : 'text-white/70 group-hover:text-white'}`}>
                  {sub.title}
                </span>
              </button>
            ))}
          </div>
          <form onSubmit={handleAdd} className="mt-2 flex items-center gap-2 border-t pt-2 border-white/10">
            <Plus size={10} className="text-slate-500" />
            <input type="text"
              key={`focus-sub-${subResetKey}`}
              ref={newSubTaskRef}
              placeholder="Thêm việc nhỏ..."
              spellCheck="false"
              autoComplete="off"
              className="bg-transparent border-none outline-none text-xs font-bold flex-1 text-white/70 placeholder:text-slate-600 font-[inherit]" />
          </form>
        </div>
      )}
    </div>
  );
}
````

## File: src/components/focus/FocusView.tsx
````typescript
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Zap, ListTree, Pause, CheckCircle2, Music, ListMusic, Play, Flame, Settings2, RotateCcw, Timer, Clock } from 'lucide-react';
import { formatDuration, getAvatarUrl, getAssigneeIdByEmail, Task, UserData, TeamMember, AvatarConfig } from '../../utils/helpers';
import { DEFAULT_AVATARS } from '../../utils/constants';
import MusicSidebar from '../layout/MusicSidebar';
import MixerSidebar from '../layout/MixerSidebar';
import { useFocusMusic } from '../../hooks/useFocusMusic';
import TimerRing from './TimerRing';
import FocusChecklist from './FocusChecklist';
import MusicPrompt from './MusicPrompt';
import { useTaskActionContext } from '../../contexts/TaskActionContext';
type PartnerInfo = TeamMember | { displayName: string; email: string; avatarConfig?: AvatarConfig | null };
interface FocusViewProps {
  task: Task;
  now: number;
  userData: UserData;
  triggerSystemFocus: (shortcutName: string) => void;
  partnerTask?: Task;
  partnerInfo?: PartnerInfo;
}
export default function FocusView({
  task,
  now,
  userData,
  triggerSystemFocus,
  partnerTask,
  partnerInfo
}: FocusViewProps) {
  const { toggleTaskStatus, handleUpdateTask, handleSubTaskAction } = useTaskActionContext();
  const onPause = () => toggleTaskStatus(task.id, 'pause');
  const onComplete = () => toggleTaskStatus(task.id, 'complete');
  const onUpdateTask = handleUpdateTask;
  const onSubTaskToggle = handleSubTaskAction;
  const onSubTaskAdd = handleSubTaskAction;
  const [showChecklist, setShowChecklist] = useState(true);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMusicPrompt, setShowMusicPrompt] = useState(true);
  const [hasInteractedWithMusic, setHasInteractedWithMusic] = useState(false);
  const newSubTaskRef = useRef<HTMLInputElement | null>(null);
  const {
    tracks,
    currentTrack,
    currentTrackIdx,
    setCurrentTrackIdx,
    isPlaying,
    togglePlay,
    handleNext,
    handlePrevious,
    currentTime,
    duration,
    handleSeek,
    volume,
    isMuted,
    setIsMuted,
    isCaching,
    cachedIds,
    uploadProgress,
    handleFileUpload,
    handleDeleteTrack,
    handleRandomPlay
  } = useFocusMusic(userData);
  useEffect(() => {
    if (isPlaying) {
      requestAnimationFrame(() => {
        setShowMusicPrompt((curr) => (curr === false ? curr : false));
        setHasInteractedWithMusic((curr) => (curr === true ? curr : true));
      });
    }
  }, [isPlaying]);
  const isPaused = task.status === 'paused' || task.status === 'idle';
  const getMs = (val: unknown): number | null => {
    if (!val) return null;
    if (typeof val === 'object' && val !== null && 'seconds' in val) {
      return (val as { seconds: number }).seconds * 1000;
    }
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  };
  const stableStartTime = useMemo(() => {
    return getMs(task.lastStartTime) || now;
  }, [now, task.lastStartTime]);
  const lastStart = getMs(task.lastStartTime) || stableStartTime;
  const rawTotalTracked = getMs(task.totalTrackedTime) || 0;
  const totalTracked = rawTotalTracked > 86400000 ? 0 : rawTotalTracked;
  const limitMs = getMs(task.limitTime) || 0;
  const elapsed = isPaused ? 0 : Math.max(0, now - lastStart);
  const totalElapsed = totalTracked + elapsed;
  const isCountdown = task.type === 'countdown' && limitMs > 0;
  const displayTime = isCountdown ? limitMs - totalElapsed : totalElapsed;
  const progress = isCountdown
    ? Math.min(1, totalElapsed / (limitMs || 1))
    : (totalElapsed % 60000) / 60000;
  const handleToggleTimerType = () => {
    const newType = task.type === 'stopwatch' ? 'countdown' : 'stopwatch';
    const newLimit = newType === 'countdown' ? 25 * 60 * 1000 : null;
    onUpdateTask(task.id, { type: newType, limitTime: newLimit });
  };
  const handleUpdateLimit = (mins: number) => {
    const ms = Math.max(1, parseInt(String(mins)) || 1) * 60 * 1000;
    onUpdateTask(task.id, { limitTime: ms, type: 'countdown' });
  };
  const handleResetTimer = () => {
    if (window.confirm('Đặt lại đồng hồ về 0?')) {
      onUpdateTask(task.id, { totalTrackedTime: 0, lastStartTime: now });
    }
  };
  const ringSize = 280;
  const ringRadius = ringSize / 2 - 16;
  const ringCircumference = 2 * Math.PI * ringRadius;
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto custom-scrollbar bg-slate-950">
      <div className="fixed inset-0 pointer-events-none">
        <img src="/focus-bg.png" alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950/90" />
      </div>
      <div className="relative z-20 flex items-center justify-between p-4 md:p-6 w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => triggerSystemFocus(userData?.shortcutName || 'Làm việc')} className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl hover:bg-white/20 transition-colors group hidden sm:block">
            <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400 group-active:scale-95 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white max-w-[200px] sm:max-w-md truncate">{task.title}</h1>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">Focusing Now</p>
          </div>
        </div>
        {partnerTask && partnerInfo && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <div className="relative">
              <img src={getAvatarUrl(partnerInfo.avatarConfig || (getAssigneeIdByEmail(partnerInfo.email) ? DEFAULT_AVATARS[getAssigneeIdByEmail(partnerInfo.email)!] : undefined) || {})} className="w-6 h-6 rounded-full border border-white/50" />
              <div className="absolute -bottom-0.5 -right-0.5"><Flame size={10} className="text-orange-500 animate-pulse" fill="currentColor"/></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-white/70 uppercase leading-none">{partnerInfo.displayName}</span>
              <span className="text-[10px] text-white font-mono leading-none">{formatDuration(Math.max(0, (partnerTask.totalTrackedTime || 0) + (partnerTask.status === 'running' && partnerTask.lastStartTime ? (now - partnerTask.lastStartTime) : 0)))}</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all active:scale-95 ${isSettingsOpen ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
            <Settings2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button onClick={() => setIsMusicOpen(true)} className="p-2.5 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all active:scale-95 group hidden sm:block">
            <Music size={16} className={`sm:w-[18px] sm:h-[18px] ${isPlaying ? 'animate-pulse' : ''}`} />
          </button>
          <button onClick={() => setIsMixerOpen(true)} className="p-2.5 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all active:scale-95 group">
            <ListMusic size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button onClick={() => setShowChecklist((v) => !v)} className={`p-2.5 sm:p-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all active:scale-95 ${showChecklist ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
            <ListTree size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>
      {isSettingsOpen && (
        <div className="absolute top-20 left-4 md:left-6 z-30 w-72 p-5 rounded-[2rem] bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Timer Settings</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white/60 uppercase ml-1">Mode</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                <button onClick={handleToggleTimerType} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${!isCountdown ? 'bg-white text-slate-950 shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  <Clock size={14} /> Stopwatch
                </button>
                <button onClick={handleToggleTimerType} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${isCountdown ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  <Timer size={14} /> Countdown
                </button>
              </div>
            </div>
            {isCountdown && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/60 uppercase ml-1">Limit Time (minutes)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 45, 60].map((m) => (
                    <button key={m} onClick={() => handleUpdateLimit(m)} className={`py-2 rounded-xl text-xs font-bold transition-all border ${limitMs === m * 60000 ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2">
              <button onClick={handleResetTimer} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all border border-red-500/20">
                <RotateCcw size={14} /> Reset Timer
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center min-h-[calc(100vh-80px)] px-4 pb-6">
        <div className="flex-1 min-h-4 max-h-[15vh]" />
        <TimerRing
          ringSize={ringSize}
          ringCenter={ringSize / 2}
          ringRadius={ringRadius}
          ringCircumference={ringCircumference}
          ringOffset={ringCircumference * (1 - progress)}
          progress={progress}
          displayTime={displayTime}
          isCountdown={isCountdown}
          isPaused={isPaused}
        />
        <div className="flex items-center gap-6 mb-8 shrink-0 relative z-20">
          <button onClick={onPause} className={`p-5 rounded-full backdrop-blur-xl border transition-all active:scale-90 shadow-2xl ${isPaused ? 'bg-white text-slate-950 border-white shadow-white/20' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>
            {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
          </button>
          <button onClick={onComplete} className="p-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white border border-emerald-400/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-90 shadow-xl">
            <CheckCircle2 size={32} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 min-h-2 max-h-[8vh]" />
        <FocusChecklist
          task={task}
          userData={userData}
          subTasks={task.subTasks || []}
          subDone={(task.subTasks || []).filter((s) => s.isDone).length}
          showChecklist={showChecklist}
          onSubTaskToggle={onSubTaskToggle}
          onSubTaskAdd={onSubTaskAdd}
          subResetKey={task.id}
          newSubTaskRef={newSubTaskRef}
        />
      </div>
      <MusicSidebar
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={isMuted ? 0 : volume}
        onToggleMute={() => setIsMuted(!isMuted)}
        isCaching={isCaching}
      />
      <MixerSidebar
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        tracks={tracks}
        currentTrackIdx={currentTrackIdx}
        onSelectTrack={setCurrentTrackIdx}
        cachedIds={cachedIds}
        totalTracks={tracks.length}
        onFileUpload={handleFileUpload}
        onAddViaUrl={() => {}}
        onDeleteTrack={handleDeleteTrack}
        uploadProgress={uploadProgress}
      />
      {showMusicPrompt && !hasInteractedWithMusic && !isPlaying && tracks.length > 0 && (
        <MusicPrompt onConfirm={handleRandomPlay} onCancel={() => setShowMusicPrompt(false)} />
      )}
    </div>
  );
}
````

## File: src/components/focus/MusicPrompt.tsx
````typescript
import React from 'react';
import { Music } from 'lucide-react';
interface MusicPromptProps {
  onConfirm: () => void;
  onCancel: () => void;
}
export default function MusicPrompt({ onConfirm, onCancel }: MusicPromptProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onCancel} />
      <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-12">
          <Music size={40} className="text-white" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Bật Nhạc Ngay?</h3>
        <p className="text-white/60 text-sm font-bold leading-relaxed mb-8">
          Để tăng sự tập trung, bạn có muốn bật giai điệu yêu thích ngay bây giờ không?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10"
          >
            Kích hoạt ngay 🚀
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 bg-white/5 border border-white/10 text-white/50 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
````

## File: src/components/focus/TimerRing.tsx
````typescript
import React from 'react';
import { formatDuration } from '../../utils/helpers';
interface TimerRingProps {
  ringSize: number;
  ringCenter: number;
  ringRadius: number;
  ringCircumference: number;
  ringOffset: number;
  progress: number;
  displayTime: number;
  isCountdown: boolean;
  isPaused: boolean;
}
export default function TimerRing({
  ringSize,
  ringCenter,
  ringRadius,
  ringCircumference,
  ringOffset,
  progress,
  displayTime,
  isCountdown,
  isPaused
}: TimerRingProps) {
  return (
    <div className="relative focus-ring-container mb-4 group">
      <div className="absolute inset-0 rounded-full bg-white/5 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
      <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}
        className="relative z-10 transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
        <defs>
          <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx={ringCenter} cy={ringCenter} r={ringRadius}
          fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx={ringCenter} cy={ringCenter} r={ringRadius}
          fill="none" stroke="url(#focusGradient)" strokeWidth="8"
          strokeDasharray={ringCircumference}
          strokeDashoffset={ringOffset}
          strokeLinecap="round"
          filter="url(#glow)"
          className="transition-all duration-1000 ease-linear" />
        <circle
          cx={ringCenter + ringRadius * Math.cos(2 * Math.PI * progress)}
          cy={ringCenter + ringRadius * Math.sin(2 * Math.PI * progress)}
          r="8" fill="white"
          className={`drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-linear
            ${!isPaused ? 'animate-pulse' : ''}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div className="relative w-[88%] h-[88%] flex flex-col items-center justify-center rounded-full bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-[inset_0_0_40px_rgba(255,255,255,0.05)]">
          <div className="relative flex flex-col items-center">
            <div className="flex items-baseline">
              <span className="text-6xl md:text-7xl font-mono font-medium tabular-nums tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {formatDuration(displayTime).split(':')[0]}:{formatDuration(displayTime).split(':')[1]}
              </span>
              {!isCountdown && (
                <span className="absolute left-[105%] bottom-1.5 text-xl md:text-2xl font-mono font-light text-white/20 tabular-nums">
                  {Math.floor((displayTime % 1000) / 10).toString().padStart(2, '0')}
                </span>
              )}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.5em] text-white/20">
              {!isPaused ? 'Focus Flow' : 'Paused'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
````

## File: src/components/layout/AppHeader.tsx
````typescript
import React from 'react';
import {
  Moon,
  Sun,
  Layout,
  ShoppingBag,
  Sparkles,
  LayoutDashboard,
  ListTree,
  Calendar as CalendarIcon,
  ChevronDown,
  CheckCircle2,
  Snowflake
} from 'lucide-react';
import StreakCalendar from '../stats/StreakCalendar.jsx';
import { getAssigneeIdByEmail, getAvatarUrl } from '../../utils/helpers';
import { DEFAULT_AVATARS } from '../../utils/constants';
import type { UserData, TeamMember } from '../../utils/helpers';
import type { User } from 'firebase/auth';
type HeaderMember = Pick<
  TeamMember,
  'uid' | 'email' | 'displayName' | 'avatarConfig' | 'ownedItemIds' | 'activeBooster'
>;
interface AppHeaderProps {
  user: User | null;
  userData: UserData;
  teamMembers: TeamMember[];
  activeTab: string;
  filterMode: string;
  onFilterModeChange: (mode: string) => void;
  onTabChange: (tab: string) => void;
  onOpenCloset: () => void;
  onToggleDarkMode: () => void;
  playSound: (soundName: string) => void;
}
function AppHeader({
  user,
  userData,
  teamMembers,
  activeTab,
  filterMode,
  onFilterModeChange,
  onTabChange,
  onOpenCloset,
  onToggleDarkMode,
  playSound
}: AppHeaderProps): React.ReactElement {
  const [isViewDropdownOpen, setIsViewDropdownOpen] = React.useState<boolean>(false);
  return (
    <div className="flex flex-col gap-6 mb-8 mt-2 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="premium-logo select-none cursor-default whitespace-nowrap">TIT & TUN TASKS</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <div
            className={`flex items-center p-1 rounded-xl border transition-all duration-300 ${
              userData.isDarkMode
                ? 'bg-slate-900/40 border-slate-700/50 backdrop-blur-md'
                : 'bg-white/40 border-slate-200 shadow-sm backdrop-blur-md'
            }`}
          >
            <button
              onClick={() => onFilterModeChange('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-indigo-500'
              }`}
            >
              Tất cả
            </button>
            {teamMembers.map((member) => (
              <button
                key={member.uid}
                onClick={() => onFilterModeChange(member.uid)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-300 ${
                  filterMode === member.uid
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-indigo-500'
                }`}
              >
                {member.displayName?.split(' ')[0] || member.email?.split('@')[0]}
              </button>
            ))}
          </div>
          <div className="h-8 w-px bg-slate-300/30 dark:bg-slate-700/30 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onTabChange('stats')}
              className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                  : userData.isDarkMode
                    ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                    : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}
            >
              <LayoutDashboard size={16} />
            </button>
            <button
              onClick={() => onTabChange('shop')}
              className={`p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeTab === 'shop'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                  : userData.isDarkMode
                    ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                    : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}
            >
              <ShoppingBag size={16} />
            </button>
            <div className="relative ml-1">
              <button
                onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
                  userData.isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                } ${isViewDropdownOpen ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                {activeTab === 'tasks' ? (
                  <Layout size={16} />
                ) : activeTab === 'calendar' ? (
                  <CalendarIcon size={16} />
                ) : (
                  <ListTree size={16} />
                )}
                <ChevronDown
                  size={12}
                  className={`opacity-50 transition-transform ${isViewDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isViewDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsViewDropdownOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-40 p-1.5 rounded-xl border shadow-2xl z-50 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                    {['tasks', 'calendar', 'list'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          onTabChange(tab);
                          setIsViewDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                          activeTab === tab
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {tab === 'tasks' ? 'Board' : tab}
                        {activeTab === tab && <CheckCircle2 size={12} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-[1.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-lg">
        <div className="flex items-center gap-3">
          <StreakCalendar userData={userData} isDark={userData.isDarkMode} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 font-black text-xs rounded-full">
            <Sparkles size={14} className="animate-pulse" /> {userData.ttGold} GOLD
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-xs rounded-full">
            <Snowflake size={14} className="animate-pulse" /> {userData.streakFreezes || 0}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-3">
            {[
              user
                ? {
                    uid: user.uid,
                    email: user.email || '',
                    displayName: userData.displayName || user.displayName || 'Bạn',
                    avatarConfig: userData.avatarConfig,
                    ownedItemIds: userData.ownedItemIds || [],
                    activeBooster: userData.activeBooster
                  }
                : null,
              ...teamMembers.filter((m) => m.uid !== user?.uid)
            ].filter((member): member is HeaderMember => Boolean(member))
              .map((member) => (
                <button
                  key={member.uid}
                  onClick={() => member.uid === user?.uid && onOpenCloset()}
                  className={`avatar-edit-btn ${member.uid === user?.uid ? 'z-10' : ''}`}
                >
                  <div
                    className={`relative ${member.ownedItemIds?.includes('frame_neon') ? 'avatar-frame-neon' : ''}`}
                  >
                    <img
                      src={getAvatarUrl(
                        member.avatarConfig ||
                          DEFAULT_AVATARS[getAssigneeIdByEmail(member.email || '') || ''] ||
                          {}
                      )}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 ${
                        userData.isDarkMode ? 'border-slate-800' : 'border-white'
                      } shadow-md ${member.uid === user?.uid ? 'ring-2 ring-indigo-500/30' : ''}`}
                      alt={member.displayName}
                    />
                    {Boolean(member.activeBooster) && (
                      <div className="absolute top-0 right-0 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></div>
                    )}
                  </div>
                </button>
              ))}
          </div>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700/50"></div>
          <button
            onClick={() => {
              playSound('click');
              onToggleDarkMode();
            }}
            className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:scale-110 transition-all border border-white/20 dark:border-white/5"
          >
            {userData.isDarkMode ? (
              <Sun size={16} className="text-yellow-400" />
            ) : (
              <Moon size={16} className="text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
export default React.memo(AppHeader);
````

## File: src/components/layout/AppProviders.tsx
````typescript
import React from 'react';
import { TaskProvider } from '../../contexts/TaskContext';
import { UserProvider } from '../../contexts/UserContext';
import { TaskActionProvider } from '../../contexts/TaskActionContext';
import type { TaskActionReturn } from '../../hooks/useTaskActions';
interface AppProvidersProps {
  children: React.ReactNode;
  taskActions: TaskActionReturn;
}
export function AppProviders({ children, taskActions }: AppProvidersProps): React.ReactElement {
  return (
    <TaskProvider>
      <UserProvider>
        <TaskActionProvider actions={taskActions}>
          {children}
        </TaskActionProvider>
      </UserProvider>
    </TaskProvider>
  );
}
````

## File: src/components/shop/ClosetView.tsx
````typescript
import React from 'react';
import { X, Scissors, Sparkles, User2, CheckCircle2 } from 'lucide-react';
import { getAvatarUrl, getAssigneeIdByEmail } from '../../utils/helpers';
import { DEFAULT_AVATARS, FASHION_OPTIONS } from '../../utils/constants';
import type { UserData, LevelInfo, FashionOption } from '../../utils/helpers';
interface ClosetViewProps {
  userData: UserData;
  levelInfo: LevelInfo;
  isDark: boolean;
  userEmail: string;
  onEquipItem: (category: string, value: string) => void;
  onClose: () => void;
}
const WARDROBE_CATEGORIES = ['hair', 'hairColor', 'skinColor', 'eyes', 'mouth', 'facialHair', 'body', 'clothingColor'];
const getAvatarPreviewSrc = (userData, userEmail) => {
  const avatarConfig = userData.avatarConfig || DEFAULT_AVATARS[getAssigneeIdByEmail(userEmail)] || { seed: userData.displayName };
  const cacheKey = avatarConfig.avatarVersion ?? JSON.stringify(avatarConfig);
  return `${getAvatarUrl(avatarConfig)}&v=${encodeURIComponent(cacheKey)}`;
};
export default function ClosetView({ userData, levelInfo, isDark, userEmail, onEquipItem, onClose }: ClosetViewProps) {
  const avatarPreviewSrc = getAvatarPreviewSrc(userData, userEmail);
  return (
    <div className="animate-in slide-in-from-right-8 duration-500 space-y-8 pb-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black uppercase tracking-tighter">Phòng Thay Đồ</h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><X size={24} /></button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-1 p-8 rounded-[3rem] ${isDark ? 'bg-slate-900/80 border border-slate-800' : 'bg-white border border-slate-100 shadow-xl'} flex flex-col items-center justify-center text-center sticky top-20`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Diện mạo hiện tại</p>
          <div className={`relative mb-8 ${userData.ownedItemIds?.includes('frame_neon') ? 'avatar-frame-neon' : ''}`}>
            <img
              src={avatarPreviewSrc}
              className="w-48 h-48 rounded-full border-4 border-indigo-500 shadow-2xl shadow-indigo-500/30"
              alt="Avatar Preview"
            />
          </div>
          <h3 className="text-xl font-black mb-1">{userData.displayName}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-outfit">Lv.{levelInfo.level} Fashionista</p>
        </div>
        <div className="lg:col-span-2 space-y-6">
          {WARDROBE_CATEGORIES.map(cat => (
            <div key={cat} className={`p-6 rounded-3xl ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
              <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                {cat === 'hair' ? <Scissors size={14} /> :
                  cat.includes('Color') ? <Sparkles size={14} /> :
                    cat === 'eyes' ? <Sparkles size={14} /> : <User2 size={14} />}
                {cat.toUpperCase()}
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FASHION_OPTIONS[cat].map(item => {
                  const isEquipped = userData.avatarConfig?.[cat] === item.value;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onEquipItem(cat, item.value)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group relative ${isEquipped ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 hover:border-indigo-400'}`}
                    >
                      {cat.toLowerCase().includes('color') ? (
                        <div className={`w-8 h-8 rounded-full border border-white/20`} style={{ backgroundColor: `#${item.value}` }}></div>
                      ) : (
                        <span className="text-2xl">{item.icon}</span>
                      )}
                      <span className="text-[9px] font-black uppercase text-center leading-tight">{item.name}</span>
                      {isEquipped && <div className="absolute top-1 right-1"><CheckCircle2 size={12} className="text-indigo-500" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
````

## File: src/components/shop/ShopView.tsx
````typescript
import React from 'react';
import { SHOP_ITEMS } from '../../utils/constants';
import type { UserData, LevelInfo, ShopItem } from '../../utils/helpers';
interface ShopViewProps {
  userData: UserData;
  levelInfo: LevelInfo;
  isDark: boolean;
  onBuyItem: (item: ShopItem) => void;
}
export default function ShopView({ userData, levelInfo, isDark, onBuyItem }: ShopViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SHOP_ITEMS.map(item => {
          const isLocked = (levelInfo.level || 1) < (item.minLevel || 1);
          const canAfford = (userData?.ttGold || 0) >= item.price;
          const isOwned = userData.ownedItemIds?.includes(item.id) && item.type !== 'ticket';
          return (
            <div key={item.id} className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all relative overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} ${isLocked ? 'opacity-70 grayscale' : ''}`}>
              <div className="flex items-center gap-4 relative z-10 w-full">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isDark ? 'bg-slate-700' : 'bg-slate-50'} ${isLocked ? '' : 'animate-float'}`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h5 className="font-black text-sm">{item.name}</h5>
                  <p className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} line-clamp-1`}>{item.desc}</p>
                  <p className={`text-[11px] font-black mt-1 ${canAfford ? 'text-yellow-500' : 'text-red-400'}`}>💰 {item.price} TTG</p>
                </div>
                <button
                  onClick={() => onBuyItem(item)}
                  disabled={isLocked || !canAfford || isOwned}
                  className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all whitespace-nowrap ${isOwned ? 'bg-emerald-500 text-white' : (!isLocked && canAfford ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50')}`}
                >
                  {isLocked ? `LEVEL ${item.minLevel}` : (isOwned ? 'ĐÃ CÓ' : 'MUA NGAY')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
````

## File: src/components/stats/productivity/ProductivityCharts.tsx
````typescript
import type { ProductivityStats } from '../../../hooks/useProductivityStats';
interface ProductivityChartProps {
  stats: ProductivityStats;
  isDark: boolean;
}
export function FocusDistributionChart({ stats, isDark }: ProductivityChartProps) {
  return (
    <div className={`p-6 rounded-[2rem] flex flex-col h-72 ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phân bố thời gian</h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Tít</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-400"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Tún</span></div>
        </div>
      </div>
      <div className="flex-1 flex items-end justify-between gap-2 mt-4">
        {stats.distribution.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-3 w-full group h-40">
            <div className="relative w-full flex justify-center flex-1">
              <div className={`absolute bottom-0 w-8 md:w-12 flex flex-col justify-end rounded-lg overflow-hidden transition-all duration-700 ease-out ${d.value === 0 ? (isDark ? 'bg-slate-800/50' : 'bg-slate-100') : ''}`} style={{ height: `${Math.max((d.value / stats.maxDist) * 100, 5)}%` }}>
                {d.value > 0 && (
                  <>
                    <div style={{ height: `${(d.tunMs / d.value) * 100}%` }} className="bg-pink-400 w-full group-hover:brightness-110 transition-all"></div>
                    <div style={{ height: `${(d.titMs / d.value) * 100}%` }} className="bg-indigo-500 w-full group-hover:brightness-110 transition-all"></div>
                  </>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
export function PeakHoursChart({ stats, isDark }: ProductivityChartProps) {
  return (
    <div className={`p-6 rounded-[2rem] flex flex-col h-72 ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Giờ Vàng Tập Trung</h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Tít</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-400"></div><span className="text-[9px] font-bold text-slate-400 uppercase">Tún</span></div>
        </div>
      </div>
      <div className="flex-1 flex items-end justify-between gap-1 mt-4">
        {stats.hours.map((val, i) => (
          <div key={i} className="flex flex-col items-center w-full h-40 relative group">
            <div className={`absolute bottom-0 w-full flex flex-col justify-end rounded-sm overflow-hidden transition-all duration-700 ${val.total === 0 ? (isDark ? 'bg-slate-800/50' : 'bg-slate-100') : ''} ${i === stats.peakHour ? 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900' : ''}`} style={{ height: `${Math.max((val.total / stats.maxHourMs) * 100, 2)}%` }}>
              {val.total > 0 && (
                <>
                  <div style={{ height: `${(val.tun / val.total) * 100}%` }} className="bg-pink-400 w-full group-hover:brightness-110 transition-all"></div>
                  <div style={{ height: `${(val.tit / val.total) * 100}%` }} className="bg-indigo-500 w-full group-hover:brightness-110 transition-all"></div>
                </>
              )}
            </div>
            {i % 6 === 0 && <span className="absolute -bottom-6 text-[8px] font-bold text-slate-500">{i.toString().padStart(2, '0')}:00</span>}
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-[10px] font-bold text-slate-400">Giờ năng suất nhất: <span className="text-emerald-500 font-black">{stats.peakHour.toString().padStart(2, '0')}:00 - {(stats.peakHour + 1).toString().padStart(2, '0')}:00</span></p>
      </div>
    </div>
  );
}
````

## File: src/components/stats/productivity/ProductivityInsights.tsx
````typescript
import { Target, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import type { ProductivityStats } from '../../../hooks/useProductivityStats';
interface GoalProgressCardProps {
  stats: ProductivityStats;
  timeRange: 'week' | 'month';
  isDark: boolean;
}
interface ProductivityInsightsProps {
  stats: ProductivityStats;
  isDark: boolean;
}
export function GoalProgressCard({ stats, timeRange, isDark }: GoalProgressCardProps) {
  const goalMs = timeRange === 'week' ? 10 * 3600000 : 40 * 3600000;
  const progressPct = Math.min(Math.round((stats.totalFocusMs / goalMs) * 100), 100);
  return (
    <div className={`p-6 rounded-[2rem] flex flex-col justify-center ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tiến độ mục tiêu</h4>
        <span className={`px-2 py-1 rounded text-[10px] font-black ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{progressPct}%</span>
      </div>
      <div className="mb-4">
        <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.totalFocus}</h3>
        <p className="text-xs font-bold text-slate-400">/ {timeRange === 'week' ? '10h' : '40h'} mục tiêu</p>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'} mb-2`}>
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }}></div>
      </div>
      <p className="text-[10px] font-bold text-emerald-500 text-center uppercase tracking-widest">Keep going!</p>
    </div>
  );
}
export function ProductivityInsights({ stats, isDark }: ProductivityInsightsProps) {
  return (
    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className={`p-5 rounded-[2rem] flex flex-col justify-center items-center text-center ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
        <Target size={16} className="text-slate-400 mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Ngày đỉnh nhất</p>
        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.bestDay}</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1">{stats.bestDayMs} focus</p>
      </div>
      <div className={`p-5 rounded-[2rem] flex flex-col justify-center items-center text-center ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
        <Clock size={16} className="text-slate-400 mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Khung giờ vàng</p>
        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.peakHour}:00</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1">Siêu tập trung</p>
      </div>
      <div className={`p-5 rounded-[2rem] flex flex-col justify-center items-center text-center col-span-2 md:col-span-1 ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
        {stats.changePct >= 0 ? <TrendingUp size={16} className="text-emerald-500 mb-2" /> : <TrendingDown size={16} className="text-red-500 mb-2" />}
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">So với tuần trước</p>
        <h3 className={`text-xl font-black ${stats.changePct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{stats.changePct > 0 ? '+' : ''}{stats.changePct}%</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-1">{stats.changePct >= 0 ? 'Tăng trưởng' : 'Giảm nhẹ'}</p>
      </div>
    </div>
  );
}
````

## File: src/components/stats/productivity/ProductivityStatCard.tsx
````typescript
import type { ReactNode } from 'react';
interface ProductivityStatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: ReactNode;
  isDark: boolean;
}
export default function ProductivityStatCard({ icon, label, value, sub, isDark }: ProductivityStatCardProps) {
  return (
    <div className={`p-4 md:p-5 rounded-[2rem] flex flex-col justify-between h-full ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-sm'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
        <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
        {sub && <div className="text-xs font-bold text-slate-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}
````

## File: src/components/stats/subcomponents/StatsComponents.tsx
````typescript
import React from 'react';
import { Layout, Calendar as CalendarIcon, ListTree, Sparkles, Zap, Rocket, Cpu } from 'lucide-react';
import { getAvatarUrl, getAssigneeIdByEmail, TeamMember, UserData } from '../../../utils/helpers';
import { DEFAULT_AVATARS, AI_MODELS } from '../../../utils/constants';
interface TeamMembersListProps {
  teamMembers: TeamMember[];
  userData: UserData;
  isDark: boolean;
}
export function TeamMembersList({ teamMembers, userData, isDark }: TeamMembersListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {teamMembers.map(member => (
        <div key={member.uid} className={`relative overflow-hidden p-4 rounded-3xl flex flex-col gap-3 transition-all group ${isDark ? 'bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 shadow-xl shadow-slate-950/20' : 'bg-white border border-slate-200 hover:border-indigo-500/30 shadow-lg shadow-slate-200/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`relative flex-shrink-0 ${member.ownedItemIds?.includes('frame_neon') ? 'avatar-frame-neon' : ''}`}>
              <img src={getAvatarUrl(member.avatarConfig || DEFAULT_AVATARS[getAssigneeIdByEmail(member.email) as keyof typeof DEFAULT_AVATARS] || {})} className="w-12 h-12 rounded-full border-2 border-indigo-400/40 object-cover" alt={member.displayName} />
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 ring-1 ring-indigo-400/50">
                {member.level || 1}
              </div>
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-2">
                <p className="font-black text-base truncate">{member.displayName}</p>
                {member.streak !== undefined && member.streak > 0 && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-500 text-[9px] font-black animate-pulse">
                    <Sparkles size={10} className="fill-orange-500" />
                    {member.streak}
                  </div>
                )}
              </div>
              <p className="text-[9px] uppercase font-bold tracking-[0.14em] text-slate-500 truncate">
                {member.uid === userData.uid ? 'Bản thân' : 'Đồng hành'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
             <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-xs">🔥</span>
                <span className={`text-[10px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.streak || 0} Ngày</span>
             </div>
             <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-xs">❄️</span>
                <span className={`text-[10px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.streakFreezes || 0}</span>
             </div>
             <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-xs">💰</span>
                <span className={`text-[10px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.ttGold || 0}</span>
             </div>
             <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <span className="text-xs">✨</span>
                <span className={`text-[10px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{member.xp || 0} XP</span>
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}
interface AppPreferencesProps {
  userData: UserData;
  isDark: boolean;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  onTabChange?: (tab: string) => void;
}
export function AppPreferences({ userData, isDark, onUpdateSettings, onTabChange }: AppPreferencesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={`p-5 rounded-[2rem] border transition-all ${isDark ? 'bg-[#09162e]/75 border-[#1f2d4e]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400"><Layout size={18} /></div>
          <div><h4 className="font-black text-sm uppercase tracking-widest">Mặc định</h4><p className="text-[10px] font-bold text-slate-500">Tự động mở khi vào app</p></div>
        </div>
        <div className={`flex p-1 rounded-2xl gap-1 ${isDark ? 'bg-[#0e1e3d]/85 border border-[#233a63]' : 'bg-white border border-slate-200'}`}>
          {[
            { id: 'tasks', label: 'Board', icon: <Layout size={14} /> },
            { id: 'calendar', label: 'Calendar', icon: <CalendarIcon size={14} /> },
            { id: 'list', label: 'List', icon: <ListTree size={14} /> }
          ].map(v => (
            <button key={v.id} onClick={() => { onUpdateSettings({ defaultView: v.id }); if (onTabChange) onTabChange(v.id); }}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all ${userData.defaultView === v.id ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.55)]' : (isDark ? 'text-slate-400 hover:bg-[#1a2f57]/70' : 'text-slate-500 hover:bg-slate-100')}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`p-5 rounded-[2rem] border transition-all ${isDark ? 'bg-[#09162e]/75 border-[#1f2d4e]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400"><Sparkles size={18} /></div>
          <div><h4 className="font-black text-sm uppercase tracking-widest">Chế độ AI</h4><p className="text-[10px] font-bold text-slate-500">Giọng văn trợ lý</p></div>
        </div>
        <div className={`flex p-1 rounded-2xl gap-1 ${isDark ? 'bg-[#0e1e3d]/85 border border-[#233a63]' : 'bg-white border border-slate-200'}`}>
          {[{ id: 'cute', label: 'Dễ thương', icon: '💖' }, { id: 'sassy', label: 'Cà khịa', icon: '🔥' }].map(m => (
            <button key={m.id} onClick={() => onUpdateSettings({ aiMode: m.id })}
              className={`flex-1 min-w-0 flex items-center justify-center gap-2 py-2 px-2 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all ${userData.aiMode === m.id ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-[0_0_24px_rgba(217,70,239,0.45)]' : (isDark ? 'text-slate-400 hover:bg-[#1a2f57]/70' : 'text-slate-500 hover:bg-slate-100')}`}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`lg:col-span-2 p-5 rounded-[2.5rem] border transition-all ${isDark ? 'bg-[#09162e]/75 border-[#1f2d4e]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400"><Cpu size={18} /></div>
          <div><h4 className="font-black text-sm uppercase tracking-widest">Động cơ AI (OpenRouter)</h4><p className="text-[10px] font-bold text-slate-500">Chọn model bạn muốn sử dụng</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AI_MODELS.map(model => (
            <button key={model.id} onClick={() => onUpdateSettings({ aiModel: model.id })}
              className={`flex items-center gap-3 p-3 rounded-2xl text-[11px] font-black uppercase transition-all border ${userData.aiModel === model.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : (isDark ? 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100')}`}>
              <span className="text-base">{model.icon}</span>
              <span className="truncate">{model.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
interface FocusAutomationProps {
  userData: UserData;
  isDark: boolean;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  triggerSystemFocus: (shortcut: string) => void;
  startShortcutRef: React.RefObject<HTMLInputElement | null>;
  stopShortcutRef: React.RefObject<HTMLInputElement | null>;
  handleBlur: (field: string, val: string) => void;
  DEFAULT_SHORTCUT_NAME: string;
}
export function FocusAutomation({ userData, isDark, onUpdateSettings, triggerSystemFocus, startShortcutRef, stopShortcutRef, handleBlur, DEFAULT_SHORTCUT_NAME }: FocusAutomationProps) {
  return (
    <div className={`p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
      <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12"><Zap size={120} /></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div><h4 className="font-black text-lg mb-1 flex items-center gap-2"><Zap size={20} className="text-indigo-500 fill-indigo-500" /> Focus Automation</h4><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tự động chuyển chế độ khi làm việc</p></div>
          <button onClick={() => onUpdateSettings({ autoFocusShortcut: !userData.autoFocusShortcut })}
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${userData.autoFocusShortcut ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-700 text-slate-400'}`}>
            {userData.autoFocusShortcut ? 'Đang kích hoạt' : 'Đã tạm tắt'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <div className="hidden md:block absolute top-[44px] left-1/2 -translate-x-1/2 w-12 h-px bg-slate-700/30"></div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-black">1</div><span className="text-[11px] font-black uppercase text-slate-400">Khi Bắt Đầu Task</span></div>
            <div className="flex gap-2">
              <input type="text" ref={startShortcutRef} defaultValue={userData.shortcutName ?? DEFAULT_SHORTCUT_NAME} onBlur={(e) => handleBlur('shortcutName', e.target.value)} placeholder="VD: Làm việc" className={`flex-1 px-5 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`} />
              <button onClick={() => triggerSystemFocus(startShortcutRef.current?.value || userData.shortcutName || DEFAULT_SHORTCUT_NAME)} aria-label="Kích hoạt shortcut bắt đầu" className="p-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"><Rocket size={18} /></button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-black">2</div><span className="text-[11px] font-black uppercase text-slate-400">Khi Tạm Dừng / Xong</span></div>
            <div className="flex gap-2">
              <input type="text" ref={stopShortcutRef} defaultValue={userData.offShortcutName ?? ''} onBlur={(e) => handleBlur('offShortcutName', e.target.value)} placeholder="Trống = Không đổi" className={`flex-1 px-5 py-3 rounded-2xl text-xs font-bold outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'}`} />
              <button onClick={() => { const s = stopShortcutRef.current?.value || userData.offShortcutName; if (s) triggerSystemFocus(s as string); }} aria-label="Kích hoạt shortcut dừng" disabled={!userData.offShortcutName} className={`p-3 rounded-2xl transition-all shadow-lg active:scale-95 ${userData.offShortcutName ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}`}><Rocket size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
````

## File: src/components/stats/widgets/DailyQuestWidget.tsx
````typescript
import React from 'react';
import { Sparkles, Coins, Check } from 'lucide-react';
import Card from '../../../shared/Card';
import Badge from '../../../shared/Badge';
import Button from '../../../shared/Button';
interface DailyQuest {
  isCompleted: boolean;
  dateKey?: string;
  title: string;
  goal: string;
  rewardGold: number;
  completedAt: number;
  completedByName: string;
  deadline: string;
}
interface DailyQuestWidgetProps {
  isDark: boolean;
  quest?: DailyQuest | null;
  onRefresh: () => void;
  onComplete: () => void;
}
export default function DailyQuestWidget({ isDark, quest, onRefresh, onComplete }: DailyQuestWidgetProps) {
  const isCompleted = quest?.isCompleted;
  return (
    <Card isDark={isDark} className={`md:col-span-6 relative overflow-hidden transition-all duration-500 ${isCompleted ? 'border-emerald-500/30' : ''}`}>
      <div className={`absolute -right-6 -top-4 transition-colors duration-500 ${isCompleted ? 'text-emerald-500/10' : 'text-fuchsia-500/10'}`}>
        <Sparkles size={110} />
      </div>
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} className={isCompleted ? 'text-emerald-500' : 'text-violet-500'} />
            AI Daily Quest
          </h4>
          <div className="flex items-center gap-2">
            <Badge className={isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700'}>
              {quest?.dateKey || 'Hôm nay'}
            </Badge>
            {!isCompleted && (
              <Button variant="ghost" onClick={onRefresh} className="!text-[10px]">
                Làm mới quest
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <p className={`font-black text-lg leading-snug mb-2 ${isCompleted ? 'line-through opacity-50' : ''}`}>
              {quest?.title || 'Cùng hoàn thành 3 việc trước 12h trưa'}
            </p>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'} ${isCompleted ? 'opacity-50' : ''}`}>
              {quest?.goal || 'Mỗi người xử lý ít nhất 1 task quan trọng trong buổi sáng.'}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={isCompleted ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}>
                <Coins size={12} /> {isCompleted ? 'Đã nhận' : `+${quest?.rewardGold || 500}`} Gold
              </Badge>
              <Badge className={isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}>
                {isCompleted && quest?.completedAt ? `Xong lúc ${new Date(quest.completedAt).toLocaleTimeString('vi', {hour:'2-digit', minute:'2-digit'})}` : `Deadline ${quest?.deadline || '12:00'}`}
              </Badge>
            </div>
          </div>
          {isCompleted ? (
            <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              <Check size={16} /> Hoàn thành bởi {quest?.completedByName}
            </div>
          ) : (
            <button
              onClick={onComplete}
              className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Xác nhận hoàn thành
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
````

## File: src/components/stats/widgets/DuoFocusWidget.tsx
````typescript
import React, { useRef, useEffect } from 'react';
import { Flame } from 'lucide-react';
import Card from '../../../shared/Card';
import Badge from '../../../shared/Badge';
import { Task } from '../../../utils/helpers';
const getTrackedMs = (task: Task | null | undefined, now: number): number => {
  if (!task) return 0;
  const base = task.totalTrackedTime || 0;
  if (task.status === 'running' && task.lastStartTime) return base + (now - task.lastStartTime);
  return base;
};
const fmt = (ms: number): string => new Date(Math.max(0, ms)).toISOString().substr(11, 8).replace(/^00:/, '');
interface DuoFocusWidgetProps {
  isDark: boolean;
  myTask?: Task | null;
  partnerTask?: Task | null;
  myName: string;
  partnerName: string;
  now: number;
}
export default function DuoFocusWidget({ isDark, myTask, partnerTask, myName, partnerName, now }: DuoFocusWidgetProps) {
  const myBarRef = useRef<HTMLDivElement>(null);
  const partnerBarRef = useRef<HTMLDivElement>(null);
  const myMs = getTrackedMs(myTask, now);
  const partnerMs = getTrackedMs(partnerTask, now);
  const total = Math.max(myMs, partnerMs, 1);
  useEffect(() => {
    if (myBarRef.current) {
      myBarRef.current.style.width = `${(myMs / total) * 100}%`;
    }
    if (partnerBarRef.current) {
      partnerBarRef.current.style.width = `${(partnerMs / total) * 100}%`;
    }
  }, [myMs, partnerMs, total]);
  if (!myTask || !partnerTask) return null;
  return (
    <Card isDark={isDark} className="md:col-span-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
          <Flame size={16} className="text-orange-500" /> Tít/Tún cũng đang cố gắng!
        </h4>
        <Badge className={isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-100 text-orange-600'}>
          Song hành realtime
        </Badge>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span>{myName}</span><span>{fmt(myMs)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700/30 overflow-hidden">
            <div ref={myBarRef} className="h-full bg-indigo-500 rounded-full transition-all duration-500" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] font-bold mb-1">
            <span>{partnerName}</span><span>{fmt(partnerMs)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700/30 overflow-hidden">
            <div ref={partnerBarRef} className="h-full bg-fuchsia-500 rounded-full transition-all duration-500" />
          </div>
        </div>
      </div>
    </Card>
  );
}
````

## File: src/components/stats/widgets/MascotAssistantWidget.tsx
````typescript
import React from 'react';
import { Bot } from 'lucide-react';
import Card from '../../../shared/Card';
import Button from '../../../shared/Button';
import { UserData, Task } from '../../../utils/helpers';
interface BuildMessageProps {
  aiMode: string;
  currentTab: string;
  tasks: Task[];
  streak: number;
  duoActive: boolean;
  mascotName: string;
}
const buildMessage = ({ aiMode, currentTab, tasks, streak, duoActive, mascotName }: BuildMessageProps): string => {
  const running = tasks.filter((task) => task.status === 'running').length;
  const done = tasks.filter((task) => task.status?.startsWith('completed')).length;
  if (aiMode === 'sassy') {
    if (duoActive) return `${mascotName}: Hai đứa đang tập trung ngon đấy. Đừng để nửa chừng rồi lặn nhé.`;
    if (running === 0) return `${mascotName}: Bảng task đang yên ắng ghê. Bấm Start đi nào, hero ơi.`;
    return `${mascotName}: ${done} task xong rồi, còn lại xử luôn cho trọn combo hôm nay.`;
  }
  if (duoActive) return `${mascotName}: Cả hai đang cố gắng cùng nhau, tuyệt lắm!`;
  if (currentTab === 'calendar') return `${mascotName}: Hôm nay có lịch dày, nhớ chừa slot nghỉ ngắn nha.`;
  if (streak >= 7) return `${mascotName}: Streak ${streak} ngày rồi, giữ nhịp thật đẹp nhé!`;
  return `${mascotName}: Mình gợi ý bắt đầu từ task quan trọng nhất để lấy đà nha.`;
};
interface MascotAssistantWidgetProps {
  isDark: boolean;
  userData: UserData;
  currentTab: string;
  tasks: Task[];
  duoActive: boolean;
  onRename: () => void;
  onChangeAvatar: () => void;
}
export default function MascotAssistantWidget({
  isDark,
  userData,
  currentTab,
  tasks,
  duoActive,
  onRename,
  onChangeAvatar
}: MascotAssistantWidgetProps) {
  const mascotName = userData.mascotName || 'Mochi';
  const mascotAvatar = userData.mascotAvatar || '🤖';
  const message = buildMessage({
    aiMode: userData.aiMode,
    currentTab,
    tasks,
    streak: userData.streak || 0,
    duoActive,
    mascotName
  });
  return (
    <Card isDark={isDark} className="md:col-span-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
          <Bot size={16} className="text-cyan-500" /> Mascot AI Assistant
        </h4>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onRename} className="!text-[10px]">Đổi tên</Button>
          <Button variant="ghost" onClick={onChangeAvatar} className="!text-[10px]">Đổi avatar</Button>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center text-2xl">{mascotAvatar}</div>
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-relaxed ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
          {message}
        </div>
      </div>
    </Card>
  );
}
````

## File: src/components/stats/ProductivityReport.tsx
````typescript
import { useState } from 'react';
import { BarChart3, Clock, Target, Flame } from 'lucide-react';
import { useProductivityStats } from '../../hooks/useProductivityStats';
import type { Task, TeamMember, UserData } from '../../utils/helpers';
import ProductivityStatCard from './productivity/ProductivityStatCard';
import { FocusDistributionChart, PeakHoursChart } from './productivity/ProductivityCharts';
import { GoalProgressCard, ProductivityInsights } from './productivity/ProductivityInsights';
interface ProductivityReportProps {
  tasks: Task[];
  userData: UserData;
  isDark: boolean;
  teamMembers: TeamMember[];
}
export default function ProductivityReport({ tasks, userData, isDark, teamMembers }: ProductivityReportProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const stats = useProductivityStats(tasks, timeRange, teamMembers);
  return (
    <div className={`p-4 md:p-8 rounded-[2.5rem] w-full ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-200'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className={`text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Báo Cáo Năng Suất
        </h2>
        <div className={`flex items-center p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <button onClick={() => setTimeRange('week')} className={`px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${timeRange === 'week' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            Tuần
          </button>
          <button onClick={() => setTimeRange('month')} className={`px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${timeRange === 'month' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            Tháng
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ProductivityStatCard isDark={isDark} icon={<BarChart3 size={18} />} label="Sessions" value={stats.sessions} sub="Lượt tập trung" />
        <ProductivityStatCard isDark={isDark} icon={<Clock size={18} />} label="Tổng thời gian" value={stats.totalFocus} sub={<div className="flex items-center gap-1.5 mt-1"><span className="text-[10px] font-bold text-indigo-400">Tít: {stats.titTotal}</span><span className="text-[10px] font-bold text-slate-500">•</span><span className="text-[10px] font-bold text-pink-400">Tún: {stats.tunTotal}</span></div>} />
        <ProductivityStatCard isDark={isDark} icon={<Target size={18} className="text-emerald-500" />} label="Tỷ lệ đúng hạn" value={`${stats.onTimeRate}%`} sub={<div className="flex items-center gap-1.5 mt-1"><span className="text-[10px] font-bold text-red-500">Trễ: {stats.lateCount}</span><span className="text-[10px] font-bold text-slate-500">(Tít: {stats.titLate} • Tún: {stats.tunLate})</span></div>} />
        <ProductivityStatCard isDark={isDark} icon={<Flame size={18} className="text-orange-500" />} label="Chuỗi (Streak)" value={`${userData.streak || 0} ngày`} sub="Cố gắng giữ phong độ!" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FocusDistributionChart stats={stats} isDark={isDark} />
        <PeakHoursChart stats={stats} isDark={isDark} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GoalProgressCard stats={stats} timeRange={timeRange} isDark={isDark} />
        <ProductivityInsights stats={stats} isDark={isDark} />
      </div>
    </div>
  );
}
````

## File: src/components/stats/StatsView.tsx
````typescript
import React, { useRef } from 'react';
import { CalendarDays, Cpu, ListTree, Sparkles } from 'lucide-react';
import ProductivityReport from './ProductivityReport';
import { TeamMembersList, AppPreferences, FocusAutomation } from './subcomponents/StatsComponents';
import DailyQuestWidget from './widgets/DailyQuestWidget';
import MascotAssistantWidget from './widgets/MascotAssistantWidget';
import DuoFocusWidget from './widgets/DuoFocusWidget';
import { Task, TeamMember, UserData } from '../../utils/helpers';
const DEFAULT_SHORTCUT_NAME = 'Làm việc';
interface StatsViewProps {
  tasks: Task[];
  isDark: boolean;
  teamMembers: TeamMember[];
  userData: UserData;
  onSummarize: () => void;
  isSummarizing: boolean;
  aiReport: string | null;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  triggerSystemFocus: (shortcut: string) => void;
  onTabChange?: (tab: string) => void;
  dailyQuest: any;
  onRefreshDailyQuest: () => void;
  onCompleteDailyQuest: () => void;
  currentTab: string;
  onRenameMascot: () => void;
  onChangeMascotAvatar: () => void;
  partnerTask?: Task | null;
  myRunningTask?: Task | null;
  now: number;
}
export default function StatsView({
  tasks, isDark, teamMembers, userData, onSummarize, isSummarizing,
  aiReport, onUpdateSettings, triggerSystemFocus, onTabChange,
  dailyQuest, onRefreshDailyQuest, onCompleteDailyQuest, currentTab, onRenameMascot, onChangeMascotAvatar,
  partnerTask, myRunningTask, now
}: StatsViewProps) {
  const startShortcutRef = useRef<HTMLInputElement>(null);
  const stopShortcutRef = useRef<HTMLInputElement>(null);
  const handleBlur = (key: string, val: string) => {
    onUpdateSettings({ [key]: val });
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 auto-rows-[minmax(140px,auto)] gap-6 animate-in fade-in duration-700 pb-24">
      <DailyQuestWidget isDark={isDark} quest={dailyQuest} onRefresh={onRefreshDailyQuest} onComplete={onCompleteDailyQuest} />
      <MascotAssistantWidget
        isDark={isDark}
        userData={userData}
        currentTab={currentTab}
        tasks={tasks}
        duoActive={!!(partnerTask && myRunningTask)}
        onRename={onRenameMascot}
        onChangeAvatar={onChangeMascotAvatar}
      />
      <DuoFocusWidget
        isDark={isDark}
        myTask={myRunningTask}
        partnerTask={partnerTask}
        myName={userData.displayName || 'Bạn'}
        partnerName={partnerTask?.currentWorkerName || 'Đồng đội'}
        now={now}
      />
      {}
      <div className={`md:col-span-6 p-8 rounded-[2.5rem] relative overflow-hidden transition-all border-2 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
        <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12"><Cpu size={160} /></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h4 className="font-black text-xl mb-1 flex items-center gap-2">
                <Sparkles size={24} className="text-violet-500" /> AI Productivity Insights
              </h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phân tích hiệu suất bằng trí tuệ nhân tạo</p>
            </div>
            <button
              onClick={onSummarize}
              disabled={isSummarizing || tasks.length === 0}
              className={`px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${isSummarizing ? 'bg-violet-500/50 text-white cursor-wait' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 active:scale-[0.98]'}`}
            >
              <Cpu size={20} className={isSummarizing ? 'animate-spin' : ''} />
              {isSummarizing ? 'ĐANG PHÂN TÍCH...' : 'CHẠY AI REPORT'}
            </button>
          </div>
          {aiReport ? (
            <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-600/10 via-indigo-600/10 to-blue-600/10 border border-violet-500/20 animate-scale-in">
              <h5 className="font-black text-sm mb-4 text-violet-400 flex items-center gap-2">
                {userData.aiMode === 'sassy' ? '🔥 CHẾ ĐỘ CÀ KHỊA' : '💖 CHẾ ĐỘ DỄ THƯƠNG'}
              </h5>
              <p className={`text-lg leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'} whitespace-pre-wrap italic`}>
                "{aiReport}"
              </p>
            </div>
          ) : (
            <div className={`p-12 border-2 border-dashed rounded-3xl text-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bấm nút phía trên để AI đánh giá ngày làm việc của bạn</p>
            </div>
          )}
        </div>
      </div>
      {}
      <div className="md:col-span-6">
        <ProductivityReport tasks={tasks} userData={userData} isDark={isDark} teamMembers={teamMembers} />
      </div>
      {}
      <div className="md:col-span-2">
        <div className={`h-full p-5 rounded-[2.2rem] border-2 ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
          <h4 className="font-black text-xs text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-500" /> Thành Viên Team
          </h4>
          <TeamMembersList teamMembers={teamMembers} userData={userData} isDark={isDark} />
        </div>
      </div>
      {}
      <div className="md:col-span-4">
        <AppPreferences userData={userData} isDark={isDark} onUpdateSettings={onUpdateSettings} onTabChange={onTabChange} />
      </div>
      {}
      <div className={`md:col-span-2 p-6 rounded-[2rem] border-2 ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
        <h4 className="font-black text-xs text-slate-500 uppercase tracking-[0.2em] mb-4">Quick Actions</h4>
        <div className="space-y-3">
          <button
            onClick={() => onTabChange?.('tasks')}
            className={`w-full rounded-xl px-4 py-3 text-left text-xs font-black flex items-center justify-between transition-all ${isDark ? 'bg-slate-800/70 hover:bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-50 hover:bg-white text-slate-800 border border-slate-200 shadow-sm'}`}
          >
            Mở Task Board
            <ListTree size={14} />
          </button>
          <button
            onClick={() => onTabChange?.('calendar')}
            className={`w-full rounded-xl px-4 py-3 text-left text-xs font-black flex items-center justify-between transition-all ${isDark ? 'bg-slate-800/70 hover:bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-50 hover:bg-white text-slate-800 border border-slate-200 shadow-sm'}`}
          >
            Xem Calendar
            <CalendarDays size={14} />
          </button>
        </div>
      </div>
      {}
      <div className="md:col-span-4">
        <FocusAutomation
          userData={userData} isDark={isDark} onUpdateSettings={onUpdateSettings}
          triggerSystemFocus={triggerSystemFocus} startShortcutRef={startShortcutRef}
          stopShortcutRef={stopShortcutRef} handleBlur={handleBlur}
          DEFAULT_SHORTCUT_NAME={DEFAULT_SHORTCUT_NAME}
        />
      </div>
    </div>
  );
}
````

## File: src/components/stats/StreakCalendar.tsx
````typescript
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
  isToday
} from 'date-fns';
import { Flame, Snowflake, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { UserData } from '../../utils/helpers';
const WEEK_STARTS_ON = 1;
interface StreakCalendarProps {
  userData: UserData;
  isDark: boolean;
}
type DayStatus = 'active' | 'freeze' | 'inactive';
export default function StreakCalendar({ userData, isDark }: StreakCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const streak = userData.streak || 0;
  const lastCheckIn = userData.lastCheckIn;
  const checkInHistory = userData.checkInHistory || {};
  const getDayStatus = (date: Date): DayStatus => {
    const dateStr = date.toDateString();
    if (checkInHistory[dateStr]) return checkInHistory[dateStr] as DayStatus;
    if (!lastCheckIn || streak === 0) return 'inactive';
    const lastCheckInDate = new Date(lastCheckIn);
    lastCheckInDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const diffFromLastCheckIn = Math.round((lastCheckInDate.getTime() - targetDate.getTime()) / 86400000);
    if (diffFromLastCheckIn >= 0 && diffFromLastCheckIn < streak) return 'active';
    const diffFromTodayToLast = Math.round((todayDate.getTime() - lastCheckInDate.getTime()) / 86400000);
    if (diffFromTodayToLast > 1) {
      const diffToTarget = Math.round((targetDate.getTime() - lastCheckInDate.getTime()) / 86400000);
      if (diffToTarget > 0 && diffToTarget < diffFromTodayToLast) {
        if ((userData.streakFreezes || 0) >= diffFromTodayToLast - 1) return 'freeze';
      }
    }
    return 'inactive';
  };
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="relative">
      {}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-500 font-black text-xs rounded-full backdrop-blur-md hover:bg-orange-500/20 transition-all active:scale-95 group relative z-10"
      >
        <Flame size={16} className={`group-hover:scale-110 transition-transform ${streak > 0 ? 'fill-orange-500 animate-pulse' : ''}`} />
        {streak} NGÀY
      </button>
      {}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <div className={`relative w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border-2 border-slate-800' : 'bg-white border-2 border-slate-100'}`}>
            <button onClick={() => setIsOpen(false)} aria-label="Đóng" className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
              <X size={18} />
            </button>
            {}
            <div className="flex flex-col items-center justify-center mb-6 mt-2">
              <div className="relative">
                <Flame size={64} className="text-orange-500 fill-orange-500 drop-shadow-xl" />
                <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 rounded-full"></div>
              </div>
              <h2 className={`text-3xl font-black mt-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{streak}</h2>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>Ngày Lửa</p>
            </div>
            {}
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} aria-label="Tháng trước" className={`p-2 rounded-2xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ChevronLeft size={20} />
              </button>
              <span className={`font-black text-sm uppercase tracking-widest ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button onClick={nextMonth} aria-label="Tháng sau" className={`p-2 rounded-2xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <ChevronRight size={20} />
              </button>
            </div>
            {}
            <div className="grid grid-cols-7 mb-3">
              {weekDays.map((day, idx) => (
                <div key={idx} className={`text-center text-[11px] font-black uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {day}
                </div>
              ))}
            </div>
            {}
            <div className="grid grid-cols-7 gap-y-3 gap-x-1">
              {days.map((day, index) => {
                const status = getDayStatus(day);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isTodayDay = isToday(day);
                let bgClass = isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100";
                let borderClass = "border-transparent border-2";
                let icon = null;
                if (!isCurrentMonth) {
                  bgClass = isDark ? "text-slate-600" : "text-slate-300";
                } else if (status === 'active') {
                  bgClass = "bg-orange-500 text-white font-black";
                  borderClass = "border-orange-500";
                } else if (status === 'freeze') {
                  bgClass = isDark ? "bg-blue-900/40 text-blue-400 font-black" : "bg-blue-100 text-blue-600 font-black";
                  borderClass = isDark ? "border-blue-800/50" : "border-blue-200";
                  icon = <Snowflake size={12} className="absolute -top-1.5 -right-1.5 text-blue-500" />;
                }
                if (isTodayDay && status !== 'active') {
                  borderClass = isDark ? "border-slate-600" : "border-slate-300";
                  if(status !== 'freeze') {
                    bgClass += isDark ? " bg-slate-800/50 font-bold" : " bg-slate-50 font-bold";
                  }
                }
                return (
                  <div key={index} className="flex justify-center items-center relative group">
                    <div className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all cursor-default select-none ${bgClass} ${borderClass}`}>
                      <span className="text-sm font-bold">{format(day, "d")}</span>
                    </div>
                    {icon}
                  </div>
                );
              })}
            </div>
            {}
            <div className="mt-8 text-center bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20">
              <p className={`text-xs font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                 {streak > 0 ? "Tuyệt vời! Bạn đang giữ phong độ rất tốt!" : "Hãy bắt đầu chuỗi ngày mới nào!"}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
````

## File: src/components/tasks/subcomponents/TaskComponents.tsx
````typescript
import React from 'react';
import { Trash2, Lock, Users, Clock, Calendar, Pencil, CheckCircle2, Circle, X, BrainCircuit } from 'lucide-react';
interface Task {
  id: string;
  title: string;
  priority?: string;
  assigneeId?: string;
  assigneePhoto?: string;
  assigneeName?: string;
  status: string;
  type?: string;
  limitTime?: number;
}
interface SubTask {
  title: string;
  isDone: boolean;
}
interface TaskTagsProps {
  task: Task;
  isLocked: boolean;
  isDark: boolean;
  onPriorityChange: (id: string, priority: string) => void;
  onDelete: (id: string) => void;
}
export function TaskTags({ task, isLocked, isDark, onPriorityChange, onDelete }: TaskTagsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => !isLocked && onPriorityChange(task.id, task.priority)}
          disabled={isLocked}
          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${isLocked ? 'cursor-default' : 'hover:scale-110 active:scale-95 cursor-pointer'} ${task.priority === 'high' ? 'bg-red-500/20 text-red-500' : task.priority === 'medium' ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-500/20 text-slate-500'}`}
        >
          {task.priority || 'vừa'}
        </button>
        {task.assigneeId && (
          <span className={`flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full text-[9px] font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {task.assigneePhoto ? <img src={task.assigneePhoto} className="w-3.5 h-3.5 rounded-full" alt="" /> : <Users size={10} />}
            {task.assigneeName}
          </span>
        )}
        {task.status === 'completed_late' && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
            <Clock size={10} /> Trễ hạn
          </span>
        )}
      </div>
      {!isLocked ? (
        <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
      ) : (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 text-[8px] font-black uppercase tracking-widest">
          <Lock size={10} /> LOCK
        </div>
      )}
    </div>
  );
}
export function TaskTitle({ task, isLocked, isCompleted, isDark, isEditing, editTitleRef, onStartEdit }: TaskTitleProps) {
  if (isEditing) return (
    <div className="mb-3">
      <input autoFocus type="text" ref={editTitleRef} defaultValue={task.title} spellCheck="false" autoComplete="off"
        className={`w-full bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-2 outline-none text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`} />
    </div>
  );
  return (
    <div className="mb-3">
      <h4 onClick={() => !isLocked && onStartEdit()}
        className={`group/title relative text-sm font-extrabold leading-snug cursor-text flex items-start gap-2 ${isCompleted ? 'line-through text-slate-400' : (isDark ? 'text-white' : 'text-slate-800')}`}>
        {task.title}
        {!isLocked && !isCompleted && <Pencil size={12} className="opacity-0 group-hover/title:opacity-100 transition-opacity mt-1 text-slate-400" />}
      </h4>
    </div>
  );
}
interface TaskTitleProps {
  task: Task;
  isLocked: boolean;
  isCompleted: boolean;
  isDark: boolean;
  isEditing: boolean;
  editTitleRef: React.RefObject<HTMLInputElement>;
  onStartEdit: () => void;
}
export function SubTaskItem({ sub, isLocked, isCompleted, isDark, isEditing, editSubTaskRef, onToggle, onRename, onDelete, onStartEdit }: SubTaskItemProps) {
  return (
    <div className="flex items-start gap-1.5 group/sub">
      <button onClick={onToggle} disabled={isLocked || isCompleted}
        className={`mt-0.5 transition-colors ${(isLocked || isCompleted) ? 'cursor-not-allowed opacity-50' : ''} ${sub.isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}>
        {sub.isDone ? <CheckCircle2 size={12} /> : <Circle size={12} />}
      </button>
      {isEditing ? (
        <input autoFocus type="text" ref={editSubTaskRef} defaultValue={sub.title} onBlur={onRename}
          onKeyDown={(e) => e.key === 'Enter' && onRename()} spellCheck="false" autoComplete="off"
          className={`flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5 outline-none text-[10px] ${isDark ? 'text-white' : 'text-slate-800'}`} />
      ) : (
        <span onClick={() => !isLocked && !isCompleted && onStartEdit()}
          className={`group/sub-text relative text-[10px] flex-1 leading-tight cursor-text flex items-center gap-1 ${sub.isDone ? 'text-slate-400 line-through' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>
          {sub.title}
          {!isLocked && !isCompleted && <Pencil size={8} className="opacity-0 group-hover/sub-text:opacity-100 transition-opacity text-slate-400" />}
        </span>
      )}
      {!isLocked && !isCompleted && (
        <button onClick={onDelete} className="opacity-0 group-hover/sub:opacity-100 text-slate-300 hover:text-red-500"><X size={10} /></button>
      )}
    </div>
  );
}
interface SubTaskItemProps {
  sub: SubTask;
  isLocked: boolean;
  isCompleted: boolean;
  isDark: boolean;
  isEditing: boolean;
  editSubTaskRef: React.RefObject<HTMLInputElement>;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
}
export function TimerSettingsPopover({ task, isDark, onUpdateTask, onClose }: TimerSettingsPopoverProps) {
  const isCountdown = task.type === 'countdown';
  const limitMs = task.limitTime || 0;
  const handleToggleTimerType = () => {
    const newType = task.type === 'stopwatch' ? 'countdown' : 'stopwatch';
    const newLimit = newType === 'countdown' ? 25 * 60 * 1000 : null;
    onUpdateTask(task.id, { type: newType, limitTime: newLimit });
  };
  const handleUpdateLimit = (mins) => {
    const ms = Math.max(1, parseInt(mins) || 1) * 60 * 1000;
    onUpdateTask(task.id, { limitTime: ms, type: 'countdown' });
  };
  return (
    <div className={`absolute bottom-full left-0 mb-2 z-50 w-48 p-3 rounded-2xl border shadow-xl animate-in fade-in zoom-in-95 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase text-slate-500">Đồng hồ</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
      </div>
      <div className="grid grid-cols-2 gap-1 mb-2">
        <button onClick={handleToggleTimerType} className={`py-1.5 rounded-lg text-[9px] font-bold transition-all ${!isCountdown ? 'bg-indigo-500 text-white' : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700')}`}>
          Đếm xuôi
        </button>
        <button onClick={handleToggleTimerType} className={`py-1.5 rounded-lg text-[9px] font-bold transition-all ${isCountdown ? 'bg-indigo-500 text-white' : (isDark ? 'bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700')}`}>
          Đếm ngược
        </button>
      </div>
      {isCountdown && (
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[15, 25, 45, 60].map(m => (
            <button key={m} onClick={() => handleUpdateLimit(m)} className={`py-1 rounded-lg text-[9px] font-bold transition-all border ${limitMs === m * 60000 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : (isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500')}`}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
interface TimerSettingsPopoverProps {
  task: Task;
  isDark: boolean;
  onUpdateTask: (id: string, updates: any) => void;
  onClose: () => void;
}
````

## File: src/components/tasks/TaskBoard.tsx
````typescript
import React, { useState } from 'react';
import { Activity, Circle, Clock, CheckCircle2, AlertTriangle, Calendar, LayoutGrid, Layers } from 'lucide-react';
import { isSameWeek, isSameMonth } from 'date-fns';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import TaskItem from './TaskItem';
import { useAudio } from '../../hooks/useAudio';
import { useTaskActionContext } from '../../contexts/TaskActionContext';
import type { Task, UserData } from '../../utils/helpers';
import type { User } from 'firebase/auth';
interface ColumnHeaderProps {
  title: string;
  count: number;
  icon: React.ReactElement;
  colorClass: string;
}
const ColumnHeader: React.FC<ColumnHeaderProps> = ({ title, count, icon, colorClass }) => (
  <div className={`flex items-center justify-between p-3 rounded-2xl mb-4 font-black text-xs uppercase tracking-widest ${colorClass}`}>
    <div className="flex items-center gap-2">{icon} {title}</div>
    <span className="px-2 py-1 bg-white/20 rounded-lg">{count}</span>
  </div>
);
interface TaskBoardProps {
  tasks: Task[];
  user: User | null;
  currentAssigneeId: string | null;
  isDark: boolean;
  now: number;
  aiLoading: boolean;
}
function TaskBoard({
  tasks, user, currentAssigneeId, isDark, now, aiLoading
}: TaskBoardProps) {
  const nowDate = new Date(now);
  const {
    toggleTaskStatus,
    handleDeleteTask,
    handlePriorityChange,
    handleUpdateDeadline,
    handleRenameTask,
    handleSubTaskAction,
    handleUpdateTask,
    handleAiSubtasks
  } = useTaskActionContext();
  const [activeTab, setActiveTab] = useState<'todo' | 'in-progress' | 'done' | 'overdue'>('todo');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
  const { playSound } = useAudio();
  const filterOptions: Array<{ id: 'week' | 'month' | 'all'; label: string; icon: React.ReactElement }> = [
    { id: 'week', label: 'Tuần này', icon: <Calendar size={14} /> },
    { id: 'month', label: 'Tháng này', icon: <Layers size={14} /> },
    { id: 'all', label: 'Tất cả', icon: <LayoutGrid size={14} /> }
  ];
  const handleTimeFilterChange = (filterId: 'week' | 'month' | 'all') => {
    playSound('click');
    setTimeFilter(filterId);
  };
  const handleActiveTabChange = (tabId: 'todo' | 'in-progress' | 'done' | 'overdue') => {
    playSound('click');
    setActiveTab(tabId);
  };
  const filteredByTime = tasks.filter(t => {
    if (timeFilter === 'all') return true;
    const taskDate = t.deadline ? new Date(t.deadline) : new Date(t.createdAt);
    if (timeFilter === 'week') return isSameWeek(taskDate, nowDate, { weekStartsOn: 1 });
    if (timeFilter === 'month') return isSameMonth(taskDate, nowDate);
    return true;
  });
  const sortedTasks = [...filteredByTime].sort((a,b) => b.createdAt - a.createdAt);
  const isOverdue = (t: Task) => {
    if (!t.deadline) return false;
    if (t.status === 'completed_late') return true;
    return t.deadline < now && t.status !== 'completed';
  };
  const overdueTasks = sortedTasks.filter(t => isOverdue(t));
  const todoTasks = sortedTasks.filter(t => (t.status === 'idle' || t.status === 'paused') && !isOverdue(t));
  const inProgressTasks = sortedTasks.filter(t => t.status === 'running' && !isOverdue(t));
  const doneTasks = sortedTasks.filter(t => t.status === 'completed');
  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-2 mb-6 gap-4">
        <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" /> TIẾN ĐỘ TEAM
        </h3>
        {}
        <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-200/50'} gap-1`}>
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => handleTimeFilterChange(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all
                ${timeFilter === f.id
                  ? (isDark ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-indigo-600 shadow-sm')
                  : 'text-slate-500 hover:text-slate-400'}`}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>
      {}
      <div className="flex lg:hidden gap-2 mb-4 px-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleActiveTabChange('todo')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-tight transition-all border ${activeTab === 'todo' ? (isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm') : 'text-slate-500 border-transparent'}`}
          >
            Sắp làm ({todoTasks.length})
          </button>
          <button
            onClick={() => handleActiveTabChange('in-progress')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-tight transition-all border ${activeTab === 'in-progress' ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 border-transparent'}`}
          >
            Đang làm ({inProgressTasks.length})
          </button>
          <button
            onClick={() => handleActiveTabChange('done')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-tight transition-all border ${activeTab === 'done' ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 border-transparent'}`}
          >
            Đã xong ({doneTasks.length})
          </button>
          <button
            onClick={() => handleActiveTabChange('overdue')}
            className={`flex-1 min-w-[100px] py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-tight transition-all border ${activeTab === 'overdue' ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 border-transparent'}`}
          >
            Trễ / Muộn ({overdueTasks.length})
          </button>
      </div>
      {}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start w-full">
         {}
         <div className={`flex-1 w-full p-3 rounded-3xl md:rounded-[2rem] min-h-[300px] md:min-h-[500px] transition-all ${activeTab === 'todo' ? 'block' : 'hidden lg:block'} ${isDark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-slate-100/50 border border-slate-200/50'}`}>
            <ColumnHeader title="Pending / 待办" count={todoTasks.length} icon={<Circle size={16}/>} colorClass={isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-500 shadow-sm"} />
            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {todoTasks.map(task => (
                  <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={nowDate} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                  </Motion.div>
                ))}
              </AnimatePresence>
              {todoTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed rounded-2xl md:rounded-3xl dark:border-slate-700">Trống</div>}
            </div>
         </div>
         {}
         <div className={`flex-1 w-full p-3 rounded-3xl md:rounded-[2rem] min-h-[300px] md:min-h-[500px] transition-all shadow-xl ${activeTab === 'in-progress' ? 'block' : 'hidden lg:block'} ${isDark ? 'bg-indigo-900/10 border border-indigo-500/20 shadow-indigo-500/5' : 'bg-indigo-50/50 border border-indigo-100 shadow-indigo-500/5'}`}>
            <ColumnHeader title="In Progress / 进行中" count={inProgressTasks.length} icon={<Clock size={16} className="animate-spin-slow"/>} colorClass="bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" />
            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {inProgressTasks.map(task => (
                  <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={nowDate} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                  </Motion.div>
                ))}
              </AnimatePresence>
              {inProgressTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-indigo-400/50 uppercase tracking-widest border-2 border-dashed border-indigo-400/30 rounded-2xl md:rounded-3xl">Chưa ai nhận việc</div>}
            </div>
         </div>
         {}
         <div className={`flex-1 w-full p-3 rounded-3xl md:rounded-[2rem] min-h-[300px] md:min-h-[500px] transition-all opacity-80 hover:opacity-100 ${activeTab === 'done' ? 'block' : 'hidden lg:block'} ${isDark ? 'bg-emerald-900/10 border border-emerald-500/20' : 'bg-emerald-50/50 border border-emerald-100'}`}>
            <ColumnHeader title="Finished / 已完成" count={doneTasks.length} icon={<CheckCircle2 size={16}/>} colorClass="bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" />
            <div className="flex flex-col gap-4 relative">
              <AnimatePresence initial={false}>
                {doneTasks.map(task => (
                  <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={nowDate} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                  </Motion.div>
                ))}
              </AnimatePresence>
              {doneTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-emerald-400/50 uppercase tracking-widest border-2 border-dashed border-emerald-400/30 rounded-2xl md:rounded-3xl">Chưa có gì</div>}
            </div>
         </div>
         {}
         <div className={`flex-1 w-full p-3 rounded-3xl md:rounded-[2rem] min-h-[300px] md:min-h-[500px] transition-all ${activeTab === 'overdue' ? 'block' : 'hidden lg:block'} ${isDark ? 'bg-red-900/10 border border-red-500/20' : 'bg-red-50/50 border border-red-100'}`}>
            <ColumnHeader title="Overdue / Xong muộn" count={overdueTasks.length} icon={<AlertTriangle size={16}/>} colorClass="bg-red-500 text-white shadow-lg shadow-red-500/20" />
            <div className="flex flex-col gap-4 relative">
              <AnimatePresence initial={false}>
                {overdueTasks.map(task => (
                  <Motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <TaskItem task={task} user={user} currentAssigneeId={currentAssigneeId} isDark={isDark} now={nowDate} aiLoading={aiLoading} onStart={(id) => toggleTaskStatus(id, 'start')} onPause={(id) => toggleTaskStatus(id, 'pause')} onComplete={(id) => toggleTaskStatus(id, 'complete')} onDelete={handleDeleteTask} onPriorityChange={handlePriorityChange} onUpdateDeadline={handleUpdateDeadline} onRenameTask={handleRenameTask} onSubTaskAdd={handleSubTaskAction} onSubTaskToggle={handleSubTaskAction} onSubTaskDelete={handleSubTaskAction} onUpdateTask={handleUpdateTask} onAiSubtasks={handleAiSubtasks} />
                  </Motion.div>
                ))}
              </AnimatePresence>
              {overdueTasks.length === 0 && <div className="text-center p-8 text-[10px] md:text-xs font-bold text-red-400/50 uppercase tracking-widest border-2 border-dashed border-red-400/30 rounded-2xl md:rounded-3xl">Tuyệt vời!</div>}
            </div>
         </div>
      </div>
    </div>
  );
}
export default React.memo(TaskBoard);
````

## File: src/components/tasks/TaskItem.tsx
````typescript
import React, { useState, useRef } from 'react';
import { Play, Pause, CheckCircle2, Clock, Calendar, Pencil, Lock, BrainCircuit } from 'lucide-react';
import { formatDuration, getLegacyIdByEmail } from '../../utils/helpers';
import type { Task } from '../../utils/helpers';
import { formatDistanceToNow, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TaskTags, TaskTitle, SubTaskItem, TimerSettingsPopover } from './subcomponents/TaskComponents';
type SubTaskActionType = 'add' | 'toggle' | 'rename' | 'delete';
interface User {
  uid?: string;
  email?: string | null;
}
interface TaskItemProps {
  task: Task;
  user: User | null;
  currentAssigneeId: string | null;
  isDark: boolean;
  now: Date;
  aiLoading: boolean;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
  onUpdateDeadline: (id: string, deadline: string) => void;
  onRenameTask: (id: string, title: string) => void;
  onSubTaskAdd: (taskId: string, subId: string | null, action: SubTaskActionType, title: string) => void;
  onSubTaskToggle: (taskId: string, subId: string, action: SubTaskActionType, title?: string) => void;
  onSubTaskDelete: (taskId: string, subId: string, action: SubTaskActionType) => void;
  onUpdateTask: (id: string, updates: any) => void;
  onAiSubtasks: (id: string, title: string) => void;
}
function TaskItem({
  task, user, currentAssigneeId, isDark, now, aiLoading,
  onStart, onPause, onComplete, onDelete, onPriorityChange, onUpdateDeadline, onRenameTask,
  onSubTaskAdd, onSubTaskToggle, onSubTaskDelete, onUpdateTask, onAiSubtasks
}: TaskItemProps) {
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const editTitleRef = useRef<HTMLInputElement>(null);
  const newSubTaskRef = useRef<HTMLInputElement>(null);
  const editSubTaskRef = useRef<HTMLInputElement>(null);
  const [resetKey, setResetKey] = useState(0);
  const [tempDeadline, setTempDeadline] = useState(task.deadline ? new Date(task.deadline - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '');
  const elapsed = task.status === 'running' ? task.totalTrackedTime + (now - (task.lastStartTime || 0)) : task.totalTrackedTime;
  const displayTime = task.type === 'countdown' ? Math.max(0, (task.limitTime || 0) - elapsed) : elapsed;
  const isWorking = task.status === 'running';
  const legacyId = getLegacyIdByEmail(user?.email);
  const isAssignedToMe = task.assigneeId === currentAssigneeId || (task.assigneeId && task.assigneeId === legacyId);
  const isCreator = !!user && task.createdBy === user.uid;
  const isLocked = task.assigneeId && !isAssignedToMe && !isCreator;
  const isCompleted = task.status?.startsWith('completed');
  const overdue = !!task.deadline && isPast(task.deadline) && !isCompleted;
  const handleDeadlineSubmit = () => {
    if (tempDeadline) onUpdateDeadline(task.id, tempDeadline);
    setIsEditingDeadline(false);
  };
  const handleTitleSubmit = () => {
    const val = editTitleRef.current?.value?.trim();
    if (val && val !== task.title) onRenameTask(task.id, val);
    setIsEditingTitle(false);
  };
  const handleSubTaskRename = (subId) => {
    const val = editSubTaskRef.current?.value?.trim();
    if (val) onSubTaskToggle(task.id, subId, 'rename', val);
    setEditingSubTaskId(null);
  };
  return (
    <div className={`group relative p-4 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-2xl ${isDark ? (isCompleted ? 'bg-slate-800/50 border-slate-700/50 opacity-70' : 'bg-slate-800/90 backdrop-blur-md border-slate-600 shadow-xl shadow-slate-900/50') : (isCompleted ? 'bg-white/60 border-slate-200/50 opacity-70' : 'bg-white/95 backdrop-blur-md border-slate-200 shadow-xl shadow-slate-200/50')} ${isWorking ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 border-indigo-500' : ''}`}>
      <TaskTags task={task} isLocked={isLocked} isDark={isDark} onPriorityChange={onPriorityChange} onDelete={onDelete} />
      <TaskTitle task={task} isLocked={isLocked} isCompleted={isCompleted} isDark={isDark} isEditing={isEditingTitle} editTitleRef={editTitleRef} onStartEdit={() => setIsEditingTitle(true)} onCancelEdit={handleTitleSubmit} />
      {task.autoPauseReason === 'heartbeat_timeout' && (
        <div className={`flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <span className="text-[10px]">⏸️</span>
          <span className={`text-[9px] font-bold ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>Đã tự dừng — quên tắt task</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex flex-col gap-1 text-[10px] font-bold">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Tạo: {new Date(task.createdAt).toLocaleDateString('vi-VN')}</span>
          <div>
            {isEditingDeadline ? (
              <input type="datetime-local" value={tempDeadline} onChange={(e) => setTempDeadline(e.target.value)} onBlur={handleDeadlineSubmit} autoFocus className={`bg-indigo-500/10 border border-indigo-500/30 rounded px-1 py-0.5 outline-none text-[10px] ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`} style={{ colorScheme: isDark ? 'dark' : 'light' }} />
            ) : (
              <button onClick={() => !isLocked && setIsEditingDeadline(true)} disabled={isLocked} className={`flex flex-col text-left group/dl transition-all ${isLocked ? 'cursor-default' : 'hover:scale-[1.02] cursor-pointer'}`}>
                <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 animate-pulse' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                  Hạn: {task.deadline ? new Date(task.deadline).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa có'}
                  {!isLocked && <Calendar size={10} className="opacity-0 group-hover/dl:opacity-100 transition-opacity" />}
                </span>
                {task.deadline && <span className={`text-[8px] ${overdue ? 'text-red-400' : 'text-slate-500'}`}>({formatDistanceToNow(task.deadline, { locale: vi, addSuffix: true })})</span>}
              </button>
            )}
          </div>
          <div className="relative">
            <button onClick={() => !isLocked && !isCompleted && setIsSettingsOpen(!isSettingsOpen)} disabled={isLocked || isCompleted} className={`flex items-center gap-1 font-mono transition-all group/timer ${isWorking ? 'text-indigo-500' : 'text-slate-400'} ${(!isLocked && !isCompleted) ? 'hover:text-indigo-400' : ''}`}>
              <Clock size={10} className={isWorking ? 'animate-spin' : ''} />
              {formatDuration(displayTime)}
            </button>
            {isSettingsOpen && (
              <TimerSettingsPopover task={task} isDark={isDark} onUpdateTask={onUpdateTask} onClose={() => setIsSettingsOpen(false)} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isLocked && !isCompleted && (
            <>
              <button onClick={() => isWorking ? onPause(task.id) : onStart(task.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isWorking ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-indigo-600 text-white hover:scale-110 shadow-md shadow-indigo-600/30'}`}>
                {isWorking ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={() => onComplete(task.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-slate-700 text-slate-400 hover:bg-emerald-500 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white'}`}>
                <CheckCircle2 size={14} />
              </button>
            </>
          )}
          {isLocked && !isCompleted && <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-300/10 text-slate-400 opacity-50"><Lock size={14} /></div>}
        </div>
      </div>
      {((task.subTasks && task.subTasks.length > 0) || !isCompleted) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
          {(task.subTasks || []).map(sub => (
            <SubTaskItem key={sub.id} sub={sub} isLocked={isLocked} isCompleted={isCompleted} isDark={isDark} isEditing={editingSubTaskId === sub.id} editSubTaskRef={editSubTaskRef} onToggle={() => onSubTaskToggle(task.id, sub.id, 'toggle')} onRename={() => handleSubTaskRename(sub.id)} onDelete={() => onSubTaskDelete(task.id, sub.id, 'delete')} onStartEdit={() => setEditingSubTaskId(sub.id)} />
          ))}
          {!isLocked && !isCompleted && (
            <>
              <form onSubmit={(e) => { e.preventDefault(); const val = newSubTaskRef.current?.value?.trim(); if (val) { onSubTaskAdd(task.id, null, 'add', val); setResetKey(prev => prev + 1); } }} className="flex mt-2">
                <input key={`newsub-${resetKey}`} type="text" ref={newSubTaskRef} placeholder="+ Việc nhỏ..." spellCheck="false" autoComplete="off" className={`w-full bg-slate-100/50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-lg px-2 py-1.5 text-[10px] font-semibold outline-none focus:border-indigo-500 transition-colors ${isDark ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-700 placeholder:text-slate-400'}`} />
              </form>
              {(!task.subTasks || task.subTasks.length === 0) && (
                <button onClick={() => onAiSubtasks(task.id, task.title)} disabled={aiLoading} className="w-full mt-2 py-1.5 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-violet-500/30 bg-violet-500/5 text-[9px] font-black uppercase text-violet-500 hover:bg-violet-500 hover:text-white transition-all">
                  <BrainCircuit size={12} /> AI Vạch cách làm
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
export default React.memo(TaskItem);
````

## File: src/components/tasks/TaskListView.tsx
````typescript
import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, Circle, Clock, AlertTriangle, Users, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatDuration } from '../../utils/helpers';
import { ASSIGNEES } from '../../utils/constants';
import type { Task } from '../../utils/helpers';
import type { User } from 'firebase/auth';
interface SubTask {
  id: string;
  title: string;
  isDone: boolean;
}
interface TaskListItemProps {
  task: Task;
  isDark: boolean;
  now: number;
  currentAssigneeId: string | null;
  user: User | null;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}
const TaskListItem: React.FC<TaskListItemProps> = ({
  task, isDark, now, currentAssigneeId, user,
  onStart, onPause, onComplete, onDelete
}) => {
  const [expanded, setExpanded] = useState(false);
  const nowDate = new Date(now);
  const elapsed = task.status === 'running' ? task.totalTrackedTime + (now - (task.lastStartTime || 0)) : task.totalTrackedTime;
  const displayTime = task.type === 'countdown' ? Math.max(0, (task.limitTime || 0) - elapsed) : elapsed;
  const isWorking = task.status === 'running';
  const isAssignedToMe = task.assigneeId === currentAssigneeId;
  const isCreator = !!user && task.createdBy === user.uid;
  const isLocked = task.assigneeId && !isAssignedToMe && !isCreator;
  const hasDeadline = typeof task.deadline === 'number';
  const overdue = hasDeadline && isPast(task.deadline as number) && task.status !== 'completed';
  const subTasks = task.subTasks || [];
  return (
    <div className={`flex flex-col p-3 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-800' : 'bg-white/90 border-slate-200 hover:bg-white shadow-sm'} ${isWorking ? 'ring-1 ring-indigo-500' : ''} ${task.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        {}
        <div className="flex-shrink-0 mt-0.5 self-start">
          {task.status === 'completed' ? <CheckCircle2 size={18} className="text-emerald-500" /> :
           isWorking ? <Clock size={18} className="text-indigo-500 animate-spin-slow" /> :
           overdue ? <AlertTriangle size={18} className="text-red-500" /> :
           <Circle size={18} className="text-slate-400" />}
        </div>
        {}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 cursor-pointer" onClick={() => subTasks.length > 0 && setExpanded(!expanded)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-bold truncate ${task.status === 'completed' ? 'line-through text-slate-500' : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>
                {task.title}
              </h4>
              {task.priority === 'high' && <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-red-500/20 text-red-500 uppercase">GẤP</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] font-semibold text-slate-500">
              {task.assigneeId && (
                <span className="flex items-center gap-1"><Users size={10} /> {task.assigneeName}</span>
              )}
              {hasDeadline && (
                <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                  <Calendar size={10} /> {formatDistanceToNow(new Date(task.deadline as number), { locale: vi, addSuffix: true })}
                </span>
              )}
              {subTasks.length > 0 && (
                <span className="flex items-center gap-0.5 text-indigo-400">
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {subTasks.filter(s => s.isDone).length}/{subTasks.length} việc nhỏ
                </span>
              )}
              <span className={`flex items-center gap-1 ml-auto sm:ml-0 font-mono ${isWorking ? 'text-indigo-500' : ''}`}>
                <Clock size={10} /> {formatDuration(displayTime)}
              </span>
            </div>
          </div>
        </div>
        {}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isLocked && task.status !== 'completed' && (
            <button
              onClick={(e) => { e.stopPropagation(); isWorking ? onPause(task.id) : onStart(task.id); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isWorking ? 'bg-amber-500 text-white shadow-md' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
            >
              {isWorking ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
          )}
          {!isLocked && task.status !== 'completed' && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-emerald-500 hover:text-white transition-all"
            >
              <CheckCircle2 size={14} />
            </button>
          )}
          {!isLocked && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {}
      {expanded && subTasks.length > 0 && (
        <div className={`mt-3 pt-3 pl-8 border-t flex flex-col gap-1.5 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          {subTasks.map(sub => (
            <div key={sub.id} className="flex items-center gap-2">
              {sub.isDone ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Circle size={12} className="text-slate-400" />}
              <span className={`text-xs ${sub.isDone ? 'line-through text-slate-500' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>{sub.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
interface TaskGroupProps {
  title: string;
  tasksList: Task[];
  colorClass: string;
  icon: React.ReactElement;
  isDark: boolean;
  now: number;
  currentAssigneeId: string | null;
  user: User | null;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}
const TaskGroup: React.FC<TaskGroupProps> = ({ title, tasksList, colorClass, icon, isDark, now, currentAssigneeId, user, onStart, onPause, onComplete, onDelete }) => {
  if (tasksList.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest mb-3 ${colorClass}`}>
        {icon} {title} ({tasksList.length})
      </h3>
      <div className="flex flex-col gap-2">
        {tasksList.map(task => (
          <TaskListItem
            key={task.id}
            task={task}
            isDark={isDark}
            now={now}
            currentAssigneeId={currentAssigneeId}
            user={user}
            onStart={onStart}
            onPause={onPause}
            onComplete={onComplete}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
interface TaskListViewProps {
  tasks: Task[];
  user: User | null;
  currentAssigneeId: string | null;
  isDark: boolean;
  now: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}
function TaskListView({
  tasks, user, currentAssigneeId, isDark, now,
  onStart, onPause, onComplete, onDelete
}: TaskListViewProps) {
  const sortedTasks = [...tasks].sort((a,b) => b.createdAt - a.createdAt);
  const isOverdue = (t: Task) => t.deadline && t.deadline < now && t.status !== 'completed';
  const overdueTasks = sortedTasks.filter(t => isOverdue(t));
  const inProgressTasks = sortedTasks.filter(t => t.status === 'running' && !isOverdue(t));
  const todoTasks = sortedTasks.filter(t => (t.status === 'idle' || t.status === 'paused') && !isOverdue(t));
  const doneTasks = sortedTasks.filter(t => t.status === 'completed');
  return (
    <div className={`p-4 md:p-6 rounded-[2.5rem] ${isDark ? 'bg-slate-900/40 border border-slate-800' : 'bg-slate-50/50 border border-slate-200'} pb-24`}>
      <TaskGroup title="Overdue" tasksList={overdueTasks} colorClass="text-red-500" icon={<AlertTriangle size={14} />} isDark={isDark} now={now} currentAssigneeId={currentAssigneeId} user={user} onStart={onStart} onPause={onPause} onComplete={onComplete} onDelete={onDelete} />
      <TaskGroup title="In Progress" tasksList={inProgressTasks} colorClass="text-indigo-500" icon={<Clock size={14} />} isDark={isDark} now={now} currentAssigneeId={currentAssigneeId} user={user} onStart={onStart} onPause={onPause} onComplete={onComplete} onDelete={onDelete} />
      <TaskGroup title="To Do" tasksList={todoTasks} colorClass="text-slate-500" icon={<Circle size={14} />} isDark={isDark} now={now} currentAssigneeId={currentAssigneeId} user={user} onStart={onStart} onPause={onPause} onComplete={onComplete} onDelete={onDelete} />
      <TaskGroup title="Finished" tasksList={doneTasks} colorClass="text-emerald-500" icon={<CheckCircle2 size={14} />} isDark={isDark} now={now} currentAssigneeId={currentAssigneeId} user={user} onStart={onStart} onPause={onPause} onComplete={onComplete} onDelete={onDelete} />
      {tasks.length === 0 && (
        <div className="text-center p-12 border-2 border-dashed rounded-[2rem] border-slate-300 dark:border-slate-700">
          <p className="text-sm font-bold text-slate-500">Chưa có công việc nào!</p>
        </div>
      )}
    </div>
  );
}
export default React.memo(TaskListView);
````

## File: src/contexts/TaskActionContext.tsx
````typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { Task } from '../utils/helpers';
export interface TaskActionContextType {
  aiLoading: boolean;
  toggleTaskStatus: (
    id: string,
    action: 'start' | 'pause' | 'complete',
    options?: { completionSource?: 'manual' | 'auto_schedule' }
  ) => Promise<void>;
  handlePriorityChange: (id: string, currentPriority?: string) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
  handleRenameTask: (taskId: string, newTitle: string) => Promise<void>;
  handleUpdateDeadline: (taskId: string, newDate: string | Date) => Promise<void>;
  handleSubTaskAction: (
    taskId: string,
    subId: string | null,
    type: 'add' | 'toggle' | 'rename' | 'delete',
    val?: string
  ) => Promise<void>;
  handleAiSubtasks: (taskId: string, title: string) => Promise<void>;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}
const TaskActionContext = createContext<TaskActionContextType | null>(null);
export function TaskActionProvider({ children, actions }: { children: ReactNode, actions: TaskActionContextType }) {
  return (
    <TaskActionContext.Provider value={actions}>
      {children}
    </TaskActionContext.Provider>
  );
}
export function useTaskActionContext() {
  const context = useContext(TaskActionContext);
  if (!context) {
    console.warn('useTaskActionContext called outside of TaskActionProvider');
    throw new Error('useTaskActionContext must be used within a TaskActionProvider');
  }
  return context;
}
````

## File: src/contexts/TaskContext.tsx
````typescript
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task } from '../utils/helpers';
interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTask: (updated: Partial<Task> & { id: string }) => void;
  onSubTaskToggle: (parentId: string, subId: string) => void;
}
const TaskContext = createContext<TaskContextType | null>(null);
export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }
  return ctx;
};
export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const findTask = useCallback((id: string): Task | null => tasks.find((t) => t.id === id) || null, [tasks]);
  const onStart = useCallback((id: string) => {
    const task = findTask(id);
    if (task) {
      task.status = 'running';
      setTasks([...tasks]);
    }
  }, [tasks, findTask]);
  const onPause = useCallback((id: string) => {
    const task = findTask(id);
    if (task) {
      task.status = 'paused';
      setTasks([...tasks]);
    }
  }, [tasks, findTask]);
  const onDelete = useCallback((id: string) => {
    const remove = (list: Task[]): Task[] =>
      list.filter((t) => {
        if (t.id === id) return false;
        return true;
      });
    setTasks(remove(tasks));
  }, [tasks]);
  const onUpdateTask = useCallback((updated: Partial<Task> & { id: string }) => {
    const update = (list: Task[]): Task[] =>
      list.map((t) => {
        if (t.id === updated.id) return { ...t, ...updated };
        return t;
      });
    setTasks(update(tasks));
  }, [tasks]);
  const onSubTaskToggle = useCallback((parentId: string, subId: string) => {
    const parent = findTask(parentId);
    if (!parent || !parent.subTasks) return;
    parent.subTasks = parent.subTasks.map((st) =>
      st.id === subId ? { ...st, isDone: !st.isDone } : st
    );
    setTasks([...tasks]);
  }, [tasks, findTask]);
  const value: TaskContextType = {
    tasks,
    setTasks,
    onStart,
    onPause,
    onDelete,
    onUpdateTask,
    onSubTaskToggle,
  };
  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
````

## File: src/contexts/UserContext.tsx
````typescript
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
export interface UserInfo {
  id: string;
  email: string;
  name: string;
}
interface UserContextType {
  userInfo: UserInfo | null;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
  updateUser: (data: Partial<UserInfo>) => void;
}
const UserContext = createContext<UserContextType | null>(null);
export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUserContext must be used within UserProvider");
  }
  return ctx;
};
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const updateUser = useCallback((data: Partial<UserInfo>) => {
    setUserInfo((prev) => (prev ? { ...prev, ...data } : null));
  }, []);
  const value = { userInfo, setUserInfo, updateUser };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
````

## File: src/hooks/useActivityResume.ts
````typescript
import { useEffect, useRef } from 'react';
import * as taskService from '../services/taskService';
import type { Task } from '../utils/helpers';
import type { User } from 'firebase/auth';
interface UseActivityResumeProps {
  user: User | null;
  tasks: Task[];
  onResume?: () => void;
}
export const useActivityResume = ({ user, tasks, onResume }: UseActivityResumeProps): void => {
  const lastResumeAtRef = useRef<number>(0);
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      const now = Date.now();
      if (now - lastResumeAtRef.current < 3000) return;
      lastResumeAtRef.current = now;
      const uid = user?.uid;
      if (uid && uid !== 'local-user-test') {
        const myRunningTask = tasks.find(
          (task) => task.status === 'running' && task.currentWorker === uid
        );
        if (myRunningTask?.id) {
          taskService.updateTask(myRunningTask.id, { lastHeartbeat: now }).catch(() => {});
        }
      }
      onResume?.();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pageshow', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pageshow', onVisible);
    };
  }, [user, tasks, onResume]);
};
````

## File: src/hooks/useAiActions.ts
````typescript
import { useState, useCallback } from 'react';
import * as aiService from '../services/aiService';
import { Task, UserData } from '../utils/helpers';
interface UseAiActionsProps {
  tasks: Task[];
  userData: UserData;
}
interface UseAiActionsReturn {
  isSummarizing: boolean;
  aiReport: string;
  handleSummarize: () => Promise<void>;
  setAiReport: React.Dispatch<React.SetStateAction<string>>;
}
export const useAiActions = ({ tasks, userData }: UseAiActionsProps): UseAiActionsReturn => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const handleSummarize = useCallback(async () => {
    if (tasks.length === 0) return;
    setIsSummarizing(true);
    try {
      const res = await aiService.generateTaskSummary(tasks, userData);
      setAiReport(res);
    } catch (e) {
      console.error("AI Summarize error:", e);
    } finally {
      setIsSummarizing(false);
    }
  }, [tasks, userData]);
  return {
    isSummarizing,
    aiReport,
    handleSummarize,
    setAiReport
  };
};
````

## File: src/hooks/useAppBootstrap.ts
````typescript
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isDummyConfig } from '../firebase';
import * as taskService from '../services/taskService';
import * as userService from '../services/userService';
import { Task } from '../utils/helpers';
interface UseAppBootstrapProps {
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}
interface UseAppBootstrapReturn {
  user: User | null;
  authError: string | null;
  isLoading: boolean;
}
interface LocalUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string;
  email: string;
}
const LOCAL_USER_TEST_UID = 'local-user-test';
const isFirebaseUser = (candidate: User | LocalUser | null): candidate is User => {
  if (!candidate) return false;
  return candidate.uid !== LOCAL_USER_TEST_UID;
};
export const useAppBootstrap = ({ setTasks }: UseAppBootstrapProps): UseAppBootstrapReturn => {
  const [user, setUser] = useState<User | LocalUser | null>(() => (
    isDummyConfig ? { uid: LOCAL_USER_TEST_UID, isAnonymous: true, displayName: 'Guest', email: 'guest@example.com' } : null
  ));
  const [authError, setAuthError] = useState<string | null>(() => (
    isDummyConfig ? "Chỉ chạy cục bộ do lỗi API Key." : null
  ));
  const [isLoading, setIsLoading] = useState(!isDummyConfig);
  useEffect(() => {
    if (isDummyConfig) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthError(null);
        if (!currentUser.isAnonymous) {
          try {
            await userService.registerTeamMember(currentUser.uid, {
              uid: currentUser.uid,
              displayName: currentUser.displayName ?? undefined,
              photoURL: currentUser.photoURL ?? undefined,
              email: currentUser.email ?? undefined,
            });
          } catch (err) {
            console.error("Error registering team member:", err);
          }
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (!isFirebaseUser(user)) return;
    const unsubscribe = taskService.subscribeToTasks(setTasks, (error) => {
      setAuthError("Firestore Read Error: " + error.message);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user, setTasks]);
  return {
    user: isFirebaseUser(user) ? user : null,
    authError,
    isLoading
  };
};
````

## File: src/hooks/useAppUiActions.ts
````typescript
import { useCallback } from 'react';
import { UserData } from '../utils/helpers';
interface UseAppUiActionsProps {
  playSound: (sound: string) => void;
  setHasUserSelectedTab: (val: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setFilterMode: (mode: string) => void;
  userData: UserData;
  setUserData: (data: UserData) => void;
  handleUpdateSettings: (updates: Partial<UserData>) => void;
}
interface UseAppUiActionsReturn {
  handleTabChange: (tab: string) => void;
  handleFilterModeChange: (mode: string) => void;
  handleToggleDarkMode: () => void;
  handleRenameMascot: () => void;
  handleChangeMascotAvatar: () => void;
}
export const useAppUiActions = ({
  playSound,
  setHasUserSelectedTab,
  setCurrentTab,
  setFilterMode,
  userData,
  setUserData,
  handleUpdateSettings
}: UseAppUiActionsProps): UseAppUiActionsReturn => {
  const handleTabChange = useCallback((tab: string) => {
    playSound('click');
    setHasUserSelectedTab(true);
    setCurrentTab(tab);
  }, [playSound, setHasUserSelectedTab, setCurrentTab]);
  const handleFilterModeChange = useCallback((mode: string) => {
    playSound('click');
    setFilterMode(mode);
  }, [playSound, setFilterMode]);
  const handleToggleDarkMode = useCallback(() => {
    setUserData({ ...userData, isDarkMode: !userData.isDarkMode });
  }, [setUserData, userData]);
  const handleRenameMascot = useCallback(() => {
    const nextName = window.prompt('Đặt tên mới cho Mascot AI:', userData.mascotName || 'Mochi');
    if (!nextName?.trim()) return;
    handleUpdateSettings({ mascotName: nextName.trim() });
  }, [handleUpdateSettings, userData.mascotName]);
  const handleChangeMascotAvatar = useCallback(() => {
    const nextAvatar = window.prompt('Đổi avatar mascot (emoji hoặc URL):', userData.mascotAvatar || '🤖');
    if (!nextAvatar?.trim()) return;
    handleUpdateSettings({ mascotAvatar: nextAvatar.trim() });
  }, [handleUpdateSettings, userData.mascotAvatar]);
  return {
    handleTabChange,
    handleFilterModeChange,
    handleToggleDarkMode,
    handleRenameMascot,
    handleChangeMascotAvatar
  };
};
````

## File: src/hooks/useAppViewModel.ts
````typescript
import { useMemo } from 'react';
import { calculateLevel, LevelInfo, Task, TeamMember } from '../utils/helpers';
import type { User } from 'firebase/auth';
interface UseAppViewModelProps {
  tasks: Task[];
  filterMode: string;
  user: User | null;
  teamMembers: TeamMember[];
  currentTab: string;
  hasUserSelectedTab: boolean;
  defaultView: string;
  userXp: number;
}
interface UseAppViewModelReturn {
  activeTab: string;
  filteredTasks: Task[];
  partnerTask: Task | undefined;
  partnerInfo: TeamMember | { displayName: string; email: string } | null;
  myRunningTask: Task | undefined;
  levelInfo: LevelInfo;
}
export const useAppViewModel = ({
  tasks,
  filterMode,
  user,
  teamMembers,
  currentTab,
  hasUserSelectedTab,
  defaultView,
  userXp
}: UseAppViewModelProps): UseAppViewModelReturn => {
  const activeTab = hasUserSelectedTab ? currentTab : (defaultView || currentTab);
  const filteredTasks = useMemo(() => (
    tasks.filter((task) => {
      if (filterMode === 'all') return true;
      return task.assigneeId === filterMode;
    })
  ), [tasks, filterMode]);
  const uid = user ? user.uid : "local-user-test";
  const partnerTask = useMemo(
    () => tasks.find((t) => t.status === 'running' && t.currentWorker && t.currentWorker !== uid),
    [tasks, uid]
  );
  const partnerInfo = useMemo(() => {
    if (!partnerTask) return null;
    return teamMembers.find((m) => m.uid === partnerTask.currentWorker) || {
      displayName: partnerTask.currentWorkerName || 'Đồng đội',
      email: partnerTask.currentWorkerName === 'Tít' ? 'tit@example.com' : 'tun@example.com'
    };
  }, [partnerTask, teamMembers]);
  const myRunningTask = useMemo(
    () => tasks.find((t) => t.status === 'running' && t.currentWorker === uid),
    [tasks, uid]
  );
  const levelInfo = useMemo(() => calculateLevel(userXp || 0), [userXp]);
  return {
    activeTab,
    filteredTasks,
    partnerTask,
    partnerInfo,
    myRunningTask,
    levelInfo
  };
};
````

## File: src/hooks/useAudio.ts
````typescript
import { useCallback, useEffect, useRef } from 'react';
interface SoundConfig {
  src: string;
  fallbackUrl: string;
  volume: number;
  haptic?: number[];
}
const SOUNDS: Record<string, SoundConfig> = {
  click: { src: '/sounds/click.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', volume: 0.2, haptic: [8] },
  complete: { src: '/sounds/complete.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', volume: 0.3, haptic: [20, 30, 20] },
  'focus-start': { src: '/sounds/focus-start.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3', volume: 0.24, haptic: [10, 20, 8] },
  start: { src: '/sounds/focus-start.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3', volume: 0.3, haptic: [12, 20, 8] },
  delete: { src: '/sounds/delete.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/256/256-preview.mp3', volume: 0.22, haptic: [10] },
  ai: { src: '/sounds/complete.mp3', fallbackUrl: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', volume: 0.28 }
};
const resolveSource = (sound: SoundConfig): string => sound?.src || sound?.fallbackUrl || '';
export function useAudio(): { playSound: (soundKey: string) => void } {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const preloadAttemptedRef = useRef(false);
  const hasUserGestureRef = useRef(false);
  useEffect(() => {
    if (preloadAttemptedRef.current) return;
    preloadAttemptedRef.current = true;
    Object.entries(SOUNDS).forEach(([soundKey, sound]) => {
      const audio = new Audio(resolveSource(sound));
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        if (sound.fallbackUrl && audio.src !== sound.fallbackUrl) { audio.src = sound.fallbackUrl; audio.load(); }
      });
      audioRefs.current[soundKey] = audio;
    });
  }, []);
  useEffect(() => {
    const markUserGesture = () => {
      hasUserGestureRef.current = true;
    };
    window.addEventListener('pointerdown', markUserGesture, { once: true });
    return () => window.removeEventListener('pointerdown', markUserGesture);
  }, []);
  const playSound = useCallback((soundKey: string) => {
    const sound = SOUNDS[soundKey];
    if (!sound) return;
    if (!audioRefs.current[soundKey]) {
      const audio = new Audio(resolveSource(sound));
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        if (sound.fallbackUrl && audio.src !== sound.fallbackUrl) { audio.src = sound.fallbackUrl; audio.load(); }
      });
      audioRefs.current[soundKey] = audio;
    }
    const baseAudio = audioRefs.current[soundKey];
    const audio = baseAudio.paused ? baseAudio : (baseAudio.cloneNode(true) as HTMLAudioElement);
    if (audio.currentTime !== 0) Object.assign(audio, { currentTime: 0 });
    Object.assign(audio, { volume: sound.volume ?? 0.3 });
    audio.play().catch(() => undefined);
    if (
      hasUserGestureRef.current &&
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function' &&
      sound.haptic
    ) {
      try {
        navigator.vibrate(sound.haptic);
      } catch {
      }
    }
  }, []);
  return { playSound };
}
````

## File: src/hooks/useAutoTaskLogic.ts
````typescript
import { useEffect, useRef } from 'react';
interface Task {
  id: string;
  title: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'completed_late';
  scheduledStartTime?: number;
  scheduledEndTime?: number;
}
interface TaskActions {
  toggleTaskStatus: (
    id: string,
    action: 'start' | 'pause' | 'complete',
    options?: { completionSource?: 'manual' | 'auto_schedule' }
  ) => Promise<void>;
}
export const useAutoTaskLogic = (
  tasks: Task[],
  now: number,
  taskActions: TaskActions
): void => {
  const triggeredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!tasks || !tasks.length || !now || !taskActions) return;
    tasks.forEach(task => {
      const { id, status, scheduledStartTime, scheduledEndTime } = task;
      if (!scheduledStartTime || !scheduledEndTime) return;
      if (
        now >= scheduledStartTime &&
        now < scheduledEndTime &&
        status === 'idle' &&
        !triggeredRef.current.has(`${id}-start`)
      ) {
        console.log(`[AutoLogic] Starting task: ${task.title}`);
        triggeredRef.current.add(`${id}-start`);
        taskActions.toggleTaskStatus(id, 'start');
      }
      if (
        now >= scheduledEndTime &&
        status === 'running' &&
        !triggeredRef.current.has(`${id}-complete`)
      ) {
        console.log(`[AutoLogic] Completing task: ${task.title}`);
        triggeredRef.current.add(`${id}-complete`);
        taskActions.toggleTaskStatus(id, 'complete', { completionSource: 'auto_schedule' });
      }
    });
  }, [tasks, now, taskActions]);
};
````

## File: src/hooks/useCalendarAutoSync.ts
````typescript
import { useEffect, useCallback, useRef } from 'react';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';
import { parseGCalEvent } from '../utils/calendarUtils';
import { addTask } from '../services/taskService';
import { ASSIGNEES } from '../utils/constants';
import { CalendarEvent } from '../utils/helpers';
type OwnerKey = keyof typeof ASSIGNEES;
const isOwnerKey = (value: unknown): value is OwnerKey =>
  typeof value === 'string' && value in ASSIGNEES;
interface CalendarAutoSyncProps {
  user: any;
  userData: any;
  teamMembers: any[];
  tasks: any[];
  config: {
    calendarApiKey: string;
    calendarIdTit: string;
    calendarIdTun: string;
    appsScriptUrl: string;
  };
}
export const useCalendarAutoSync = ({
  user,
  userData,
  teamMembers,
  tasks,
  config
}: CalendarAutoSyncProps) => {
  const lastSyncRef = useRef<number>(0);
  const prevAutoSyncRef = useRef<boolean>(false);
  const sync = useCallback(async (options?: { force?: boolean; reason?: string }) => {
    if (!user) return;
    const allowWithoutAutoSync = options?.reason === 'enter_calendar';
    if (!userData.autoSyncCalendar && !allowWithoutAutoSync) return;
    const now = Date.now();
    if (!options?.force && now - lastSyncRef.current < 15 * 60 * 1000) return;
    lastSyncRef.current = now;
    const { calendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl } = config;
    if (!appsScriptUrl && !calendarApiKey) return;
    const tMin = startOfDay(new Date());
    const tMax = endOfDay(new Date());
    const fetchViaAppsScript = async (calId: string, owner: string): Promise<CalendarEvent[]> => {
      if (!calId) return [];
      const params = new URLSearchParams({
        calendarId: calId,
        timeMin: tMin.toISOString(),
        timeMax: tMax.toISOString(),
      });
      try {
        const res = await fetch(`${appsScriptUrl}?${params}`);
        if (!res.ok) return [];
        const data = await res.json();
        if (data?.error) return [];
        return (data.items || []).map((e: any) => parseGCalEvent(e, owner));
      } catch { return []; }
    };
    const fetchViaDirectApi = async (calId: string, owner: string): Promise<CalendarEvent[]> => {
      if (!calId || !calendarApiKey) return [];
      const params = new URLSearchParams({
        key: calendarApiKey,
        timeMin: tMin.toISOString(),
        timeMax: tMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).map((e: any) => parseGCalEvent(e, owner));
      } catch { return []; }
    };
    const fetchOne = async (calId: string, owner: string): Promise<CalendarEvent[]> => {
      if (!calId) return [];
      if (appsScriptUrl) {
        const scriptEvents = await fetchViaAppsScript(calId, owner);
        if (scriptEvents.length > 0) return scriptEvents;
      }
      if (calendarApiKey) return await fetchViaDirectApi(calId, owner);
      return [];
    };
    const [titEvents, tunEvents] = await Promise.all([
      fetchOne(calendarIdTit, 'tit'),
      fetchOne(calendarIdTun, 'tun'),
    ]);
    const allEvents = [...titEvents, ...tunEvents].filter(
      (e): e is CalendarEvent & { start: Date; end: Date } => Boolean(e.start && e.end && !e.isAllDay)
    );
    for (const event of allEvents) {
      const exists = tasks.some((t) => {
        if (event.id && t.calendarEventId) return t.calendarEventId === event.id;
        return (
          t.scheduledStartTime === event.start.getTime() &&
          t.title === event.title &&
          Boolean(t.deadline) &&
          isSameDay(new Date(t.deadline as number), event.start)
        );
      });
      if (!exists) {
        console.log(`[AutoSync] Creating automated task for event: ${event.title}`);
        const assignee = teamMembers?.find(m => {
          if (!m?.email) return false;
          const legacyId = (m.email.toLowerCase() === 'dinhthai.ctv@gmail.com') ? 'tit' :
                           (m.email.toLowerCase() === 'transontruc.03@gmail.com') ? 'tun' : null;
          return legacyId === event.owner;
        }) || null;
        const durationMins = Math.max(25, Math.round((event.end.getTime() - event.start.getTime()) / 60000));
        const newTask = {
          title: event.title,
          createdBy: "system-autosync",
          creatorName: "AutoSync",
          assigneeId: assignee?.uid || event.owner,
          assigneeName: assignee?.displayName || (isOwnerKey(event.owner) ? ASSIGNEES[event.owner].name : event.owner),
          assigneePhoto: assignee?.photoURL || (isOwnerKey(event.owner) ? ASSIGNEES[event.owner].photo : null),
          deadline: event.end.getTime(),
          scheduledStartTime: event.start.getTime(),
          scheduledEndTime: event.end.getTime(),
          calendarEventId: event.id,
          priority: 'medium' as const,
          timerType: 'countdown',
          limitTime: durationMins,
          isDone: false,
          status: 'idle' as const,
          totalTrackedTime: 0,
          createdAt: Date.now(),
          subTasks: [],
          isAutomated: true
        };
        await addTask(newTask);
      }
    }
  }, [user, userData.autoSyncCalendar, tasks, teamMembers, config]);
  useEffect(() => {
    sync({ reason: 'interval_bootstrap' });
    const interval = setInterval(sync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sync]);
  useEffect(() => {
    const isEnabled = Boolean(userData?.autoSyncCalendar);
    if (isEnabled && !prevAutoSyncRef.current) {
      lastSyncRef.current = 0;
      sync({ force: true, reason: 'autosync_enabled' });
    }
    prevAutoSyncRef.current = isEnabled;
  }, [userData?.autoSyncCalendar, sync]);
  return { triggerSync: sync };
};
````

## File: src/hooks/useDailyQuest.ts
````typescript
import { useState, useCallback, useEffect } from 'react';
import * as dailyQuestService from '../services/dailyQuestService';
import { Task, UserData } from '../utils/helpers';
import { DailyQuest } from '../services/dailyQuestService';
import { Unsubscribe } from 'firebase/firestore';
export interface UseDailyQuestProps {
  tasks: Task[];
  userData: UserData;
  user: { uid: string } | null;
  handleUpdateSettings: (updates: Partial<UserData>) => Promise<void>;
  playSound: (soundName: string) => void;
}
export interface UseDailyQuestReturn {
  dailyQuest: DailyQuest | null;
  handleRefreshDailyQuest: () => void;
  handleCompleteDailyQuest: () => Promise<void>;
}
export const useDailyQuest = ({
  tasks,
  userData,
  user,
  handleUpdateSettings,
  playSound
}: UseDailyQuestProps): UseDailyQuestReturn => {
  const [dailyQuest, setDailyQuest] = useState<DailyQuest | null>(null);
  useEffect(() => {
    const unsubscribe: Unsubscribe = dailyQuestService.subscribeToDailyQuest(setDailyQuest, (err) =>
      console.error('Daily Quest Subscription Error:', err)
    );
    return () => unsubscribe();
  }, []);
  const handleRefreshDailyQuest = useCallback(() => {
    dailyQuestService
      .ensureDailyQuest(tasks, { model: userData.aiModel || userData.aiMode })
      .then(setDailyQuest)
      .catch((err) => console.error('Refresh Quest Error:', err));
  }, [tasks, userData.aiMode, userData.aiModel]);
  const handleCompleteDailyQuest = useCallback(async () => {
    if (!dailyQuest || dailyQuest.isCompleted || !user) return;
    playSound('complete');
    const reward = dailyQuest.rewardGold || 500;
    await handleUpdateSettings({
      ttGold: (userData.ttGold || 0) + reward,
      xp: (userData.xp || 0) + 100
    });
    await dailyQuestService.completeDailyQuest(dailyQuest, user.uid, userData.displayName || 'Bạn');
  }, [dailyQuest, user, userData, handleUpdateSettings, playSound]);
  return {
    dailyQuest,
    handleRefreshDailyQuest,
    handleCompleteDailyQuest
  };
};
````

## File: src/hooks/useDeepLinks.ts
````typescript
import { useEffect, useRef } from 'react';
import { TaskActionReturn } from './useTaskActions';
interface UseDeepLinksProps {
  taskActions: TaskActionReturn;
  isLoaded: boolean;
}
export const useDeepLinks = ({ taskActions, isLoaded }: UseDeepLinksProps) => {
  const processedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    const action = params.get('action');
    if (taskId && action) {
      const processingKey = `${taskId}-${action}`;
      if (processedRef.current === processingKey) return;
      processedRef.current = processingKey;
      console.log(`[DeepLink] Handling action "${action}" for task "${taskId}"`);
      if (action === 'start') {
        taskActions.toggleTaskStatus(taskId, 'start').then(() => {
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        });
      } else if (action === 'complete') {
        taskActions.toggleTaskStatus(taskId, 'complete').then(() => {
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        });
      }
    }
  }, [isLoaded, taskActions]);
};
````

## File: src/hooks/useFocusTimer.ts
````typescript
import { useCallback } from 'react';
import { useEffect } from 'react';
import { Task } from '../utils/helpers';
import type { User } from 'firebase/auth';
interface UseFocusTimerReturn {
  focusingTaskId: string | null;
  triggerSystemFocus: (name: string) => void;
}
export function useFocusTimer(user: User | null, tasks: Task[]): UseFocusTimerReturn {
  const focusingTaskId = user
    ? tasks.find(t => t.status === 'running' && t.currentWorker === user.uid)?.id ?? null
    : null;
  useEffect(() => {
    if (!user) return;
    const focusingTask = tasks.find(t => t.id === focusingTaskId);
    if (focusingTask) {
      window.postMessage({ type: 'TT_FOCUS_START', taskTitle: focusingTask.title }, '*');
    } else {
      window.postMessage({ type: 'TT_FOCUS_END' }, '*');
    }
  }, [focusingTaskId, tasks, user]);
  useEffect(() => {
    if (!user) return;
    function onExtensionReady(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== 'TT_FOCUS_GUARD_READY') return;
      const focusingTask = tasks.find(t => t.id === focusingTaskId);
      if (focusingTask) {
        window.postMessage({ type: 'TT_FOCUS_START', taskTitle: focusingTask.title }, '*');
      } else {
        window.postMessage({ type: 'TT_FOCUS_END' }, '*');
      }
    }
    window.addEventListener('message', onExtensionReady);
    return () => window.removeEventListener('message', onExtensionReady);
  }, [focusingTaskId, tasks, user]);
  const triggerSystemFocus = useCallback((name: string) => {
    if (!name) return;
    console.log("🚀 Kích hoạt Shortcut:", name);
    const url = `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(name)}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = url;
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);
  return {
    focusingTaskId,
    triggerSystemFocus
  };
}
````

## File: src/hooks/useNow.ts
````typescript
import { useState, useEffect } from 'react';
export const useNow = (): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
};
````

## File: src/hooks/useTaskActions.ts
````typescript
import { useCallback, useState } from 'react';
import confetti from 'canvas-confetti';
import * as taskService from '../services/taskService';
import * as aiService from '../services/aiService';
import type { Task, SubTask } from '../utils/helpers';
import type { User } from 'firebase/auth';
import type { UserData } from '../utils/helpers';
interface TaskActionParams {
  tasks: Task[];
  user: User | null;
  userData: UserData;
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  triggerSystemFocus: (shortcutName: string) => void;
  awardTaskRewards: (isLate: boolean) => Promise<void>;
  awardSubTaskRewards: () => Promise<void>;
  playSound: (soundName: string) => void;
}
export interface TaskActionReturn {
  aiLoading: boolean;
  toggleTaskStatus: (
    id: string,
    action: 'start' | 'pause' | 'complete',
    options?: { completionSource?: 'manual' | 'auto_schedule' }
  ) => Promise<void>;
  handlePriorityChange: (id: string, currentPriority?: string) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
  handleRenameTask: (taskId: string, newTitle: string) => Promise<void>;
  handleUpdateDeadline: (taskId: string, newDate: string | Date) => Promise<void>;
  handleSubTaskAction: (
    taskId: string,
    subId: string | null,
    type: 'add' | 'toggle' | 'rename' | 'delete',
    val?: string
  ) => Promise<void>;
  handleAiSubtasks: (taskId: string, title: string) => Promise<void>;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}
const ignoreAsyncError = (): undefined => undefined;
export const useTaskActions = ({
  tasks,
  user,
  userData,
  setTasks,
  triggerSystemFocus,
  awardTaskRewards,
  awardSubTaskRewards,
  playSound
}: TaskActionParams): TaskActionReturn => {
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const toggleTaskStatus = useCallback(
    async (
      id: string,
      action: 'start' | 'pause' | 'complete',
      options?: { completionSource?: 'manual' | 'auto_schedule' }
    ): Promise<void> => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const currentTime = Date.now();
      let updates: Partial<Task> = {};
      let newTotal = task.totalTrackedTime;
      const uid = user ? user.uid : 'local-user-test';
      if (action === 'start') {
        playSound(task.type === 'countdown' ? 'focus-start' : 'click');
        updates = {
          status: 'running',
          lastStartTime: currentTime,
          currentWorker: uid,
          currentWorkerName: user?.displayName || 'Đồng đội',
          lastHeartbeat: currentTime,
          autoPauseReason: undefined
        };
        if (userData.autoFocusShortcut && userData.shortcutName)
          triggerSystemFocus(userData.shortcutName);
      } else if (action === 'pause') {
        if (task.status === 'running') newTotal += currentTime - (task.lastStartTime || 0);
        updates = {
          status: 'paused',
          totalTrackedTime: newTotal,
          lastStartTime: undefined,
          currentWorker: undefined,
          lastHeartbeat: undefined
        };
        if (userData.autoFocusShortcut && userData.offShortcutName)
          triggerSystemFocus(userData.offShortcutName);
      } else if (action === 'complete') {
        playSound('complete');
        if (task.status === 'running') newTotal += currentTime - (task.lastStartTime || 0);
        const isAutoScheduleComplete = options?.completionSource === 'auto_schedule';
        const isLate = isAutoScheduleComplete
          ? false
          : Boolean(task.deadline && currentTime > task.deadline);
        updates = {
          status: isLate ? 'completed_late' : 'completed',
          totalTrackedTime: newTotal,
          lastStartTime: undefined,
          endTime: currentTime,
          currentWorker: undefined,
          lastHeartbeat: undefined
        };
        if (userData.autoFocusShortcut && userData.offShortcutName)
          triggerSystemFocus(userData.offShortcutName);
        if (task.priority === 'high') {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#ec4899']
          });
        }
        await awardTaskRewards(isLate);
      }
      const updatedTasks = tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      setTasks(updatedTasks);
      if (user && user.uid !== 'local-user-test') {
        taskService.updateTask(id, updates).catch((err) => {
          console.error('Optimistic Update failed, reverting...', err);
          setTasks(tasks);
        });
      }
    },
    [
      tasks,
      user,
      userData.autoFocusShortcut,
      userData.shortcutName,
      userData.offShortcutName,
      triggerSystemFocus,
      awardTaskRewards,
      playSound,
      setTasks
    ]
  );
  const handlePriorityChange = useCallback(
    async (id: string, currentPriority?: string): Promise<void> => {
      const priorities = ['low', 'medium', 'high'];
      const normalizedPriority = currentPriority ?? 'low';
      const nextPriority =
        priorities[(priorities.indexOf(normalizedPriority) + 1) % priorities.length];
      if (user && user.uid !== 'local-user-test')
        taskService.updateTask(id, { priority: nextPriority as 'low' | 'medium' | 'high' }).catch(ignoreAsyncError);
      else setTasks(tasks.map((t) => (t.id === id ? { ...t, priority: nextPriority as Task['priority'] } : t)));
    },
    [tasks, user, setTasks]
  );
  const handleDeleteTask = useCallback(
    async (id: string): Promise<void> => {
      playSound('delete');
      if (user && user.uid !== 'local-user-test')
        taskService.deleteTask(id).catch(ignoreAsyncError);
      else setTasks(tasks.filter((t) => t.id !== id));
    },
    [tasks, user, playSound, setTasks]
  );
  const handleRenameTask = useCallback(
    async (taskId: string, newTitle: string): Promise<void> => {
      if (!newTitle.trim()) return;
      if (user && user.uid !== 'local-user-test')
        taskService.updateTask(taskId, { title: newTitle }).catch(ignoreAsyncError);
      else
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t))
        );
    },
    [user, setTasks]
  );
  const handleUpdateDeadline = useCallback(
    async (taskId: string, newDate: string | Date): Promise<void> => {
      if (!newDate) return;
      const d = new Date(newDate);
      if (typeof newDate === 'string' && !newDate.includes('T'))
        d.setHours(23, 0, 0, 0);
      const deadlineTs = d.getTime();
      const task = tasks.find((t) => t.id === taskId);
      const updates: Partial<Task> = { deadline: deadlineTs };
      if (task?.status === 'completed_late' && task.endTime && deadlineTs >= task.endTime) {
        updates.status = 'completed';
      }
      if (user && user.uid !== 'local-user-test')
        taskService.updateTask(taskId, updates).catch(ignoreAsyncError);
      else
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        );
    },
    [tasks, user, setTasks]
  );
  const handleSubTaskAction = useCallback(
    async (
      taskId: string,
      subId: string | null,
      type: 'add' | 'toggle' | 'rename' | 'delete',
      val?: string
    ): Promise<void> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      let newSubTasks: SubTask[] = [...(task.subTasks || [])];
      let isNowDone = false;
      if (type === 'add' && val)
        newSubTasks.push({ id: crypto.randomUUID(), title: val, isDone: false });
      else if (type === 'toggle' && subId) {
        const sub = newSubTasks.find((s) => s.id === subId);
        if (!sub) return;
        isNowDone = !sub.isDone;
        newSubTasks = newSubTasks.map((s) =>
          s.id === subId ? { ...s, isDone: isNowDone } : s
        );
      } else if (type === 'rename' && subId && val)
        newSubTasks = newSubTasks.map((s) =>
          s.id === subId ? { ...s, title: val } : s
        );
      else if (type === 'delete' && subId)
        newSubTasks = newSubTasks.filter((s) => s.id !== subId);
      if (isNowDone) await awardSubTaskRewards();
      if (user && user.uid !== 'local-user-test') {
        taskService.updateSubTasks(taskId, newSubTasks).catch(ignoreAsyncError);
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, subTasks: newSubTasks } : t))
        );
      }
    },
    [tasks, user, awardSubTaskRewards, setTasks]
  );
  const handleAiSubtasks = useCallback(
    async (taskId: string, title: string): Promise<void> => {
      setAiLoading(true);
      try {
        const steps = await aiService.suggestSubTasks(title, {
          model: userData.aiMode
        });
        if (Array.isArray(steps)) {
          for (const step of steps) await handleSubTaskAction(taskId, null, 'add', step);
        }
      } catch (e) {
        console.error('AI subtask error:', e);
        await handleSubTaskAction(
          taskId,
          null,
          'add',
          `🤖 AI gợi ý: Phân tích và lên kế hoạch cụ thể cho: ${title}`
        );
      } finally {
        setAiLoading(false);
      }
    },
    [handleSubTaskAction, userData.aiMode]
  );
  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<Task>): Promise<void> => {
      if (user && user.uid !== 'local-user-test') {
        taskService.updateTask(taskId, updates).catch(ignoreAsyncError);
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        );
      }
    },
    [user, setTasks]
  );
  return {
    aiLoading,
    toggleTaskStatus,
    handlePriorityChange,
    handleDeleteTask,
    handleRenameTask,
    handleUpdateDeadline,
    handleSubTaskAction,
    handleAiSubtasks,
    handleUpdateTask
  };
};
````

## File: src/services/ai.ts
````typescript
import { geminiApiKey } from '../firebase';
const AI_CACHE_TTL_MS = 10 * 60 * 1000;
export interface AiMetrics {
  requests: number;
  cacheHit: number;
  cacheMiss: number;
  dedupedInFlight: number;
  networkCalls: number;
  retries: number;
  timeouts: number;
  failures: number;
  promptCharsSent: number;
  promptCharsSavedByCache: number;
  promptCharsSavedByDedup: number;
  lastUpdatedAt: number | null;
}
const aiResponseCache = new Map<string, { value: string; expiry: number }>();
const inFlightRequests = new Map<string, Promise<string>>();
const aiMetrics: AiMetrics = {
  requests: 0,
  cacheHit: 0,
  cacheMiss: 0,
  dedupedInFlight: 0,
  networkCalls: 0,
  retries: 0,
  timeouts: 0,
  failures: 0,
  promptCharsSent: 0,
  promptCharsSavedByCache: 0,
  promptCharsSavedByDedup: 0,
  lastUpdatedAt: null
};
const touchAiMetrics = () => {
  aiMetrics.lastUpdatedAt = Date.now();
};
const isDev = Boolean(import.meta.env?.DEV);
const debugAiMetrics = (eventName: string) => {
  if (!isDev) return;
  console.debug(`[AI_METRICS] ${eventName}`, {
    requests: aiMetrics.requests,
    networkCalls: aiMetrics.networkCalls,
    cacheHit: aiMetrics.cacheHit,
    cacheMiss: aiMetrics.cacheMiss,
    dedupedInFlight: aiMetrics.dedupedInFlight,
    retries: aiMetrics.retries,
    timeouts: aiMetrics.timeouts
  });
};
const trimText = (text: string, maxChars: number) => {
  if (typeof text !== 'string') return '';
  if (!maxChars || text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n...[truncated]`;
};
const buildCacheKey = (model: string, systemInstruction: string, prompt: string) =>
  JSON.stringify({ model, systemInstruction, prompt });
export const getAiUsageMetrics = (): AiMetrics => ({ ...aiMetrics });
export const resetAiUsageMetrics = () => {
  (Object.keys(aiMetrics) as Array<keyof AiMetrics>).forEach((key) => {
    if (key === 'lastUpdatedAt') {
      aiMetrics[key] = null;
    } else {
      (aiMetrics[key] as number) = 0;
    }
  });
};
export const estimateAiDailySavings = (avgCharsPerRequest = 1800) => {
  const totalSavedChars = aiMetrics.promptCharsSavedByCache + aiMetrics.promptCharsSavedByDedup;
  const avgSavedRequests = totalSavedChars / Math.max(avgCharsPerRequest, 1);
  const estimatedSavedTokens = Math.round(totalSavedChars / 4);
  return {
    totalSavedChars,
    estimatedSavedRequests: Number(avgSavedRequests.toFixed(2)),
    estimatedSavedTokens
  };
};
export interface AiCallOptions {
  model?: string;
  maxPromptChars?: number;
  maxSystemChars?: number;
  useCache?: boolean;
  cacheTtlMs?: number;
  timeoutMs?: number;
}
export const callGemini = async (
  prompt: string,
  systemInstruction = "",
  retryCount = 0,
  options: AiCallOptions = {}
): Promise<string> => {
  const {
    model = options.model || "google/gemma-4-31b-it:free",
    maxPromptChars = 2500,
    maxSystemChars = 800,
    useCache = true,
    cacheTtlMs = AI_CACHE_TTL_MS,
    timeoutMs = 20000
  } = options;
  const boundedPrompt = trimText(prompt, maxPromptChars);
  const boundedSystemInstruction = trimText(
    systemInstruction || "Bạn là trợ lý đắc lực của Tít & Tún.",
    maxSystemChars
  );
  const requestChars = boundedPrompt.length + boundedSystemInstruction.length;
  aiMetrics.requests += 1;
  touchAiMetrics();
  if (!geminiApiKey || geminiApiKey === "" || !geminiApiKey.startsWith('sk-or-')) {
    console.warn("OpenRouter API key is missing or invalid.");
    aiMetrics.failures += 1;
    touchAiMetrics();
    return "Hãy thiết lập mã kết nối API OpenRouter trong .env nhé!";
  }
  const cacheKey = buildCacheKey(model, boundedSystemInstruction, boundedPrompt);
  const now = Date.now();
  if (useCache) {
    const cached = aiResponseCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      aiMetrics.cacheHit += 1;
      aiMetrics.promptCharsSavedByCache += requestChars;
      touchAiMetrics();
      debugAiMetrics('cache_hit');
      return cached.value;
    }
    aiMetrics.cacheMiss += 1;
    touchAiMetrics();
  }
  if (inFlightRequests.has(cacheKey)) {
    aiMetrics.dedupedInFlight += 1;
    aiMetrics.promptCharsSavedByDedup += requestChars;
    touchAiMetrics();
    debugAiMetrics('deduped_inflight');
    return inFlightRequests.get(cacheKey)!;
  }
  const requestPromise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      aiMetrics.networkCalls += 1;
      aiMetrics.promptCharsSent += requestChars;
      touchAiMetrics();
      const response = await fetch("https:
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${geminiApiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "TT Daily Task"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: boundedSystemInstruction },
            { role: "user", content: boundedPrompt }
          ]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const apiError = data?.error?.message || `HTTP ${response.status}`;
        if (retryCount < 3) {
          let nextModel = "google/gemma-4-31b-it:free";
          if (model === "google/gemma-4-31b-it:free") nextModel = "openai/gpt-oss-120b:free";
          if (model === "openai/gpt-oss-120b:free") nextModel = "qwen/qwen3-coder:free";
          console.warn(`AI Model ${model} failed: ${apiError}. Retrying with ${nextModel}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return callGemini(prompt, systemInstruction, retryCount + 1, { ...options, model: nextModel });
        }
        return `Lỗi AI (OpenRouter): ${apiError}`;
      }
      const output = data.choices?.[0]?.message?.content || "Không nhận được phản hồi từ AI.";
      if (useCache) {
        aiResponseCache.set(cacheKey, {
          value: output,
          expiry: Date.now() + cacheTtlMs
        });
      }
      return output;
    } catch (error: any) {
      if (retryCount < 3) {
        aiMetrics.retries += 1;
        touchAiMetrics();
        await new Promise(resolve => setTimeout(resolve, 1500));
        let nextModel = "google/gemma-4-31b-it:free";
        if (model === "google/gemma-4-31b-it:free") nextModel = "openai/gpt-oss-120b:free";
        return callGemini(prompt, systemInstruction, retryCount + 1, { ...options, model: nextModel });
      }
      if (error?.name === 'AbortError') {
        aiMetrics.timeouts += 1;
        aiMetrics.failures += 1;
        touchAiMetrics();
        debugAiMetrics('timeout');
        return "Lỗi AI (OpenRouter): Request timeout.";
      }
      aiMetrics.failures += 1;
      touchAiMetrics();
      return "Lỗi AI (OpenRouter): " + error.message;
    } finally {
      clearTimeout(timeout);
      inFlightRequests.delete(cacheKey);
    }
  })();
  inFlightRequests.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    if (inFlightRequests.get(cacheKey) === requestPromise) {
      inFlightRequests.delete(cacheKey);
    }
  }
};
````

## File: src/services/aiService.ts
````typescript
import { callGemini } from './ai';
import { safeJsonParse, Task, UserData } from '../utils/helpers';
export const generateTaskSummary = async (tasks: Task[], userData: UserData): Promise<string> => {
  const summarizedTasks = tasks.slice(0, 20);
  const dataStr = summarizedTasks.map(t => `- [${t.status === 'completed' ? 'X' : ' '}] ${t.title} (Người làm: ${t.assigneeName || 'Chưa gán'}, Hạn: ${t.deadline ? new Date(t.deadline).toLocaleDateString('vi') : 'Không'})`).join('\n');
  const titTasks = tasks.filter(t => t.assigneeId === 'tit');
  const tunTasks = tasks.filter(t => t.assigneeId === 'tun');
  const titDone = titTasks.filter(t => t.status === 'completed').length;
  const tunDone = tunTasks.filter(t => t.status === 'completed').length;
  let systemPrompt = "Bạn là quản lý dự án dễ thương của cặp đôi Tít & Tún.";
  if (userData.aiMode === 'sassy') {
    systemPrompt = "Bạn là quản lý dự án cực kỳ 'cà khịa', hài hước và hay châm chọc cặp đôi Tít & Tún nhưng vẫn rất yêu quý họ. Hãy viết báo cáo thật mặn mòi.";
  }
  const prompt = `Đây là danh sách công việc của Team Tít & Tún (tối đa 20 việc gần nhất):\n${dataStr}\n\nTổng: ${tasks.length} việc, Xong: ${tasks.filter(t => t.status === 'completed').length}, Đang chạy: ${tasks.filter(t => t.status === 'running').length}\nTít: ${titDone}/${titTasks.length} xong. Tún: ${tunDone}/${tunTasks.length} xong.\n\nHãy viết 1 đoạn văn (4-5 câu) bằng tiếng Việt đánh giá tiến độ. Nếu ở chế độ 'cà khịa', hãy châm chọc sự lười biếng hoặc khen ngợi một cách đầy muối. Gọi tên Tít và Tún trực tiếp.`;
  return await callGemini(prompt, systemPrompt, 0, {
    model: userData.aiMode,
    maxPromptChars: 2200,
    maxSystemChars: 700,
    useCache: true,
    cacheTtlMs: 3 * 60 * 1000
  });
};
export const suggestSubTasks = async (title: string, options: { model?: string } = {}): Promise<string[]> => {
  const prompt = `Bạn là trợ lý lập kế hoạch. Hãy phân tích công việc sau và đề xuất TỐI ĐA 5 bước thực hiện ngắn gọn, rõ ràng, dễ hành động. Trả lời ĐÚNG định dạng JSON array of strings, ví dụ: ["Bước 1", "Bước 2"]. Không giải thích thêm gì.\n\nCông việc: "${title}"`;
  const result = await callGemini(prompt, "", 0, {
    model: options.model,
    maxPromptChars: 1200,
    useCache: true,
    cacheTtlMs: 30 * 60 * 1000
  });
  const parsed = safeJsonParse(result, []);
  if (Array.isArray(parsed)) {
    return parsed.slice(0, 5).filter((item) => typeof item === 'string' && item.trim().length > 0);
  }
  return [];
};
````

## File: src/services/dailyQuestService.ts
````typescript
import { db, appId } from '../firebase';
import { callGemini } from './ai';
import { safeJsonParse, Task } from '../utils/helpers';
import { doc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
const questDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'daily_quests', 'current');
export interface DailyQuest {
  title: string;
  goal: string;
  rewardGold: number;
  deadline: string;
  tone: 'cute' | 'sassy';
  dateKey: string;
  updatedAt: number;
  isCompleted?: boolean;
  completedBy?: string;
  completedByName?: string;
  completedAt?: number;
}
export const subscribeToDailyQuest = (
  callback: (data: DailyQuest | null) => void,
  onError?: (error: any) => void
): Unsubscribe =>
  onSnapshot(
    questDocRef,
    (snapshot) => callback(snapshot.exists() ? snapshot.data() as DailyQuest : null),
    (error) => onError?.(error)
  );
export const ensureDailyQuest = async (tasks: Task[] = [], options: { model?: string } = {}): Promise<DailyQuest> => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const taskSummary = tasks
    .slice(0, 20)
    .map((task) => `- ${task.title} [${task.priority || 'medium'}] (${task.status || 'idle'})`)
    .join('\n');
  const prompt = `Bạn là game master cho app quản lý task của cặp đôi. Tạo 1 nhiệm vụ chung trong ngày.
Trả về JSON object đúng format:
{"title":"...","goal":"...","rewardGold":500,"deadline":"12:00","tone":"cute|sassy"}
Yêu cầu:
- Nhiệm vụ có thể hoàn thành trong ngày.
- Reward từ 200-700.
- Dựa một phần vào dữ liệu task hiện tại nếu có.
Danh sách task:
${taskSummary || 'Không có task nào.'}`;
  const raw = await callGemini(prompt, 'Bạn tạo daily quest ngắn gọn, hành động được.', 0, {
    model: options.model,
    maxPromptChars: 1800,
    maxSystemChars: 500,
    useCache: true,
    cacheTtlMs: 10 * 60 * 1000
  });
  const parsed = safeJsonParse(raw, {
    title: 'Cùng hoàn thành 3 việc trước 12h',
    goal: 'Mỗi người ít nhất 1 task hoàn thành trước buổi trưa',
    rewardGold: 500,
    deadline: '12:00',
    tone: 'cute'
  });
  const payload: DailyQuest = {
    ...parsed,
    dateKey: todayKey,
    updatedAt: Date.now()
  };
  await setDoc(questDocRef, payload, { merge: true });
  return payload;
};
export const completeDailyQuest = async (quest: DailyQuest | null, userId: string, userName: string): Promise<Partial<DailyQuest> | undefined> => {
  if (!quest || quest.isCompleted) return;
  const payload = {
    isCompleted: true,
    completedBy: userId,
    completedByName: userName,
    completedAt: Date.now()
  };
  await setDoc(questDocRef, payload, { merge: true });
  return payload;
};
````

## File: src/shared/Badge.tsx
````typescript
import React, { memo } from 'react';
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}
const Badge = memo(({ children, className = '' }: BadgeProps) => {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
});
export default Badge;
````

## File: src/shared/Button.tsx
````typescript
import React, { memo } from 'react';
import { LucideProps } from 'lucide-react';
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: React.ComponentType<LucideProps>;
  type?: 'button' | 'submit' | 'reset';
}
const Button = memo(({ children, onClick, className = '', variant = 'primary', disabled = false, icon: Icon, type = 'button' }: ButtonProps) => {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/25',
    secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest
        transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        flex items-center gap-2 justify-center
        ${variants[variant]}
        ${className}
      `}
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
});
export default Button;
````

## File: src/shared/Card.tsx
````typescript
import React, { memo } from 'react';
interface CardProps {
  children: React.ReactNode;
  isDark?: boolean;
  className?: string;
  noPadding?: boolean;
}
const Card = memo(({ children, isDark, className = '', noPadding = false }: CardProps) => {
  return (
    <div className={`
      rounded-3xl border transition-all duration-500
      ${isDark
        ? 'bg-slate-900/60 border-slate-800/60 backdrop-blur-xl shadow-2xl shadow-black/20'
        : 'bg-white/80 border-slate-200/60 backdrop-blur-md shadow-xl shadow-slate-200/40'}
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}>
      {children}
    </div>
  );
});
export default Card;
````

## File: src/shared/Modal.tsx
````typescript
import React from 'react';
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}
export default function Modal({ open, onClose, children, isDark = true }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-8 shadow-2xl transition-all border ${isDark ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'}`}>
        {children}
      </div>
    </div>
  );
}
````

## File: src/utils/calendarUtils.ts
````typescript
import { CalendarEvent } from './helpers';
export const HOUR_HEIGHT = 64;
export const DAY_START_HOUR = 5;
export const DAY_END_HOUR = 24;
export const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => i + DAY_START_HOUR);
export interface OwnerStyle {
  gradient: string;
  dot: string;
  label: string;
}
export const OWNER_STYLES: Record<string, OwnerStyle> = {
  tit: { gradient: 'from-indigo-500 to-blue-600', dot: 'bg-indigo-500', label: 'Tít' },
  tun: { gradient: 'from-pink-500 to-rose-600', dot: 'bg-pink-500', label: 'Tún' },
};
export function parseGCalEvent(raw: any, owner: string): CalendarEvent {
  const start = raw.start?.dateTime
    ? new Date(raw.start.dateTime)
    : raw.start?.date ? new Date(raw.start.date + 'T00:00:00') : null;
  const end = raw.end?.dateTime
    ? new Date(raw.end.dateTime)
    : raw.end?.date ? new Date(raw.end.date + 'T23:59:59') : null;
  return {
    id: raw.id,
    title: raw.summary || '(Không tiêu đề)',
    start,
    end,
    isAllDay: !raw.start?.dateTime,
    owner,
    location: raw.location || null,
  };
}
````

## File: src/utils/constants.ts
````typescript
export const XP_PER_TASK = 50;
export const XP_PER_SUBTASK = 10;
export const XP_BASE = 100;
export const DAILY_CHECKIN_XP = 20;
export const GOLD_PER_TASK = 50;
export const GOLD_PER_SUBTASK = 10;
export const DAILY_CHECKIN_GOLD = 50;
export const BOOSTER_DURATIONS = {
  xp: 2 * 60 * 60 * 1000,
  gold: 1 * 60 * 60 * 1000
};
export const ASSIGNEES = {
  'tit': { name: 'Tít', photo: null },
  'tun': { name: 'Tún', photo: null }
} as const;
export interface AvatarConfig {
  avatarVersion: number;
  seed: string;
  hair: string;
  eyes: string;
  mouth: string;
  body: string;
  hairColor: string;
  clothingColor: string;
}
export const DEFAULT_AVATARS: Record<string, AvatarConfig> = {
  'tit': { avatarVersion: 8, seed: 'Tit', hair: 'shortCombover', eyes: 'open', mouth: 'smile', body: 'squared', hairColor: '362c47', clothingColor: '456dff' },
  'tun': { avatarVersion: 8, seed: 'Tun', hair: 'long', eyes: 'happy', mouth: 'bigSmile', body: 'rounded', hairColor: '6c4545', clothingColor: 'f55d81' }
};
export interface Badge {
  id: string;
  icon: string;
  name: string;
  desc: string;
  check: (done: number, streak: number, level: number) => boolean;
}
export const BADGES: Badge[] = [
  { id: 'first', icon: '🌱', name: 'Khởi Động', desc: 'Hoàn thành task đầu tiên', check: (done) => done >= 1 },
  { id: 'five', icon: '⚡', name: 'Siêu Nhân', desc: 'Hoàn thành 5 tasks', check: (done) => done >= 5 },
  { id: 'ten', icon: '🔥', name: 'Nhiệt Huyết', desc: 'Hoàn thành 10 tasks', check: (done) => done >= 10 },
  { id: 'twenty', icon: '💎', name: 'Kim Cương', desc: 'Hoàn thành 20 tasks', check: (done) => done >= 20 },
  { id: 'fifty', icon: '👑', name: 'Huyền Thoại', desc: 'Hoàn thành 50 tasks', check: (done) => done >= 50 },
  { id: 'streak3', icon: '🎯', name: 'Kiên Trì', desc: 'Streak 3 ngày liên tiếp', check: (_, streak) => streak >= 3 },
  { id: 'streak7', icon: '🏆', name: 'Bền Bỉ', desc: 'Streak 7 ngày liên tiếp', check: (_, streak) => streak >= 7 },
  { id: 'level5', icon: '🚀', name: 'Phi Hành Gia', desc: 'Đạt Level 5', check: (_, __, level) => level >= 5 },
  { id: 'level10', icon: '🌟', name: 'Ngôi Sao', desc: 'Đạt Level 10', check: (_, __, level) => level >= 10 },
];
export type ShopItemType = 'ticket' | 'booster' | 'utility' | 'theme';
export interface ShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  desc: string;
  icon: string;
  price: number;
  minLevel: number;
  multiplier?: number;
  boosterType?: 'xp' | 'gold';
}
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'ticket_snack', type: 'ticket', name: '🍔 Vé Ăn Nhẹ', desc: 'Mời một bữa trà sữa "tầm trung".', icon: '🍔', price: 500, minLevel: 1 },
  { id: 'ticket_lunch', type: 'ticket', name: '🍱 Vé Bữa Trưa', desc: 'Một bữa trưa tươm tất do đối phương bao.', icon: '🍱', price: 1500, minLevel: 3 },
  { id: 'ticket_dinner', type: 'ticket', name: '🥂 Vé Bữa Tối', desc: 'Buffet hoặc nhà hàng cao cấp.', icon: '🥂', price: 4000, minLevel: 5 },
  { id: 'ticket_intimacy', type: 'ticket', name: '🔥 Vé "Đổi Gió"', desc: 'Một buổi tối nồng cháy chỉ có hai người.', icon: '🔥', price: 5000, minLevel: 10 },
  { id: 'booster_xp_2x', type: 'booster', name: '🧪 Potion X2 XP', desc: 'X2 XP nhận được trong 2 giờ.', icon: '🧪', price: 1000, minLevel: 2, multiplier: 2, boosterType: 'xp' },
  { id: 'booster_gold_1.5x', type: 'booster', name: '🧲 Nam Châm Vàng', desc: 'X1.5 Gold nhận được trong 1 giờ.', icon: '🧲', price: 800, minLevel: 2, multiplier: 1.5, boosterType: 'gold' },
  { id: 'freeze', type: 'utility', name: 'Streak Freeze', desc: 'Bảo vệ chuỗi làm việc khi lỡ quên.', icon: '❄️', price: 1000, minLevel: 1 },
  { id: 'theme_sakura', type: 'theme', name: '🌸 Theme Sakura', desc: 'Sắc hồng lãng mạn.', icon: '🌸', price: 2000, minLevel: 5 },
  { id: 'theme_cyberpunk', type: 'theme', name: '🏙️ Theme Cyberpunk', desc: 'Tương lai huyền ảo.', icon: '🏙️', price: 2500, minLevel: 6 },
  { id: 'theme_neon_night', type: 'theme', name: '🌃 Theme Neon Night', desc: 'Ánh đèn ban đêm rực rỡ.', icon: '🌃', price: 1500, minLevel: 4 },
];
export interface FashionOption {
  id: string;
  name: string;
  icon?: string;
  value: string;
}
export const FASHION_OPTIONS: Record<string, FashionOption[]> = {
  hair: [
    { id: 'h1', name: 'Combover', icon: '💇‍♂️', value: 'shortCombover' },
    { id: 'h2', name: 'Side Shave', icon: '💈', value: 'sideShave' },
    { id: 'h3', name: 'Tóc Dài', icon: '👩‍🦰', value: 'long' },
    { id: 'h4', name: 'Xoăn Cao', icon: '👨‍🦱', value: 'curlyHighTop' },
    { id: 'h5', name: 'Bob Cut', icon: '👩', value: 'bobCut' },
    { id: 'h6', name: 'Tóc Xoăn', icon: '👨‍🦱', value: 'curly' },
    { id: 'h7', name: 'Tóc Bím', icon: '👧', value: 'pigtails' },
    { id: 'h8', name: 'Búi Xoăn', icon: '👱‍♀️', value: 'curlyBun' },
    { id: 'h9', name: 'Đầu Đinh', icon: '👨‍🦲', value: 'buzzcut' },
    { id: 'h10', name: 'Mái Bằng', icon: '👩', value: 'bobBangs' },
    { id: 'h11', name: 'Trọc', icon: '👨‍🦲', value: 'bald' },
    { id: 'h12', name: 'Hói', icon: '👨‍🦳', value: 'balding' },
    { id: 'h13', name: 'Lưỡi Trai', icon: '🧢', value: 'cap' },
    { id: 'h14', name: 'Búi Cao', icon: '👱‍♀️', value: 'bunUndercut' },
    { id: 'h15', name: 'Fade', icon: '💈', value: 'fade' },
    { id: 'h16', name: 'Nón Len', icon: '🧶', value: 'beanie' },
    { id: 'h17', name: 'Búi Thẳng', icon: '👱‍♀️', value: 'straightBun' },
    { id: 'h18', name: 'Siêu Dài', icon: '👸', value: 'extraLong' },
    { id: 'h19', name: 'Combover Chops', icon: '💇‍♂️', value: 'shortComboverChops' },
    { id: 'h20', name: 'Mohawk', icon: '💇‍♂️', value: 'mohawk' },
  ],
  eyes: [
    { id: 'e1', name: 'Mở Mắt', icon: '👀', value: 'open' },
    { id: 'e2', name: 'Nhắm Mắt', icon: '😑', value: 'sleep' },
    { id: 'e3', name: 'Nháy Mắt', icon: '😉', value: 'wink' },
    { id: 'e4', name: 'Đeo Kính', icon: '👓', value: 'glasses' },
    { id: 'e5', name: 'Hạnh Phúc', icon: '😊', value: 'happy' },
    { id: 'e6', name: 'Kính Mát', icon: '🕶️', value: 'sunglasses' },
  ],
  mouth: [
    { id: 'm1', name: 'Cười Mỉm', icon: '🙂', value: 'smile' },
    { id: 'm2', name: 'Hơi Buồn', icon: '🙁', value: 'frown' },
    { id: 'm3', name: 'Ngạc Nhiên', icon: '😮', value: 'surprise' },
    { id: 'm4', name: 'Ngậm Nướu', icon: '👶', value: 'pacifier' },
    { id: 'm5', name: 'Cười Lớn', icon: '😄', value: 'bigSmile' },
    { id: 'm6', name: 'Nhếch Mép', icon: '😏', value: 'smirk' },
    { id: 'm7', name: 'Đôi Môi', icon: '👄', value: 'lips' },
  ],
  body: [
    { id: 'b1', name: 'Áo Vuông', icon: '👕', value: 'squared' },
    { id: 'b2', name: 'Áo Tròn', icon: '👕', value: 'rounded' },
    { id: 'b3', name: 'Dáng Nhỏ', icon: '👕', value: 'small' },
    { id: 'b4', name: 'Áo Caro', icon: '👕', value: 'checkered' },
  ],
  facialHair: [
    { id: 'f0', name: 'Không Râu', icon: '👨', value: 'none' },
    { id: 'f1', name: 'Râu Quai Nón', icon: '🧔', value: 'beardMustache' },
    { id: 'f2', name: 'Râu Tam Giác', icon: '🧔', value: 'pyramid' },
    { id: 'f3', name: 'Râu Hải Cẩu', icon: '🧔', value: 'walrus' },
    { id: 'f4', name: 'Râu Cằm', icon: '🧔', value: 'goatee' },
    { id: 'f5', name: 'Râu Bóng', icon: '🧔', value: 'shadow' },
    { id: 'f6', name: 'Râu Nhỏ', icon: '🧔', value: 'soulPatch' },
  ],
  hairColor: [
    { id: 'hc1', name: 'Đen Tím', value: '362c47' },
    { id: 'hc2', name: 'Nâu Trầm', value: '6c4545' },
    { id: 'hc3', name: 'Đỏ Hồng', value: 'e15c66' },
    { id: 'hc4', name: 'Hồng Phấn', value: 'e16381' },
    { id: 'hc5', name: 'Cam Đào', value: 'f27d65' },
    { id: 'hc6', name: 'Cam Vàng', value: 'f29c65' },
    { id: 'hc7', name: 'Xám Khói', value: 'dee1f5' },
  ],
  skinColor: [
    { id: 's1', name: 'Trắng Hồng', value: 'eeb4a4' },
    { id: 's2', name: 'Trắng Sáng', value: 'e7a391' },
    { id: 's3', name: 'Tự Nhiên', value: 'e5a07e' },
    { id: 's4', name: 'Hơi Ngăm', value: 'd78774' },
    { id: 's5', name: 'Bánh Mật', value: 'b16a5b' },
    { id: 's6', name: 'Rám Nắng', value: '92594b' },
    { id: 's7', name: 'Đậm Màu', value: '623d36' },
  ],
  clothingColor: [
    { id: 'c1', name: 'Xanh Blue', value: '456dff' },
    { id: 'c2', name: 'Xanh Mint', value: '54d7c7' },
    { id: 'c3', name: 'Tím', value: '7555ca' },
    { id: 'c4', name: 'Xanh Lá', value: '6dbb58' },
    { id: 'c5', name: 'Đỏ', value: 'e24553' },
    { id: 'c6', name: 'Vàng', value: 'f3b63a' },
    { id: 'c7', name: 'Hồng', value: 'f55d81' },
    { id: 'c8', name: 'Trắng', value: 'ffffff' },
  ]
};
export interface AiModel {
  id: string;
  name: string;
  icon: string;
}
export const AI_MODELS: AiModel[] = [
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B (Best)', icon: '🚀' },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B (Pro)', icon: '🧠' },
  { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B (Stable)', icon: '💎' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder (Logic)', icon: '🛠' },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Fast)', icon: '⚡' },
  { id: 'inclusionai/ling-2.6-1t:free', name: 'Ling-2.6 1T (Huge)', icon: '🌐' },
  { id: 'tencent/hy3-preview:free', name: 'Hy3 Preview (MoE)', icon: '☁️' },
];
export const HEARTBEAT_INTERVAL = 90_000;
export const HEARTBEAT_TIMEOUT = 300_000;
````

## File: src/utils/musicStore.ts
````typescript
const DB_NAME = 'TTMusicDB';
const STORE_NAME = 'tracks';
const METADATA_STORE = 'custom_metadata';
const DB_VERSION = 2;
export interface MusicTrack {
  id: string;
  blob: Blob;
  name: string;
}
export interface CustomMetadata {
  id: string;
  title: string;
  url?: string;
  source: 'youtube' | 'local' | 'stream';
  [key: string]: any;
}
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
export const musicStore = {
  async saveTrack(track: MusicTrack): Promise<IDBValidKey> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(track);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async getAllTracks(): Promise<MusicTrack[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async deleteTrack(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.objectStore(METADATA_STORE).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  async getTrack(id: string): Promise<MusicTrack | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async saveMetadata(metadata: CustomMetadata): Promise<IDBValidKey> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(METADATA_STORE, 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.put(metadata);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async getAllMetadata(): Promise<CustomMetadata[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(METADATA_STORE, 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};
````

## File: src/App.css
````css
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;
  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}
.hero {
  position: relative;
  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }
  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }
  .framework,
  .vite {
    position: absolute;
  }
  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }
  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}
#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;
  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}
#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;
  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }
  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }
  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}
#docs {
  border-right: 1px solid var(--border);
  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;
  .logo {
    height: 18px;
  }
  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;
    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }
  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;
    li {
      flex: 1 1 calc(50% - 8px);
    }
    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}
#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}
.ticks {
  position: relative;
  width: 100%;
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }
  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}
````

## File: src/App.tsx
````typescript
import React from 'react';
import { getAssigneeIdByEmail } from './utils/helpers';
import { useTTApp } from './hooks/useTTApp';
import LoginScreen from './components/auth/LoginScreen';
import SplashScreen from './components/auth/SplashScreen';
import AppHeader from './components/layout/AppHeader';
import AppMainContent from './components/layout/AppMainContent';
import AppOverlays from './components/layout/AppOverlays';
import { AppProviders } from './components/layout/AppProviders';
export default function App(): React.ReactElement {
  const app = useTTApp();
  if (app.isLoading) return <SplashScreen />;
  if (app.authError && !app.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl max-w-sm">
          <h3 className="text-red-500 font-black mb-2">AUTH ERROR</h3>
          <p className="text-red-400 text-xs font-bold leading-relaxed">{app.authError}</p>
        </div>
      </div>
    );
  }
  if (!app.user) return <LoginScreen authError={app.authError} />;
  if (!app.userData.isLoaded) return <SplashScreen />;
  return (
    <AppProviders taskActions={app.taskActions}>
      <div className={`min-h-screen transition-all duration-700 font-outfit mesh-bg ${app.userData.isDarkMode ? 'dark text-slate-100' : 'text-slate-900'} pb-24`}>
        <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-16">
          <AppHeader
            user={app.user}
            userData={app.userData}
            teamMembers={app.teamMembers}
            activeTab={app.activeTab}
            filterMode={app.filterMode}
            onFilterModeChange={app.handleFilterModeChange}
            onTabChange={app.handleTabChange}
            onOpenCloset={() => app.setIsClosetOpen(true)}
            onToggleDarkMode={app.handleToggleDarkMode}
            playSound={app.playSound}
          />
          <AppMainContent
            activeTab={app.activeTab}
            user={app.user}
            userData={app.userData}
            teamMembers={app.teamMembers}
            tasks={app.tasks}
            filteredTasks={app.filteredTasks}
            aiLoading={app.taskActions.aiLoading}
            currentAssigneeId={getAssigneeIdByEmail(app.user?.email, app.teamMembers)}
            calendarApiKey={app.config.calendarApiKey}
            calendarIdTit={app.config.calendarIdTit}
            calendarIdTun={app.config.calendarIdTun}
            appsScriptUrl={app.config.appsScriptUrl}
            handleUpdateSettings={app.handleUpdateSettings}
            levelInfo={app.levelInfo}
            handleBuyItem={app.handleBuyItem}
            handleUseTicket={app.handleUseTicket}
            handleSummarize={app.aiActions.handleSummarize}
            isSummarizing={app.aiActions.isSummarizing}
            aiReport={app.aiActions.aiReport}
            triggerSystemFocus={app.triggerSystemFocus}
            handleTabChange={app.handleTabChange}
            dailyQuest={app.dailyQuest}
            handleRefreshDailyQuest={app.handleRefreshDailyQuest}
            onCompleteDailyQuest={app.handleCompleteDailyQuest}
            handleRenameMascot={app.handleRenameMascot}
            handleChangeMascotAvatar={app.handleChangeMascotAvatar}
            partnerTask={app.partnerTask}
            myRunningTask={app.myRunningTask}
            now={app.now}
            toggleTaskStatus={app.taskActions.toggleTaskStatus}
            handleDeleteTask={app.taskActions.handleDeleteTask}
          />
          <AppOverlays
            isClosetOpen={app.isClosetOpen}
            setIsClosetOpen={app.setIsClosetOpen}
            theme={app.theme}
            userData={app.userData}
            levelInfo={app.levelInfo}
            userEmail={app.user?.email || undefined}
            handleEquipItem={app.handleEquipItem}
            focusingTaskId={app.focusingTaskId || undefined}
            tasks={app.tasks}
            toggleTaskStatus={app.taskActions.toggleTaskStatus}
            onSubTaskToggle={app.taskActions.handleSubTaskAction}
            onSubTaskAdd={app.taskActions.handleSubTaskAction}
            onUpdateTask={app.taskActions.handleUpdateTask}
            triggerSystemFocus={app.triggerSystemFocus}
            partnerTask={app.partnerTask}
            partnerInfo={app.partnerInfo || undefined}
            now={app.now}
          />
        </div>
      </div>
    </AppProviders>
  );
}
````

## File: src/firebase.ts
````typescript
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:123456789"
};
export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const appId: string = import.meta.env.VITE_APP_ID || 'tt-daily-task';
export const geminiApiKey: string = import.meta.env.VITE_GEMINI_API_KEY || "";
export const isDummyConfig: boolean = firebaseConfig.apiKey === "dummy-key";
export const googleCalendarApiKey: string = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY || "";
export const calendarIdTit: string = import.meta.env.VITE_CALENDAR_ID_TIT || "";
export const calendarIdTun: string = import.meta.env.VITE_CALENDAR_ID_TUN || "";
// Google Apps Script Calendar Proxy (preferred over direct API)
export const appsScriptUrl: string = import.meta.env.VITE_APPS_SCRIPT_URL || "";
````

## File: src/main.tsx
````typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
const rootElement = document.getElementById('root') as HTMLElement;
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
````

## File: src/vite-env.d.ts
````typescript
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_APP_ID: string
  readonly VITE_GOOGLE_CALENDAR_API_KEY: string
  readonly VITE_CALENDAR_ID_TIT: string
  readonly VITE_CALENDAR_ID_TUN: string
  readonly VITE_APPS_SCRIPT_URL: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
````

## File: .env.example
````
# TT Daily Task Environment Configuration

# 1. Firebase Configuration
# Replace the values below with the actual config from your Firebase Project Console.
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=1:your-sender-id:web:your-app-id

# 2. App Identifier
# Used for isolating documents in Firestore if you share a database.
VITE_APP_ID=tt-daily-task-ultimate

# 3. Gemini API Key
# Used for AI features (Subtasks generation, Motivation quotes).
# Get one at https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your-gemini-api-key

# 4. Optional: Initial Auth Token
# Only if you need a specific custom token for testing login.
# VITE_INITIAL_AUTH_TOKEN=your-custom-token

# 5. Google Calendar Integration
# Hiển thị lịch trình Google Calendar của Tít & Tún trên app.
# Bước 1: Vào Google Cloud Console > APIs & Services > Credentials > Tạo API Key
# Bước 2: Bật Google Calendar API trong Library
# Bước 3: Mỗi người vào calendar.google.com > Settings > Calendar > "Make available to public"
# Bước 4: Lấy Calendar ID (thường là email) điền vào đây
VITE_GOOGLE_CALENDAR_API_KEY=your-google-calendar-api-key
VITE_CALENDAR_ID_TIT=dinhthai.ctv@gmail.com
VITE_CALENDAR_ID_TUN=transontruc.03@gmail.com
````

## File: eslint.config.js
````javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
export default defineConfig([
  globalIgnores(['dist', 'chrome-extension', 'public/widget.js']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
````

## File: firebase.json
````json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
````

## File: index.html
````html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>tt-daily-task</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
````

## File: postcss.config.js
````javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
````

## File: repomix.config.json
````json
{
  "output": {
    "filePath": "repomix-output.md",
    "style": "markdown",
    "removeComments": true,
    "removeEmptyLines": true,
    "topFilesLength": 5
  },
  "ignore": {
    "customPatterns": [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".git/**",
      "package-lock.json",
      "yarn.lock",
      "public/**",
      "*.log",
      "*.zip",
      "backup_cleanup/**",
      "account.json",
      "lint_output.txt",
      "*.svg",
      "*.png",
      "*.jpg",
      "*.jpeg",
      "*.gif",
      "*.webp",
      "repomix-output.md",
      "src/assets/**"
    ],
    "useGitignore": true,
    "useDefaultPatterns": true
  },
  "security": {
    "enableChecking": true
  }
}
````

## File: SECURITY.md
````markdown
# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 5.1.x   | :white_check_mark: |
| 5.0.x   | :x:                |
| 4.0.x   | :white_check_mark: |
| < 4.0   | :x:                |

## Reporting a Vulnerability

Use this section to tell people how to report a vulnerability.

Tell them where to go, how often they can expect to get an update on a
reported vulnerability, what to expect if the vulnerability is accepted or
declined, etc.
````

## File: tailwind.config.js
````javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
````

## File: tsconfig.node.json
````json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["vite.config.js", "vite.config.ts"]
}
````

## File: vite.config.js
````javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor';
          }
        }
      }
    }
  }
})
````

## File: docs/GUIDELINES.md
````markdown
# TT Daily Task - Project Guidelines & Guardrails

Tài liệu quy chuẩn cố định để phát triển theo mode feature-first.

## 1. Tech & TypeScript
- `src/` đã 100% TypeScript (`strict: true`). Không tạo file `.jsx/.js` mới trong `src/`.
- Chrome Extension và Scriptable widget giữ plain JS (platform requirement — không đổi).
- Khi thêm feature mới, file phải là `.ts/.tsx`.

## 2. React 19 Guardrails (Critical)
- Không `setState` đồng bộ trong `useEffect`; dùng `requestAnimationFrame(() => set...)` khi cần.
- Không mutate trực tiếp object từ ref/hook (ví dụ audio ref); dùng `Object.assign` hoặc clone.
- Giữ `globalAudio` singleton ngoài component để tránh re-init.

## 3. Architecture Rules
- Business logic nằm trong `src/hooks/`.
- API/Firestore/AI integration nằm trong `src/services/`.
- Component tập trung render/orchestration, tránh nhồi business logic.
- Tránh tạo duplicate file `.js/.ts` cùng tên module.

## 4. Type Rules (Short)
- Reuse type hiện có, tránh khai báo lại local nếu không cần.
- Task shape phải align với Context/Service đang dùng.
- Chỉ dùng `any` tạm thời để unblock build, thay lại ở task kế tiếp.

## 5. Quality Gates
- Bắt buộc `npm run build` pass.
- Bắt buộc `npm run lint` pass (0 lỗi).
- Xóa unused imports/variables trước khi kết thúc task.

## 6. One-line AI Prompt
`Đọc docs/prompt.md và làm theo đó.`

## 7. Documentation Freshness Rule
- Mọi commit có thay đổi code phải cập nhật file `.md` liên quan trong cùng commit.
- Cập nhật `docs/architecture.md` khi đổi contract giữa module/context/hook hoặc data shape.
- Cập nhật `docs/runbook.md` khi thay đổi quy trình build/typecheck/lint hoặc flow debug.
- Không đóng task nếu docs chưa phản ánh đúng trạng thái code hiện tại.
````

## File: scripts/migrate-assignee-admin.mjs
````javascript
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

loadDotEnv(ENV_PATH);

const isApply = process.argv.includes('--apply');
const mode = isApply ? 'APPLY' : 'DRY_RUN';
const appIdArg = getArgValue('--app-id');
const appId = appIdArg || process.env.VITE_APP_ID || 'default-app-id';
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

const keyPathArg = getArgValue('--service-account');
const keyPathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const keyPath = keyPathArg || keyPathEnv;

const teamPathArg = getArgValue('--team-path');
const tasksPathArg = getArgValue('--tasks-path');
const titUidArg = getArgValue('--tit-uid');
const tunUidArg = getArgValue('--tun-uid');

if (!keyPath) {
  console.error('Missing service account path. Use --service-account <path> or FIREBASE_SERVICE_ACCOUNT_PATH in .env');
  process.exit(1);
}

const resolvedKeyPath = path.isAbsolute(keyPath) ? keyPath : path.join(ROOT, keyPath);
if (!fs.existsSync(resolvedKeyPath)) {
  console.error(`Service account file not found: ${resolvedKeyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(resolvedKeyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: projectId || serviceAccount.project_id
});

const db = admin.firestore();

const legacyEmailMap = {
  tit: 'dinhthai.ctv@gmail.com',
  tun: 'transontruc.03@gmail.com'
};

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

async function loadFirstNonEmptyCollection(paths) {
  const tried = [];
  for (const p of paths) {
    const snap = await db.collection(p).get();
    tried.push(`${p} (${snap.size})`);
    if (!snap.empty) return { path: p, snap, tried };
  }
  return { path: paths[0], snap: await db.collection(paths[0]).get(), tried };
}

async function main() {
  const teamPaths = teamPathArg
    ? [teamPathArg]
    : [
        `artifacts/${appId}/public/data/teamMembers`,
        `artifacts/${appId}/teamMembers`,
        'users'
      ];

  const tasksPaths = tasksPathArg
    ? [tasksPathArg]
    : [
        `artifacts/${appId}/public/data/tasks`,
        `artifacts/${appId}/tasks`
      ];

  const teamLoad = await loadFirstNonEmptyCollection(teamPaths);
  const teamPathUsed = teamLoad.path;
  const teamSnap = teamLoad.snap;

  const tasksLoad = await loadFirstNonEmptyCollection(tasksPaths);
  const tasksPathUsed = tasksLoad.path;
  const tasksSnap = tasksLoad.snap;

  const emailToUid = new Map();
  const uidSet = new Set();
  const explicitUidMap = new Map();

  teamSnap.forEach((d) => {
    const data = d.data() || {};
    const uid = typeof data.uid === 'string' && data.uid.trim() ? data.uid.trim() : d.id;
    const email = normalizeEmail(data.email);
    if (uid) uidSet.add(uid);
    if (uid && email) emailToUid.set(email, uid);
  });

  if (titUidArg) explicitUidMap.set('tit', titUidArg.trim());
  if (tunUidArg) explicitUidMap.set('tun', tunUidArg.trim());

  const updates = [];
  let scanned = 0;
  let alreadyUid = 0;
  let skippedUnknown = 0;
  let invalidAssignee = 0;

  tasksSnap.forEach((taskDoc) => {
    scanned += 1;
    const data = taskDoc.data() || {};
    const assigneeId = typeof data.assigneeId === 'string' ? data.assigneeId.trim() : '';

    if (!assigneeId) {
      invalidAssignee += 1;
      return;
    }

    if (uidSet.has(assigneeId)) {
      alreadyUid += 1;
      return;
    }

    const key = assigneeId.toLowerCase();
    if (key !== 'tit' && key !== 'tun') {
      skippedUnknown += 1;
      return;
    }

    const mappedUid = explicitUidMap.get(key) || emailToUid.get(legacyEmailMap[key]);
    if (!mappedUid) {
      skippedUnknown += 1;
      return;
    }

    updates.push({ id: taskDoc.id, from: assigneeId, to: mappedUid });
  });

  console.log('Assignee migration summary');
  console.log(`- Mode: ${mode}`);
  console.log(`- Project: ${projectId || serviceAccount.project_id}`);
  console.log(`- appId: ${appId}`);
  console.log(`- Team path used: ${teamPathUsed}`);
  console.log(`- Team paths tried: ${teamLoad.tried.join(' | ')}`);
  console.log(`- Tasks path used: ${tasksPathUsed}`);
  console.log(`- Tasks paths tried: ${tasksLoad.tried.join(' | ')}`);
  console.log(`- Team members loaded: ${uidSet.size}`);
  console.log(`- Team members with email: ${emailToUid.size}`);
  console.log(`- Explicit tit UID: ${titUidArg ? titUidArg : '(none)'}`);
  console.log(`- Explicit tun UID: ${tunUidArg ? tunUidArg : '(none)'}`);
  console.log(`- Tasks scanned: ${scanned}`);
  console.log(`- Already UID: ${alreadyUid}`);
  console.log(`- Candidate migrated: ${updates.length}`);
  console.log(`- Skipped unknown assignee: ${skippedUnknown}`);
  console.log(`- Empty/invalid assigneeId: ${invalidAssignee}`);

  if (updates.length > 0) {
    console.log('\nPreview updates (max 30)');
    updates.slice(0, 30).forEach((u) => console.log(`- ${u.id}: ${u.from} -> ${u.to}`));
  }

  if (!isApply || updates.length === 0) {
    console.log('\nNo write executed.');
    return;
  }

  const tasksRef = db.collection(tasksPathUsed);
  const chunkSize = 400;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const batch = db.batch();
    for (const u of chunk) {
      batch.update(tasksRef.doc(u.id), { assigneeId: u.to });
    }
    await batch.commit();
    console.log(`Committed ${Math.min(i + chunkSize, updates.length)}/${updates.length}`);
  }

  console.log('\nMigration completed successfully.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
````

## File: src/components/layout/AppOverlays.tsx
````typescript
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import FocusView from '../focus/FocusView';
import ClosetView from '../shop/ClosetView.jsx';
import DuoFocusBanner from '../focus/DuoFocusBanner';
import Modal from '../../shared/Modal.jsx';
import type { Task, UserData, LevelInfo, TeamMember, AvatarConfig } from '../../utils/helpers';
type PartnerInfo = TeamMember | { displayName: string; email: string; avatarConfig?: AvatarConfig | null };
interface FocusViewProps {
  task?: Task;
  now: number;
  userData: UserData;
  triggerSystemFocus: (shortcutName: string) => void;
  partnerTask?: Task;
  partnerInfo?: PartnerInfo;
}
const FocusViewTyped = FocusView as React.ComponentType<FocusViewProps>;
interface AppOverlaysProps {
  isClosetOpen: boolean;
  setIsClosetOpen: (value: boolean) => void;
  theme: 'dark' | 'light';
  userData: UserData;
  levelInfo: LevelInfo;
  userEmail?: string;
  handleEquipItem: (category: string, val: any) => void;
  focusingTaskId?: string | null;
  tasks: Task[];
  now: number;
  toggleTaskStatus: (id: string, action: 'start' | 'pause' | 'complete') => Promise<void>;
  onSubTaskToggle: (
    taskId: string,
    subId: string,
    type: 'toggle' | 'rename' | 'delete' | 'add',
    val?: string
  ) => Promise<void>;
  onSubTaskAdd: (
    taskId: string,
    subId: string | null,
    type: 'add',
    val: string
  ) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  triggerSystemFocus: (shortcutName: string) => void;
  partnerTask?: Task;
  partnerInfo?: PartnerInfo;
}
function AppOverlays({
  isClosetOpen,
  setIsClosetOpen,
  theme,
  userData,
  levelInfo,
  userEmail,
  handleEquipItem,
  focusingTaskId,
  tasks,
  now,
  toggleTaskStatus,
  onSubTaskToggle,
  onSubTaskAdd,
  onUpdateTask,
  triggerSystemFocus,
  partnerTask,
  partnerInfo
}: AppOverlaysProps): React.ReactElement {
  return (
    <>
      <Modal open={isClosetOpen} onClose={() => setIsClosetOpen(false)} isDark={theme === 'dark'}>
        <ClosetView
          userData={userData}
          levelInfo={levelInfo}
          isDark={theme === 'dark'}
          userEmail={userEmail ?? ''}
          onEquipItem={handleEquipItem}
          onClose={() => setIsClosetOpen(false)}
        />
      </Modal>
      {focusingTaskId && (
        <FocusViewTyped
          task={tasks.find((t) => t.id === focusingTaskId)}
          now={now}
          userData={userData}
          triggerSystemFocus={triggerSystemFocus}
          partnerTask={partnerTask}
          partnerInfo={partnerInfo}
        />
      )}
      <AnimatePresence>
        {partnerTask && partnerInfo && !focusingTaskId && (
          <DuoFocusBanner
            task={partnerTask}
            partnerInfo={partnerInfo}
            now={now}
            isDark={userData.isDarkMode}
          />
        )}
      </AnimatePresence>
    </>
  );
}
export default React.memo(AppOverlays);
````

## File: src/components/layout/Dashboard.tsx
````typescript
import React, { Suspense } from 'react';
import { Gift, Clock } from 'lucide-react';
import { SHOP_ITEMS } from '../../utils/constants';
import type { UserData, Task, TeamMember, LevelInfo } from '../../utils/helpers';
const StatsView = React.lazy(() => import('../stats/StatsView'));
const ShopView = React.lazy(() => import('../shop/ShopView.jsx'));
interface StatsViewProps {
  tasks: Task[];
  isDark: boolean;
  teamMembers: TeamMember[];
  userData: UserData;
  levelInfo: LevelInfo;
  onSummarize: () => void;
  isSummarizing: boolean;
  aiReport: AIReport;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  triggerSystemFocus: (shortcutName: string) => void;
  onTabChange: (tab: string) => void;
  dailyQuest: DailyQuest;
  onRefreshDailyQuest: () => void;
  onCompleteDailyQuest: () => void;
  currentTab: string;
  onRenameMascot: () => void;
  onChangeMascotAvatar: () => void;
  partnerTask?: Task;
  myRunningTask?: Task;
  now: number;
}
interface ShopViewProps {
  userData: UserData;
  levelInfo: LevelInfo;
  isDark: boolean;
  onBuyItem: (itemId: string) => void;
}
const StatsViewTyped = StatsView as React.ComponentType<StatsViewProps>;
const ShopViewTyped = ShopView as React.ComponentType<ShopViewProps>;
type DailyQuest = Record<string, any> | null;
type AIReport = string;
interface TicketLog {
  id: string;
  name: string;
  usedAt: number;
  user: string;
}
interface DashboardProps {
  view: string;
  tasks: Task[];
  isDark: boolean;
  teamMembers: TeamMember[];
  userData: UserData;
  levelInfo: LevelInfo;
  onBuyItem: (itemId: string) => void;
  onUseTicket: (ticketId: string) => void;
  isSummarizing: boolean;
  aiReport: AIReport;
  onSummarize: () => void;
  onUpdateSettings: (updates: Partial<UserData>) => void;
  triggerSystemFocus: (shortcutName: string) => void;
  onTabChange: (tab: string) => void;
  dailyQuest: DailyQuest;
  onRefreshDailyQuest: () => void;
  onCompleteDailyQuest: () => void;
  currentTab: string;
  onRenameMascot: () => void;
  onChangeMascotAvatar: () => void;
  partnerTask?: Task;
  myRunningTask?: Task;
  now: number;
}
const ViewLoading = (): React.ReactElement => (
  <div className="p-12 text-center">
    <div className="inline-block w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Đang tải dữ liệu...</p>
  </div>
);
interface StatHistoryProps {
  isDark: boolean;
  userData: UserData;
  onUseTicket: (ticketId: string) => void;
}
const StatHistory = ({ isDark, userData, onUseTicket }: StatHistoryProps): React.ReactElement => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
    <div className={`p-6 rounded-3xl ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
      <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Gift size={16} className="text-fuchsia-500" /> Kho Vé Của Mình
      </h4>
      <div className="space-y-3">
        {(userData.ownedItemIds || []).filter(
          (id) => SHOP_ITEMS.find((i) => i.id === id)?.type === 'ticket' || SHOP_ITEMS.find((i) => i.id === id)?.type === 'utility'
        ).length > 0 ? (
          (userData.ownedItemIds || [])
            .filter(
              (id) => SHOP_ITEMS.find((i) => i.id === id)?.type === 'ticket' || SHOP_ITEMS.find((i) => i.id === id)?.type === 'utility'
            )
            .map((ownedId, idx) => {
              const item = SHOP_ITEMS.find((i) => i.id === ownedId);
              return (
                <div
                  key={`${ownedId}-${idx}`}
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item?.icon}</span>
                    <span className="text-xs font-black">{item?.name}</span>
                  </div>
                  <button
                    onClick={() => onUseTicket(ownedId)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    SỬ DỤNG
                  </button>
                </div>
              );
            })
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-700/20 rounded-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chưa có vé nào</p>
          </div>
        )}
      </div>
    </div>
    <div className={`p-6 rounded-3xl ${isDark ? 'glass-dark' : 'glass-light shadow-lg'}`}>
      <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Clock size={16} className="text-blue-500" /> Lịch sử giao kèo
      </h4>
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {(userData.ticketHistory || []).length > 0 ? (
          [...(userData.ticketHistory || [])].reverse().map((log: TicketLog) => (
            <div
              key={log.id}
              className={`p-3 rounded-xl border-l-4 ${
                isDark
                  ? 'bg-slate-800/20 border-blue-500/50 text-slate-300'
                  : 'bg-blue-50 border-blue-500/50 text-slate-600'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[11px] font-black">{log.name}</span>
                <span className="text-[8px] font-bold opacity-60 uppercase">
                  {new Date(log.usedAt).toLocaleDateString('vi')}
                </span>
              </div>
              <p className="text-[9px] font-bold">
                Người dùng: <span className="text-blue-500">{log.user}</span>
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Trống
          </div>
        )}
      </div>
    </div>
  </div>
);
export default function Dashboard({
  view,
  tasks,
  isDark,
  teamMembers,
  userData,
  levelInfo,
  onBuyItem,
  onUseTicket,
  isSummarizing,
  aiReport,
  onSummarize,
  onUpdateSettings,
  triggerSystemFocus,
  onTabChange,
  dailyQuest,
  onRefreshDailyQuest,
  currentTab,
  onRenameMascot,
  onChangeMascotAvatar,
  partnerTask,
  myRunningTask,
  now,
  onCompleteDailyQuest
}: DashboardProps): React.ReactElement | null {
  if (view === 'stats') {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4">
        <Suspense fallback={<ViewLoading />}>
          <StatsViewTyped
            tasks={tasks}
            isDark={isDark}
            teamMembers={teamMembers}
            userData={userData}
            levelInfo={levelInfo}
            onSummarize={onSummarize}
            isSummarizing={isSummarizing}
            aiReport={aiReport}
            onUpdateSettings={onUpdateSettings}
            triggerSystemFocus={triggerSystemFocus}
            onTabChange={onTabChange}
            dailyQuest={dailyQuest}
            onRefreshDailyQuest={onRefreshDailyQuest}
            onCompleteDailyQuest={onCompleteDailyQuest}
            currentTab={currentTab}
            onRenameMascot={onRenameMascot}
            onChangeMascotAvatar={onChangeMascotAvatar}
            partnerTask={partnerTask}
            myRunningTask={myRunningTask}
            now={now}
          />
        </Suspense>
        <StatHistory isDark={isDark} userData={userData} onUseTicket={onUseTicket} />
      </div>
    );
  }
  if (view === 'shop') {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-4">
        <Suspense fallback={<ViewLoading />}>
          <ShopViewTyped
            userData={userData}
            levelInfo={levelInfo}
            isDark={isDark}
            onBuyItem={(itemId: string) => onBuyItem(itemId)}
          />
        </Suspense>
        <StatHistory isDark={isDark} userData={userData} onUseTicket={onUseTicket} />
      </div>
    );
  }
  return null;
}
````

## File: src/components/layout/MixerSidebar.tsx
````typescript
import React from 'react';
import { X, Play, Plus, Trash2 } from 'lucide-react';
import type { MusicTrackData } from '../../hooks/useFocusMusic';
interface Track extends MusicTrackData {}
interface MixerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: MusicTrackData[];
  currentTrackIdx: number;
  onSelectTrack: (idx: number) => void;
  onFileUpload: (file: File, selectedMood?: string) => Promise<void>;
  onDeleteTrack: (track: MusicTrackData) => Promise<void>;
  onAddViaUrl: (url: string) => void;
  uploadProgress?: number;
}
export default function MixerSidebar({
  isOpen,
  onClose,
  tracks,
  currentTrackIdx,
  onSelectTrack,
  onFileUpload,
  onDeleteTrack,
  onAddViaUrl,
  uploadProgress = 0
}: MixerSidebarProps): React.ReactElement {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = React.useState<string>('');
  const [showUrlForm, setShowUrlForm] = React.useState<boolean>(false);
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[120] transition-opacity duration-500
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Sidebar Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-[340px] z-[130] bg-slate-900/40 backdrop-blur-3xl border-l border-white/10
          transition-transform duration-500 ease-out p-6 flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all"
          >
            <X size={20} />
          </button>
          <span className="text-white/80 font-black text-sm uppercase tracking-widest">Sound Mixer</span>
          <div className="w-10" />
        </div>
        {/* Local Library Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Shared Library</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUrlForm(!showUrlForm)}
              className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors
                  ${showUrlForm ? 'text-indigo-400' : 'text-white/40 hover:text-white'}`}
            >
              <Plus size={12} />
              Link
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-1"
            >
              <Plus size={12} />
              File
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="audio/mp3,audio/mpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileUpload(file);
                e.target.value = ''; // Reset for same file re-upload
              }
            }}
          />
        </div>
        {showUrlForm && (
          <div className="mb-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Dán link Drive/Dropbox vào đây..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500 transition-all"
            />
            <button
              onClick={() => {
                if (urlInput.trim()) {
                  onAddViaUrl(urlInput.trim());
                  setUrlInput('');
                  setShowUrlForm(false);
                }
              }}
              className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all"
            >
              Thêm vào thư viện
            </button>
          </div>
        )}
        {uploadProgress > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 animate-pulse">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Đang tải lên Cloud...</span>
              <span className="text-[10px] font-black text-indigo-400">{uploadProgress}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        <p className="text-[9px] text-white/20 font-bold italic">
          Nhạc tải lên sẽ được đồng bộ cho cả Tít và Tún dùng chung.
        </p>
        {/* Header for list */}
        <div className="flex-1 flex flex-col min-h-0 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Up Next</h3>
            <span className="text-[10px] font-bold text-white/30">{tracks.length} tracks</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {tracks.map((track, idx) => {
              const isActive = idx === currentTrackIdx;
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(idx)}
                  className={`w-full p-3 rounded-2xl border transition-all flex items-center gap-3 group
                    ${
                      isActive
                        ? 'bg-white/15 border-white/20'
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                    }`}
                >
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                    {isActive && (
                      <div className="absolute inset-0 bg-indigo-500/60 flex items-center justify-center">
                        <Play size={16} className="text-white animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-black truncate ${
                          isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                    </div>
                    <p className="text-[10px] font-bold text-white/40 truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {track.isCustom && (
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (confirm(`Bạn có chắc muốn xóa bài "${track.title}"?`)) {
                            onDeleteTrack(track);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {!isActive && (
                      <div className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={12} className="text-white fill-current" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        {}
        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold text-white/20 italic">Thư viện nhạc dùng chung cho cả Tít và Tún.</p>
        </div>
      </div>
    </>
  );
}
````

## File: src/components/layout/MusicSidebar.tsx
````typescript
import React from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, MoreHorizontal, Music2 } from 'lucide-react';
import { formatDuration } from '../../utils/helpers';
import type { MusicTrackData } from '../../hooks/useFocusMusic';
interface MusicTrack {
  cover?: string;
  title?: string;
  artist?: string;
}
interface MusicSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack?: MusicTrackData | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onToggleMute: () => void;
  isCaching?: boolean;
}
export default function MusicSidebar({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  currentTime,
  duration,
  onSeek,
  volume,
  onToggleMute,
  isCaching
}: MusicSidebarProps): React.ReactElement {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <>
      {}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[120] transition-opacity duration-500
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {}
      <div
        className={`fixed inset-y-0 left-0 w-full max-w-[340px] z-[130] bg-slate-900/40 backdrop-blur-3xl border-r border-white/10
          transition-transform duration-500 ease-out p-6 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-white/80 font-black text-sm uppercase tracking-widest">Now Playing</span>
            {isCaching && <span className="text-[9px] text-indigo-400 font-bold animate-pulse">Caching...</span>}
          </div>
          <button className="p-2 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all">
            <MoreHorizontal size={20} />
          </button>
        </div>
        {}
        <div className="relative flex-1 flex flex-col items-center justify-center">
          <div className="relative group">
            <div
              className={`w-56 h-56 rounded-full border-8 border-white/5 overflow-hidden shadow-2xl transition-transform duration-1000
              ${isPlaying ? 'rotate-animation' : ''}`}
            >
              <img
                src={
                  currentTrack?.cover ||
                  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop'
                }
                alt={currentTrack?.title}
                className="w-full h-full object-cover"
              />
            </div>
            {}
            <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
          </div>
          {}
          <div className="text-center mt-10 space-y-2 px-4">
            <h2 className="text-white text-xl font-black tracking-tight leading-tight line-clamp-3 uppercase">
              {currentTrack?.title || 'Unknown'}
            </h2>
            <p className="text-white/50 text-sm font-bold uppercase tracking-wider">
              {currentTrack?.artist || 'Unknown'}
            </p>
          </div>
          {}
          <div className="w-full h-12 flex items-center justify-center gap-1 mt-8">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-white/20 transition-all duration-300
                  ${isPlaying ? 'animate-waveform' : 'h-2'}`}
                style={{
                  animationDelay: `${i * 0.05}s`,
                  height: isPlaying ? 'auto' : '8px'
                }}
              />
            ))}
          </div>
        </div>
        {}
        <div className="mt-auto space-y-8">
          {}
          <div className="space-y-3">
            <div
              className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                onSeek((x / rect.width) * duration);
              }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black font-mono text-white/40 tracking-wider">
              <span>{formatDuration(currentTime * 1000)}</span>
              <span>{formatDuration(duration * 1000)}</span>
            </div>
          </div>
          {}
          <div className="flex items-center justify-between">
            <button onClick={onToggleMute} className="text-white/40 hover:text-white transition-all">
              {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <div className="flex items-center gap-6">
              <button onClick={onPrevious} className="text-white/60 hover:text-white transition-all active:scale-90">
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button
                onClick={onTogglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)]"
              >
                {isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button onClick={onNext} className="text-white/60 hover:text-white transition-all active:scale-90">
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
            <button className="text-white/40 hover:text-white transition-all">
              <Repeat size={20} />
            </button>
          </div>
          {}
          <div className="flex justify-center pt-4 border-t border-white/5">
            <button className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white/60 transition-all flex items-center gap-2">
              <Music2 size={12} />
              Lyrics
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotate-animation {
          animation: rotate 20s linear infinite;
        }
        @keyframes waveform {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        .animate-waveform {
          animation: waveform 0.6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
````

## File: src/components/tasks/TaskForm.tsx
````typescript
import React, { useState, useRef, memo } from 'react';
import { Plus, Timer, Calendar as CalendarIcon, Users, Tag, Clock, X, Circle, Loader2, ChevronDown } from 'lucide-react';
import { db, appId } from '../../firebase';
import { addDoc, collection } from 'firebase/firestore';
import type { TeamMember, Task, SubTask } from '../../utils/helpers';
import type { User } from 'firebase/auth';
interface TaskFormProps {
  user: User | null;
  isDark: boolean;
  teamMembers?: TeamMember[];
  onLocalAdd?: (task: Task) => void;
}
const TaskForm = ({ user, isDark, teamMembers = [], onLocalAdd }: TaskFormProps): React.ReactElement => {
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [timerType, setTimerType] = useState<NonNullable<Task['type']>>('stopwatch');
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [assigneeId, setAssigneeId] = useState(user?.uid || '');
  const [deadline, setDeadline] = useState('');
  // Ref-based inputs for better Vietnamese IME support
  const titleRef = useRef<HTMLInputElement | null>(null);
  const subTaskRef = useRef<HTMLInputElement | null>(null);
  const [tempSubTasks, setTempSubTasks] = useState<SubTask[]>([]);
  const [formKey, setFormKey] = useState(0); // For resetting uncontrolled inputs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleAddTempSubTask = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent): void => {
    e.preventDefault();
    const val = subTaskRef.current?.value?.trim();
    if (!val) return;
    setTempSubTasks([...tempSubTasks, { id: crypto.randomUUID(), title: val, isDone: false }]);
    if (subTaskRef.current) subTaskRef.current.value = '';
  };
  const removeTempSubTask = (id: string): void => {
    setTempSubTasks(tempSubTasks.filter(s => s.id !== id));
  };
  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (isSubmitting) return;
    const currentTitle = titleRef.current?.value?.trim();
    if (!currentTitle) return;
    setIsSubmitting(true);
    const finalAssigneeId = assigneeId || user?.uid;
    const assignee = teamMembers.find(m => m.uid === finalAssigneeId);
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: currentTitle,
      createdBy: user?.uid || "local-user",
      assigneeId: finalAssigneeId || null,
      assigneeName: assignee?.displayName || null,
      assigneePhoto: assignee?.photoURL || null,
      deadline: deadline ? (() => {
        const d = new Date(deadline);
        if (!deadline.includes('T')) d.setHours(23, 0, 0, 0);
        return d.getTime();
      })() : (() => {
        const d = new Date();
        d.setHours(23, 0, 0, 0);
        return d.getTime();
      })(),
      priority: priority,
      status: 'idle',
      type: timerType,
      limitTime: timerType === 'countdown' ? countdownMinutes * 60 * 1000 : null,
      totalTrackedTime: 0,
      subTasks: tempSubTasks.map(st => ({...st, isDone: !!st.isDone})),
      createdAt: Date.now()
    };
    const cleanTask = Object.entries(newTask).reduce<Record<string, unknown>>((acc, [key, val]) => {
      if (key !== 'id') {
        acc[key] = val === undefined ? null : val;
      }
      return acc;
    }, {});
    console.log("Submitting Task to Firebase (without local ID):", cleanTask);
    if (user && user.uid !== "local-user-test") {
        try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), cleanTask);
          setFormKey(prev => prev + 1);
          setAssigneeId(user?.uid || '');
          setDeadline('');
          setTempSubTasks([]);
        } catch(err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("Add task error:", err);
          alert("Lỗi thêm công việc: " + message);
        }
    } else if (onLocalAdd) {
        onLocalAdd(newTask);
        setFormKey(prev => prev + 1);
        setTempSubTasks([]);
    }
    setIsSubmitting(false);
  };
  return (
    <div className={`p-1 md:p-2 rounded-3xl md:rounded-[2rem] mb-6 md:mb-10 transition-all ${isDark ? 'bg-slate-800/85 backdrop-blur-xl border border-slate-700/60 shadow-2xl shadow-indigo-950/20' : 'bg-white/92 backdrop-blur-xl border border-slate-200/80 shadow-[0_24px_80px_-32px_rgba(148,163,184,0.45)]'}`}>
       <form onSubmit={handleAddTask} className="flex flex-col">
          <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2" key={`form-${formKey}`}>
             <Plus className="text-indigo-500 flex-shrink-0 w-5 h-5 md:w-6 md:h-6" strokeWidth={2.2} />
             <input
               type="text"
               ref={titleRef}
               placeholder="Khởi tạo việc mới cho Tít & Tún..."
               spellCheck="false"
               autoComplete="off"
               className={`w-full bg-transparent text-base md:text-xl font-medium outline-none transition-all ${isDark ? 'text-white' : 'text-slate-800'}`}
             />
             <button
               type="submit"
               disabled={isSubmitting}
               className="ml-2 md:ml-4 bg-indigo-600 text-white px-3 md:px-6 py-1.5 md:py-2.5 text-[10px] md:text-sm rounded-full font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex-shrink-0 flex items-center gap-2"
             >
               {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
               {isSubmitting ? 'ĐANG LƯU...' : 'TẠO LỆNH'}
             </button>
          </div>
          {/* Subtasks addition area */}
          <div className="px-3 md:px-6 pb-2">
             <div className="flex flex-col gap-2">
                {tempSubTasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2">
                    <Circle size={10} className="text-slate-400" />
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{sub.title}</span>
                    <button
                      type="button"
                      onClick={() => removeTempSubTask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 transition-all"
                      aria-label="Xóa việc nhỏ"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-1" key={`subtask-${formKey}`}>
                   <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isDark ? 'border-slate-600 text-slate-500 opacity-60' : 'border-slate-300 text-slate-400 opacity-70'}`}>
                      <Plus size={10} />
                   </div>
                   <input
                     type="text"
                     ref={subTaskRef}
                     onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTempSubTask(e); } }}
                     placeholder="Ghi chú thêm các việc nhỏ (Enter để thêm)..."
                     spellCheck="false"
                     autoComplete="off"
                     className={`text-xs font-semibold bg-transparent outline-none flex-1 py-1 border-b border-transparent focus:border-indigo-500/30 transition-all ${isDark ? 'text-slate-200' : 'text-slate-500'}`}
                   />
                </div>
             </div>
          </div>
          <div className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 border-t mt-1 ${isDark ? 'border-slate-700/50' : 'border-slate-200/80'}`}>
             {/* Người phụ trách (Chỉ Tit / Tun) */}
             <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${assigneeId ? (isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600') : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-indigo-50/70 text-slate-600 hover:bg-indigo-50')}`}>
                <Users size={14} className="flex-shrink-0"/>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="task-form-select bg-transparent outline-none cursor-pointer appearance-none pr-5 min-w-[72px]"
                  aria-label="Chọn người phụ trách"
                >
                    <option value="">Ai nhận?</option>
                    {teamMembers.map(member => (
                      <option key={member.uid} value={member.uid}>{member.displayName || member.email}</option>
                    ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 pointer-events-none opacity-75" />
             </div>
             {/* Độ ưu tiên */}
             <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${priority === 'high' ? 'bg-red-500/10 text-red-500' : priority === 'medium' ? (isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-500') : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500')}`}>
                <Tag size={14} className="flex-shrink-0"/>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NonNullable<Task['priority']>)}
                  className="task-form-select bg-transparent outline-none cursor-pointer uppercase appearance-none pr-5 min-w-[68px]"
                  aria-label="Chọn độ ưu tiên"
                >
                  <option value="high">GẤP</option>
                  <option value="medium">Vừa</option>
                  <option value="low">Rảnh</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 pointer-events-none opacity-75" />
             </div>
             {/* Deadline */}
             <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${deadline ? 'bg-pink-500/10 text-pink-500' : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}`}>
                <CalendarIcon size={14} className="flex-shrink-0"/>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`task-form-datetime bg-transparent outline-none cursor-pointer max-w-[150px] ${isDark ? 'scheme-dark' : 'scheme-light'}`}
                  aria-label="Chọn thời hạn"
                />
             </div>
             {/* Chế độ Time */}
             <div className="flex items-center gap-1 ml-auto">
                <button type="button" onClick={() => setTimerType(timerType === 'stopwatch' ? 'countdown' : 'stopwatch')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-all ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                   {timerType === 'countdown' ? <><Timer size={14}/> Đếm ngược</> : <><Clock size={14}/> Đếm lên</>}
                </button>
                {timerType === 'countdown' && (
                  <input
                    type="number"
                    value={countdownMinutes}
                    onChange={(e) => setCountdownMinutes(Number(e.target.value) || 0)}
                    className={`w-14 text-center text-xs font-bold px-2 py-1.5 rounded-full outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 text-indigo-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}
                    aria-label="Số phút đếm ngược"
                    placeholder="25"
                  />
                )}
             </div>
          </div>
       </form>
    </div>
  );
};
export default memo(TaskForm);
````

## File: src/hooks/useAppEffects.ts
````typescript
import { useEffect, useRef } from 'react';
import { Task, UserData } from '../utils/helpers';
import { DailyQuest } from '../services/dailyQuestService';
import * as dailyQuestService from '../services/dailyQuestService';
interface UseAppEffectsProps {
  userData: UserData;
  tasks: Task[];
  dailyQuest: DailyQuest | null;
  playSound: (sound: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
const ignoreAsyncError = () => undefined;
export const useAppEffects = ({
  userData,
  tasks,
  dailyQuest,
  playSound,
  setTheme
}: UseAppEffectsProps): void => {
  const streakMilestonesRef = useRef([7, 30]);
  const previousStreakRef = useRef<number | null>(null);
  useEffect(() => {
    setTheme(userData.isDarkMode ? 'dark' : 'light');
  }, [userData.isDarkMode, setTheme]);
  useEffect(() => {
    if (!userData.isLoaded || !tasks.length) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    if (dailyQuest?.dateKey === todayKey) return;
    dailyQuestService.ensureDailyQuest(tasks).catch(ignoreAsyncError);
  }, [userData.isLoaded, tasks, dailyQuest?.dateKey]);
  useEffect(() => {
    if (!userData.isLoaded) return;
    const currentStreak = userData.streak || 0;
    const previousStreak = previousStreakRef.current;
    if (previousStreak !== null && currentStreak > previousStreak) {
      const hitMilestone = streakMilestonesRef.current.find(
        (milestone) => previousStreak < milestone && currentStreak >= milestone
      );
      if (hitMilestone) {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 220,
            spread: 85,
            origin: { y: 0.55 },
            colors: ['#f59e0b', '#fb7185', '#a855f7', '#22d3ee']
          });
        });
        playSound('complete');
      }
    }
    previousStreakRef.current = currentStreak;
  }, [userData.isLoaded, userData.streak, playSound]);
};
````

## File: src/hooks/useFocusMusic.ts
````typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, appsScriptUrl } from '../firebase';
import { musicStore } from '../utils/musicStore';
import { useAppStore } from '../store/useAppStore';
import { UserData } from '../utils/helpers';
const globalAudio = new Audio();
export interface MusicTrackData {
  id: string;
  mood?: string;
  title: string;
  artist?: string;
  cover?: string;
  url: string;
  storagePath?: string;
  driveId?: string;
  isCustom?: boolean;
  createdAt: string;
  uploadedBy: string;
}
interface FirestoreMusicTrack {
  mood?: string;
  title?: string;
  artist?: string;
  cover?: string;
  url?: string;
  storagePath?: string;
  driveId?: string;
  isCustom?: boolean;
  createdAt?: string;
  uploadedBy?: string;
}
export interface UseFocusMusicReturn {
  tracks: MusicTrackData[];
  currentTrack: MusicTrackData | null;
  currentTrackIdx: number;
  setCurrentTrackIdx: (idx: number) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  togglePlay: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  currentTime: number;
  duration: number;
  handleSeek: (time: number) => void;
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  isCaching: boolean;
  cachedIds: Set<string>;
  uploadProgress: number;
  handleFileUpload: (file: File, selectedMood?: string) => Promise<void>;
  handleDeleteTrack: (track: MusicTrackData) => Promise<void>;
  handleRandomPlay: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement>;
}
export function useFocusMusic(userData: UserData): UseFocusMusicReturn {
  const music = useAppStore((state) => state.userData.music || {
    currentTrackIdx: 0,
    isPlaying: false,
    volume: 0.7,
    isMuted: false
  });
  const patchUserData = useAppStore((state) => state.patchUserData);
  const audioRef = useRef<HTMLAudioElement>(globalAudio);
  const [customTracks, setCustomTracks] = useState<MusicTrackData[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [cachedIds] = useState(new Set<string>());
  const [uploadProgress, setUploadProgress] = useState(0);
  const { currentTrackIdx, isPlaying, volume, isMuted } = music;
  const musicRef = useRef(music);
  useEffect(() => { musicRef.current = music; }, [music]);
  const setMusicState = useCallback((updates: Partial<typeof music>) => {
    patchUserData({
      music: { ...musicRef.current, ...updates }
    });
  }, [patchUserData]);
  useEffect(() => {
    const q = query(collection(db, 'shared_music'), orderBy('createdAt', 'desc'));
    const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
      const nextTracks = snapshot.docs
        .map((snap): MusicTrackData | null => {
          const data = snap.data() as FirestoreMusicTrack;
          if (!data.title || !data.url) return null;
          return {
            id: snap.id,
            title: data.title,
            url: data.url,
            mood: data.mood,
            artist: data.artist,
            cover: data.cover,
            storagePath: data.storagePath,
            driveId: data.driveId,
            isCustom: data.isCustom,
            createdAt: data.createdAt || new Date(0).toISOString(),
            uploadedBy: data.uploadedBy || 'unknown'
          };
        })
        .filter((track): track is MusicTrackData => Boolean(track));
      setCustomTracks(nextTracks);
    });
    return () => unsubscribe();
  }, []);
  const tracks = customTracks;
  const currentTrack = tracks[currentTrackIdx] || null;
  useEffect(() => {
    const migrate = async () => {
      try {
        const localMetadata = await musicStore.getAllMetadata();
        if (localMetadata?.length > 0) {
          for (const track of localMetadata) {
            if (track.url === 'local') {
              const fullTrack = await musicStore.getTrack(track.id);
              if (fullTrack?.blob) {
                const fileName = `migration-${Date.now()}-${track.title}.mp3`;
                const storageRef = ref(storage, `music/${fileName}`);
                const uploadResult = await uploadBytes(storageRef, fullTrack.blob);
                const downloadUrl = await getDownloadURL(uploadResult.ref);
                await addDoc(collection(db, 'shared_music'), {
                  mood: track.mood || 'lofi',
                  title: track.title,
                  artist: 'Migrated Upload',
                  cover: track.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
                  url: downloadUrl,
                  storagePath: `music/${fileName}`,
                  isCustom: true,
                  createdAt: new Date().toISOString(),
                  uploadedBy: userData.uid || 'migration'
                });
              }
              await musicStore.deleteTrack(track.id);
            }
          }
        }
      } catch (err) { console.error('Migration failed:', err); }
    };
    if (userData?.uid) migrate();
  }, [userData?.uid]);
  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;
    const nextIdx = (currentTrackIdx + 1) % tracks.length;
    setMusicState({ currentTrackIdx: nextIdx, isPlaying: true });
  }, [tracks.length, currentTrackIdx, setMusicState]);
  const handlePrevious = useCallback(() => {
    if (tracks.length === 0) return;
    const prevIdx = (currentTrackIdx - 1 + tracks.length) % tracks.length;
    setMusicState({ currentTrackIdx: prevIdx, isPlaying: true });
  }, [tracks.length, currentTrackIdx, setMusicState]);
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      globalAudio.pause();
      setMusicState({ isPlaying: false });
    } else if (currentTrack) {
      globalAudio.play().catch(console.warn);
      setMusicState({ isPlaying: true });
    }
  }, [isPlaying, currentTrack, setMusicState]);
  const handleSeek = useCallback((time: number) => {
    globalAudio.currentTime = time;
    setCurrentTime(time);
  }, []);
  const handleRandomPlay = useCallback(() => {
    if (tracks.length === 0) return;
    const randomIdx = Math.floor(Math.random() * tracks.length);
    setMusicState({ currentTrackIdx: randomIdx, isPlaying: true });
  }, [tracks, setMusicState]);
  const ensureTrackCached = async (track: MusicTrackData | null): Promise<string | null> => {
    if (!track) return null;
    const isExternal = track.url.includes('sharepoint.com') || track.url.includes('soundhelix.com');
    if (isExternal) return track.url;
    try {
      const cached = await musicStore.getTrack(track.id);
      if (cached?.blob) return URL.createObjectURL(cached.blob);
      if (track.url === 'local') return null;
      setIsCaching(true);
      const response = await fetch(track.url);
      const blob = await response.blob();
      await musicStore.saveTrack({ id: track.id, blob, name: track.title });
      setIsCaching(false);
      return URL.createObjectURL(blob);
    } catch {
      setIsCaching(false);
      return track.url;
    }
  };
  useEffect(() => {
    let objectUrl: string | null = null;
    const updateSource = async () => {
      if (!currentTrack) return;
      const src = await ensureTrackCached(currentTrack);
      if (src?.startsWith('blob:')) objectUrl = src;
      if (globalAudio.src !== src && src) {
        globalAudio.src = src;
        globalAudio.load();
      }
      globalAudio.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        globalAudio.play().catch(console.warn);
      } else {
        globalAudio.pause();
      }
    };
    updateSource();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currentTrackIdx, tracks, volume, isMuted, isPlaying, currentTrack]);
  useEffect(() => {
    const audio = globalAudio;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => handleNext();
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [handleNext]);
  useEffect(() => {
    return () => {
      globalAudio.pause();
      patchUserData({
        music: { ...musicRef.current, isPlaying: false }
      });
    };
  }, [patchUserData]);
  const handleFileUpload = async (file: File, selectedMood = 'all') => {
    if (!file || !appsScriptUrl) return;
    try {
      setIsCaching(true);
      setUploadProgress(10);
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      setUploadProgress(30);
      const res = await fetch(appsScriptUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'uploadMusic', fileName: file.name, mimeType: file.type, base64 })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setUploadProgress(80);
      await addDoc(collection(db, 'shared_music'), {
        mood: selectedMood,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Shared Drive',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
        url: result.url,
        driveId: result.id,
        isCustom: true,
        createdAt: new Date().toISOString(),
        uploadedBy: userData.uid || 'unknown'
      });
      setUploadProgress(100);
      setTimeout(() => { setIsCaching(false); setUploadProgress(0); }, 1000);
    } catch (err: unknown) {
      setIsCaching(false);
      setUploadProgress(0);
      alert('Tải nhạc thất bại: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  const handleDeleteTrack = async (track: MusicTrackData) => {
    try {
      await deleteDoc(doc(db, 'shared_music', track.id));
      if (track.storagePath) await deleteObject(ref(storage, track.storagePath));
      await musicStore.deleteTrack(track.id);
      if (currentTrack?.id === track.id) handleNext();
    } catch { alert('Xóa nhạc thất bại.'); }
  };
  return {
    tracks, currentTrack, currentTrackIdx, setCurrentTrackIdx: (idx: number) => setMusicState({ currentTrackIdx: idx }),
    isPlaying, setIsPlaying: (val: boolean) => setMusicState({ isPlaying: val }), togglePlay, handleNext, handlePrevious,
    currentTime, duration, handleSeek,
    volume, setVolume: (val: number) => setMusicState({ volume: val }), isMuted, setIsMuted: (val: boolean) => setMusicState({ isMuted: val }),
    isCaching, cachedIds, uploadProgress,
    handleFileUpload, handleDeleteTrack, handleRandomPlay,
    audioRef
  };
}
````

## File: src/hooks/useHeartbeat.ts
````typescript
import { useEffect, useMemo, useRef } from 'react';
import * as taskService from '../services/taskService';
import { checkTaskStale, Task } from '../utils/helpers';
import { HEARTBEAT_INTERVAL, HEARTBEAT_TIMEOUT } from '../utils/constants';
import type { User } from 'firebase/auth';
export function useHeartbeat(user: User | null, tasks: Task[]): void {
  const myRunningTaskId = useMemo(() => {
    if (!user || user.uid === 'local-user-test') return null;
    return tasks.find(t => t.status === 'running' && t.currentWorker === user.uid)?.id || null;
  }, [user, tasks]);
  const hasBootedRef = useRef(false);
  useEffect(() => {
    if (!myRunningTaskId) return;
    const send = () => {
      taskService.updateTask(myRunningTaskId, { lastHeartbeat: Date.now() }).catch(() => {});
    };
    send();
    const interval = setInterval(send, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [myRunningTaskId]);
  useEffect(() => {
    if (!user || user.uid === 'local-user-test' || hasBootedRef.current || !tasks.length) return;
    hasBootedRef.current = true;
    const now = Date.now();
    tasks.forEach(task => {
      const { isStale, activeTime } = checkTaskStale(task, now, HEARTBEAT_TIMEOUT);
      if (isStale) {
        console.log(`[Heartbeat] Boot cleanup: auto-pausing "${task.title}" (reason: heartbeat_timeout)`);
        taskService.updateTask(task.id, {
          status: 'paused',
          totalTrackedTime: (task.totalTrackedTime || 0) + (activeTime ?? 0),
          lastStartTime: undefined,
          autoPauseReason: 'heartbeat_timeout'
        }).catch((err) => {
          console.error(`[Heartbeat] Failed to auto-pause task ${task.id}:`, err);
        });
      }
    });
  }, [user, tasks]);
  useEffect(() => {
    if (!myRunningTaskId) return;
    const handler = () => {
      if (document.hidden) {
        taskService.updateTask(myRunningTaskId, { lastHeartbeat: Date.now() }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [myRunningTaskId]);
}
````

## File: src/hooks/useProductivityStats.ts
````typescript
import { useMemo } from 'react';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  format, isSameDay, getHours, isWithinInterval, subWeeks, subMonths
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { Task, TeamMember, getLegacyIdByEmail } from '../utils/helpers';
const WEEK_STARTS_ON = 1;
export interface DistributionData {
  label: string;
  value: number;
  titMs: number;
  tunMs: number;
}
export interface HourData {
  tit: number;
  tun: number;
  total: number;
}
export interface ProductivityStats {
  sessions: number;
  totalFocus: string;
  titTotal: string;
  tunTotal: string;
  onTimeRate: number;
  lateCount: number;
  titLate: number;
  tunLate: number;
  changePct: number;
  distribution: DistributionData[];
  maxDist: number;
  hours: HourData[];
  maxHourMs: number;
  peakHour: number;
  bestDay: string;
  bestDayMs: string;
  totalFocusMs: number;
}
export function useProductivityStats(tasks: Task[], timeRange: 'week' | 'month', teamMembers: TeamMember[] = []): ProductivityStats {
  return useMemo(() => {
    const normalizeAssignee = (task: Task): 'tit' | 'tun' | 'unknown' => {
      const assigneeId = task.assigneeId?.toLowerCase().trim();
      const assigneeName = task.assigneeName?.toLowerCase().trim();
      if (assigneeId === 'tit' || assigneeId === 'tun') return assigneeId;
      if (assigneeId) {
        const memberByUid = teamMembers.find(m => m?.uid?.toLowerCase() === assigneeId);
        const legacyFromUid = getLegacyIdByEmail(memberByUid?.email);
        if (legacyFromUid === 'tit' || legacyFromUid === 'tun') return legacyFromUid;
      }
      if (assigneeName?.includes('tít') || assigneeName?.includes('tit')) return 'tit';
      if (assigneeName?.includes('tún') || assigneeName?.includes('tun')) return 'tun';
      return 'unknown';
    };
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
    if (timeRange === 'week') {
      currentStart = startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON });
      currentEnd = endOfWeek(now, { weekStartsOn: WEEK_STARTS_ON });
      previousStart = subWeeks(currentStart, 1);
      previousEnd = subWeeks(currentEnd, 1);
    } else {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      previousStart = subMonths(currentStart, 1);
      previousEnd = subMonths(currentEnd, 1);
    }
    const currentInterval = { start: currentStart, end: currentEnd };
    const previousInterval = { start: previousStart, end: previousEnd };
    const getTaskDate = (t: Task) => new Date(t.endTime || t.lastStartTime || t.createdAt || now);
    const currentTasks = tasks.filter(t => t.totalTrackedTime > 0 && isWithinInterval(getTaskDate(t), currentInterval));
    const previousTasks = tasks.filter(t => t.totalTrackedTime > 0 && isWithinInterval(getTaskDate(t), previousInterval));
    const totalFocusMs = currentTasks.reduce((acc, t) => acc + t.totalTrackedTime, 0);
    const prevTotalFocusMs = previousTasks.reduce((acc, t) => acc + t.totalTrackedTime, 0);
    const sessions = currentTasks.length;
    const completedTasks = currentTasks.filter(t => t.status?.startsWith('completed'));
    const onTimeTasks = completedTasks.filter(t => t.status === 'completed');
    const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeTasks.length / completedTasks.length) * 100) : 0;
    const titTasks = currentTasks.filter(t => normalizeAssignee(t) === 'tit');
    const tunTasks = currentTasks.filter(t => normalizeAssignee(t) === 'tun');
    const formatTime = (ms: number) => {
      if (ms === 0) return '0m';
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    const distribution: DistributionData[] = [];
    if (timeRange === 'week') {
      eachDayOfInterval(currentInterval).forEach(d => {
        const dayTasks = currentTasks.filter(t => isSameDay(getTaskDate(t), d));
        const titMs = dayTasks.filter(t => normalizeAssignee(t) === 'tit').reduce((acc, t) => acc + t.totalTrackedTime, 0);
        const tunMs = dayTasks.filter(t => normalizeAssignee(t) === 'tun').reduce((acc, t) => acc + t.totalTrackedTime, 0);
        distribution.push({ label: format(d, 'EEE', { locale: vi }), value: titMs + tunMs, titMs, tunMs });
      });
    } else {
      let curr = currentStart;
      let weekNum = 1;
      while(curr <= currentEnd) {
        let eow = endOfWeek(curr, { weekStartsOn: WEEK_STARTS_ON });
        if(eow > currentEnd) eow = currentEnd;
        const weekTasks = currentTasks.filter(t => isWithinInterval(getTaskDate(t), {start: curr, end: eow}));
        const titMs = weekTasks.filter(t => normalizeAssignee(t) === 'tit').reduce((acc, t) => acc + t.totalTrackedTime, 0);
        const tunMs = weekTasks.filter(t => normalizeAssignee(t) === 'tun').reduce((acc, t) => acc + t.totalTrackedTime, 0);
        distribution.push({ label: `T${weekNum}`, value: titMs + tunMs, titMs, tunMs });
        curr = new Date(eow.getTime() + 86400000);
        weekNum++;
      }
    }
    const maxDist = Math.max(...distribution.map(d => d.value), 1);
    const hours: HourData[] = Array(24).fill(null).map(() => ({ tit: 0, tun: 0, total: 0 }));
    currentTasks.forEach(t => {
      const h = getHours(getTaskDate(t));
      const assignee = normalizeAssignee(t);
      if (assignee === 'tit') hours[h].tit += t.totalTrackedTime;
      else if (assignee === 'tun') hours[h].tun += t.totalTrackedTime;
      hours[h].total += t.totalTrackedTime;
    });
    const maxHourMs = Math.max(...hours.map(h => h.total), 1);
    const peakHour = hours.findIndex(h => h.total === maxHourMs);
    const changePct = prevTotalFocusMs > 0 ? Math.round(((totalFocusMs - prevTotalFocusMs) / prevTotalFocusMs) * 100) : (totalFocusMs > 0 ? 100 : 0);
    let bestDay = 'N/A', bestDayMsValue = 0;
    if (timeRange === 'week' && distribution.length > 0) {
      const best = [...distribution].sort((a,b) => b.value - a.value)[0];
      if (best.value > 0) { bestDay = best.label; bestDayMsValue = best.value; }
    }
    return {
      sessions,
      totalFocus: formatTime(totalFocusMs),
      titTotal: formatTime(titTasks.reduce((acc, t) => acc + t.totalTrackedTime, 0)),
      tunTotal: formatTime(tunTasks.reduce((acc, t) => acc + t.totalTrackedTime, 0)),
      onTimeRate,
      lateCount: currentTasks.filter(t => t.status === 'completed_late').length,
      titLate: titTasks.filter(t => t.status === 'completed_late').length,
      tunLate: tunTasks.filter(t => t.status === 'completed_late').length,
      changePct, distribution, maxDist, hours, maxHourMs, peakHour, bestDay,
      bestDayMs: formatTime(bestDayMsValue),
      totalFocusMs
    };
  }, [tasks, timeRange, teamMembers]);
}
````

## File: src/hooks/useTTApp.ts
````typescript
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAudio } from './useAudio';
import { useAppBootstrap } from './useAppBootstrap';
import { useUserStats } from './useUserStats';
import { useAppUiActions } from './useAppUiActions';
import { useDailyQuest } from './useDailyQuest';
import { useAiActions } from './useAiActions';
import { useFocusTimer } from './useFocusTimer';
import { useHeartbeat } from './useHeartbeat';
import { useAppEffects } from './useAppEffects';
import { useTaskActions } from './useTaskActions';
import { useAppViewModel } from './useAppViewModel';
import { useAutoTaskLogic } from './useAutoTaskLogic';
import { useCalendarAutoSync } from './useCalendarAutoSync';
import { useNow } from './useNow';
import { useActivityResume } from './useActivityResume';
import { useDeepLinks } from './useDeepLinks';
import { isDummyConfig, googleCalendarApiKey, calendarIdTit, calendarIdTun, appsScriptUrl } from '../firebase';
export function useTTApp() {
  const tasks = useAppStore((state) => state.tasks);
  const setTasks = useAppStore((state) => state.setTasks);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const [currentTab, setCurrentTab] = useState('tasks');
  const [hasUserSelectedTab, setHasUserSelectedTab] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'partner' | string>('all');
  const [isClosetOpen, setIsClosetOpen] = useState(false);
  const { playSound } = useAudio();
  const { user, authError, isLoading } = useAppBootstrap({ setTasks });
  const {
    userData, setUserData, teamMembers, handleBuyItem, handleUseTicket,
    handleEquipItem, handleUpdateSettings, awardTaskRewards, awardSubTaskRewards
  } = useUserStats(user);
  const uiActions = useAppUiActions({
    playSound,
    setHasUserSelectedTab,
    setCurrentTab,
    setFilterMode,
    userData,
    setUserData,
    handleUpdateSettings
  });
  const { dailyQuest, handleRefreshDailyQuest, handleCompleteDailyQuest } = useDailyQuest({ tasks, userData, user, handleUpdateSettings, playSound });
  const aiActions = useAiActions({ tasks, userData });
  const { focusingTaskId, triggerSystemFocus } = useFocusTimer(user, tasks);
  const now = useNow();
  const config = {
    calendarApiKey: googleCalendarApiKey,
    calendarIdTit,
    calendarIdTun,
    appsScriptUrl
  };
  useAppEffects({ userData, tasks, dailyQuest, playSound, setTheme });
  useHeartbeat(user, tasks);
  const taskActions = useTaskActions({
    tasks,
    user,
    userData,
    setTasks,
    triggerSystemFocus,
    awardTaskRewards,
    awardSubTaskRewards,
    playSound
  });
  useAutoTaskLogic(tasks, now, taskActions);
  useDeepLinks({ taskActions, isLoaded: userData.isLoaded });
  const { triggerSync } = useCalendarAutoSync({
    user,
    userData,
    teamMembers,
    tasks,
    config
  });
  useActivityResume({
    user,
    tasks,
    onResume: triggerSync
  });
  const viewModel = useAppViewModel({
    tasks,
    filterMode,
    user,
    teamMembers,
    currentTab,
    hasUserSelectedTab,
    defaultView: userData.defaultView,
    userXp: userData.xp
  });
  const previousTabRef = useRef<string | null>(null);
  useEffect(() => {
    const nextTab = viewModel.activeTab;
    if (nextTab === 'calendar' && previousTabRef.current !== 'calendar') {
      triggerSync({ force: true, reason: 'enter_calendar' });
    }
    previousTabRef.current = nextTab;
  }, [viewModel.activeTab, triggerSync]);
  return {
    user,
    userData,
    teamMembers,
    tasks,
    theme,
    authError,
    isLoading,
    activeTab: viewModel.activeTab,
    filterMode,
    isClosetOpen,
    now,
    setIsClosetOpen,
    playSound,
    handleUpdateSettings,
    handleBuyItem,
    handleUseTicket,
    handleEquipItem,
    handleTabChange: uiActions.handleTabChange,
    handleFilterModeChange: uiActions.handleFilterModeChange,
    handleToggleDarkMode: uiActions.handleToggleDarkMode,
    handleRenameMascot: uiActions.handleRenameMascot,
    handleChangeMascotAvatar: uiActions.handleChangeMascotAvatar,
    taskActions,
    triggerSystemFocus,
    dailyQuest,
    handleRefreshDailyQuest,
    handleCompleteDailyQuest,
    aiActions,
    filteredTasks: viewModel.filteredTasks,
    partnerTask: viewModel.partnerTask,
    partnerInfo: viewModel.partnerInfo,
    myRunningTask: viewModel.myRunningTask,
    levelInfo: viewModel.levelInfo,
    focusingTaskId,
    config
  };
}
````

## File: src/services/taskService.ts
````typescript
import { db, appId } from '../firebase';
import {
  collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, Unsubscribe, DocumentData, DocumentReference, deleteField
} from 'firebase/firestore';
import { Task, SubTask } from '../utils/helpers';
export const subscribeToTasks = (callback: (tasks: Task[]) => void, onError?: (error: any) => void): Unsubscribe | void => {
  try {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return { ...data, id: docSnap.id } as Task;
      });
      callback(tasks);
    }, (error) => {
      if (onError) onError(error);
    });
  } catch (error) {
    console.error("Error subscribing to tasks:", error);
    if (onError) onError(error);
  }
};
export const addTask = async (taskData: Omit<Task, 'id'>): Promise<DocumentReference> => {
  try {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    return await addDoc(q, taskData);
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
  try {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
    const normalizedUpdates = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [key, value === undefined ? deleteField() : value])
    );
    return await updateDoc(docRef, normalizedUpdates as DocumentData);
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId);
    return await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};
export const updateSubTasks = async (taskId: string, subTasks: SubTask[]): Promise<void> => {
  return await updateTask(taskId, { subTasks });
};
````

## File: src/services/userService.ts
````typescript
import { db, appId } from '../firebase';
import {
  doc, onSnapshot, setDoc, updateDoc, collection, Unsubscribe, DocumentData
} from 'firebase/firestore';
import { UserData, TeamMember } from '../utils/helpers';
export const subscribeToUserStats = (uid: string, callback: (data: UserData | null) => void): Unsubscribe => {
  const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  return onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserData);
    } else {
      callback(null);
    }
  });
};
export const subscribeToTeamMembers = (callback: (members: TeamMember[]) => void): Unsubscribe => {
  const q = collection(db, 'artifacts', appId, 'public', 'data', 'team_members');
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as TeamMember));
  });
};
const syncPublicStats = async (uid: string, data: Partial<UserData>): Promise<void> => {
  const relevantFields = ['streak', 'level', 'xp', 'ttGold', 'streakFreezes'];
  const hasRelevant = relevantFields.some(f => f in data);
  if (!hasRelevant) return;
  const publicRef = doc(db, 'artifacts', appId, 'public', 'data', 'widget_stats', uid);
  const mirror: Record<string, unknown> = { updatedAt: Date.now() };
  for (const f of relevantFields) {
    if (f in data) mirror[f] = (data as Record<string, unknown>)[f];
  }
  await setDoc(publicRef, mirror, { merge: true });
};
export const initializeUserStats = async (uid: string, initialData: Partial<UserData>): Promise<void> => {
  const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  await setDoc(userDocRef, initialData, { merge: true });
  syncPublicStats(uid, initialData).catch(() => undefined);
};
export const updateUserStats = async (uid: string, updates: Partial<UserData>): Promise<void> => {
  const userDocRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'stats');
  await updateDoc(userDocRef, updates as DocumentData);
  syncPublicStats(uid, updates).catch(() => undefined);
  const publicFields: (keyof TeamMember)[] = ['streak', 'level', 'xp', 'ttGold', 'streakFreezes', 'lastCheckIn'];
  const teamUpdates: Partial<TeamMember> = {};
  let hasTeamUpdates = false;
  for (const field of publicFields) {
    if (field in updates) {
      (teamUpdates as any)[field] = (updates as any)[field];
      hasTeamUpdates = true;
    }
  }
  if (hasTeamUpdates) {
    updateTeamMemberActive(uid, teamUpdates).catch(() => undefined);
  }
};
export const updateTeamMemberActive = async (uid: string, data: Partial<TeamMember>): Promise<void> => {
  const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_members', uid);
  return await updateDoc(docRef, {
    ...data,
    lastActive: Date.now()
  });
};
export const registerTeamMember = async (uid: string, data: Partial<TeamMember>): Promise<void> => {
  const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_members', uid);
  return await setDoc(docRef, {
    ...data,
    lastActive: Date.now()
  }, { merge: true });
};
````

## File: src/store/useAppStore.ts
````typescript
import { create } from 'zustand';
import { Task, UserData } from '../utils/helpers';
export const DEFAULT_USER_DATA: UserData = {
  xp: 0,
  level: 1,
  isDarkMode: false,
  lastCheckIn: null,
  streak: 0,
  streakFreezes: 3,
  unlockedBadgeIds: [],
  lastSeenLevel: 1,
  ownedItemIds: [],
  activeBooster: null,
  aiMode: 'cute',
  ttGold: 0,
  ticketHistory: [],
  avatarConfig: null,
  autoFocusShortcut: true,
  shortcutName: 'Làm việc',
  offShortcutName: '',
  defaultView: 'tasks',
  calendarVisibility: { tit: true, tun: true },
  mascotName: 'Mochi',
  mascotAvatar: '🤖',
  autoSyncCalendar: false,
  isLoaded: false,
  music: {
    currentTrackIdx: 0,
    isPlaying: false,
    volume: 0.7,
    isMuted: false
  }
};
export interface AppState {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  upsertTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  userData: UserData;
  setUserData: (userData: UserData | ((prev: UserData) => UserData)) => void;
  patchUserData: (updates: Partial<UserData>) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}
export const useAppStore = create<AppState>((set) => ({
  tasks: [],
  setTasks: (tasks) =>
    set((state) => ({
      tasks: typeof tasks === 'function' ? tasks(state.tasks) : tasks
    })),
  upsertTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId)
    })),
  userData: DEFAULT_USER_DATA,
  setUserData: (userData) =>
    set((state) => ({
      userData: typeof userData === 'function' ? userData(state.userData) : userData
    })),
  patchUserData: (updates) =>
    set((state) => ({
      userData: { ...state.userData, ...updates }
    })),
  theme: 'light',
  setTheme: (theme) => set({ theme })
}));
export const defaultUserData = DEFAULT_USER_DATA;
````

## File: src/utils/helpers.ts
````typescript
import { XP_BASE } from './constants';
export interface AvatarConfig {
  seed?: string;
  hair?: string;
  eyes?: string;
  mouth?: string;
  body?: string;
  hairColor?: string;
  clothingColor?: string;
  skinColor?: string;
  facialHair?: string;
}
export interface SubTask {
  id: string;
  title: string;
  isDone: boolean;
}
export interface Task {
  id: string;
  status: 'running' | 'completed' | 'paused' | 'idle' | 'completed_late';
  title: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: number;
  createdAt: number;
  createdBy: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneePhoto?: string | null;
  type?: 'stopwatch' | 'countdown';
  limitTime?: number | null;
  totalTrackedTime: number;
  lastStartTime?: number;
  lastHeartbeat?: number;
  isAutomated?: boolean;
  subTasks?: SubTask[];
  autoPauseReason?: string;
  currentWorker?: string | null;
  currentWorkerName?: string | null;
  autoPausedAt?: number | null;
  endTime?: number;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  calendarEventId?: string;
}
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | null;
  end: Date | null;
  isAllDay: boolean;
  owner: 'tit' | 'tun' | string;
  location?: string | null;
}
export interface UserData {
  uid?: string;
  displayName?: string;
  email?: string;
  xp: number;
  level: number;
  isDarkMode: boolean;
  lastCheckIn: string | null;
  streak: number;
  streakFreezes: number;
  unlockedBadgeIds: string[];
  lastSeenLevel: number;
  ownedItemIds: string[];
  activeBooster: {
    id: string;
    multiplier: number;
    boosterType: string;
    expiresAt: number;
  } | null;
  aiMode: string;
  aiModel?: string;
  ttGold: number;
  ticketHistory: any[];
  checkInHistory?: Record<string, string>;
  avatarConfig: AvatarConfig | null;
  autoFocusShortcut: boolean;
  shortcutName: string;
  offShortcutName: string;
  defaultView: string;
  calendarVisibility: { tit: boolean; tun: boolean };
  mascotName: string;
  mascotAvatar: string;
  autoSyncCalendar?: boolean;
  isLoaded: boolean;
  music: {
    currentTrackIdx: number;
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
  };
}
export interface TeamMember {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  streak?: number;
  xp?: number;
  level?: number;
  ttGold?: number;
  streakFreezes?: number;
  avatarConfig?: AvatarConfig | null;
  ownedItemIds?: string[];
  activeBooster?: unknown;
}
export const formatDuration = (ms: number): string => {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalSeconds = Math.floor(absMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const timeStr = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return isNegative ? `-${timeStr}` : timeStr;
};
export const getAvatarUrl = (config: AvatarConfig = {}): string => {
  const baseUrl = "https://api.dicebear.com/7.x/personas/svg";
  const params = new URLSearchParams({
    seed: config.seed || "Tit",
    hair: config.hair || "shortCombover",
    eyes: config.eyes || "open",
    mouth: config.mouth || "smile",
    body: config.body || "squared",
    hairColor: config.hairColor || "362c47",
    clothingColor: config.clothingColor || "456dff",
    skinColor: config.skinColor || "eeb4a4"
  });
  if (config.facialHair && config.facialHair !== 'none') {
    params.append('facialHair', config.facialHair);
    params.append('facialHairProbability', '100');
  } else {
    params.append('facialHairProbability', '0');
  }
  return `${baseUrl}?${params.toString()}`;
};
export const getLegacyIdByEmail = (email: string | null | undefined): string | null => {
  if (!email) return null;
  const e = email.toLowerCase();
  if (e === 'dinhthai.ctv@gmail.com') return 'tit';
  if (e === 'transontruc.03@gmail.com') return 'tun';
  return null;
};
export const getAssigneeIdByEmail = (email: string | null | undefined, teamMembers: TeamMember[] = []): string | null => {
  if (!email) return null;
  const member = teamMembers.find(m => m?.email?.toLowerCase() === email.toLowerCase());
  return member ? member.uid : null;
};
export interface LevelInfo {
  level: number;
  currentXp: number;
  xpNeeded: number;
  progress: number;
}
export const calculateLevel = (xp: number): LevelInfo => {
  let level = 1;
  let currentXp = xp;
  let xpNeeded = Math.floor(XP_BASE * Math.pow(1.5, level - 1));
  while (currentXp >= xpNeeded) {
    currentXp -= xpNeeded;
    level += 1;
    xpNeeded = Math.floor(XP_BASE * Math.pow(1.5, level - 1));
  }
  return { level, currentXp, xpNeeded, progress: (currentXp / xpNeeded) * 100 };
};
export const safeJsonParse = (rawText: any, fallbackValue: any): any => {
  if (typeof rawText !== 'string') return fallbackValue;
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return fallbackValue;
  }
};
export interface StaleResult {
  isStale: boolean;
  activeTime?: number;
}
/**
 * Check if a running task is stale and should be auto-paused.
 * Returns { isStale, activeTime } — activeTime = ms to add to totalTrackedTime.
 */
export const checkTaskStale = (task: Task, now: number, timeoutMs = 300_000): StaleResult => {
  // Automated tasks NEVER go stale — they follow the schedule regardless of heartbeat
  if (task.status !== 'running' || task.isAutomated) return { isStale: false };
  const lastHB = task.lastHeartbeat;
  const lastStart = task.lastStartTime;
  if (lastHB !== undefined && now - lastHB > timeoutMs) {
    return {
      isStale: true,
      activeTime: Math.max(0, lastHB - (lastStart ?? lastHB))
    };
  }
  if (lastHB === undefined && lastStart !== undefined && now - lastStart > timeoutMs) {
    return {
      isStale: true,
      activeTime: Math.min(now - lastStart, timeoutMs)
    };
  }
  return { isStale: false };
};
````

## File: src/index.css
````css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;500;600;700;800;900&display=swap');
html,
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Outfit', sans-serif;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}
.mesh-bg {
  background-color: #f1f5f9;
  background-image:
    radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.12) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.12) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(56, 189, 248, 0.12) 0px, transparent 50%);
}
.dark.mesh-bg {
  background-color: #0b1120;
  background-image:
    radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.25) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.2) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(56, 189, 248, 0.25) 0px, transparent 50%);
}
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #6366f1;
  border-radius: 99px;
}
::-webkit-scrollbar-thumb:hover {
  background: #818cf8;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}
.premium-logo {
  font-family: 'Outfit', sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: clamp(1.5rem, 5vw, 2.2rem);
  letter-spacing: -0.05em;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  line-height: 1;
  padding-right: 0.1em;
}
.nav-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.dark .nav-glass {
  background: rgba(11, 17, 32, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.nav-item-active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}
.avatar-edit-btn {
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.avatar-edit-btn:hover {
  transform: scale(1.1) rotate(2deg);
}
.avatar-edit-btn:hover .edit-badge {
  opacity: 1;
  transform: scale(1) translate(0, 0);
}
.edit-badge {
  opacity: 0;
  transform: scale(0.5) translate(5px, 5px);
  transition: all 0.2s ease-in-out;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}
@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}
@keyframes neon-border-rotate {
  0% {
    border-color: #22d3ee;
    box-shadow: 0 0 10px #22d3ee;
  }
  50% {
    border-color: #ec4899;
    box-shadow: 0 0 20px #ec4899;
  }
  100% {
    border-color: #22d3ee;
    box-shadow: 0 0 10px #22d3ee;
  }
}
@keyframes sakura-fall {
  0% {
    transform: translateY(-10%) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(110vh) rotate(360deg);
    opacity: 0;
  }
}
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out both;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out both;
}
.animate-slide-left {
  animation: slideInLeft 0.5s ease-out both;
}
.animate-slide-right {
  animation: slideInRight 0.5s ease-out both;
}
.animate-scale-in {
  animation: scaleIn 0.3s ease-out both;
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
.delay-100 {
  animation-delay: 0.1s;
}
.delay-200 {
  animation-delay: 0.2s;
}
.delay-300 {
  animation-delay: 0.3s;
}
.delay-400 {
  animation-delay: 0.4s;
}
.delay-500 {
  animation-delay: 0.5s;
}
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.glass-dark {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(99, 102, 241, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.glass-light {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.gradient-text {
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.task-form-select {
  color: inherit;
  font: inherit;
}
.task-form-select option {
  color: #0f172a;
}
.task-form-datetime {
  color: inherit;
  font: inherit;
  min-height: 1.5rem;
}
.task-form-datetime::-webkit-date-and-time-value {
  text-align: left;
}
.task-form-datetime::-webkit-datetime-edit,
.task-form-datetime::-webkit-datetime-edit-fields-wrapper,
.task-form-datetime::-webkit-datetime-edit-text,
.task-form-datetime::-webkit-datetime-edit-month-field,
.task-form-datetime::-webkit-datetime-edit-day-field,
.task-form-datetime::-webkit-datetime-edit-year-field,
.task-form-datetime::-webkit-datetime-edit-hour-field,
.task-form-datetime::-webkit-datetime-edit-minute-field {
  color: inherit;
  opacity: 1;
}
.task-form-datetime::-webkit-calendar-picker-indicator {
  opacity: 0.9;
  cursor: pointer;
}
.confetti-container {
  position: fixed;
  inset: 0;
  z-index: 200;
  pointer-events: none;
  overflow: hidden;
}
.confetti-piece {
  position: absolute;
  top: -20px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confetti-fall 3s ease-in-out forwards;
}
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 60px -15px rgba(99, 102, 241, 0.15);
}
.progress-bar {
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.theme-sakura {
  background-image: radial-gradient(circle at 10% 20%, rgba(255, 209, 215, 0.4) 0%, rgba(255, 239, 242, 0.4) 90%);
  position: relative;
}
.theme-sakura::before {
  content: '🌸';
  position: fixed;
  top: -20px;
  left: 20%;
  font-size: 20px;
  animation: sakura-fall 10s linear infinite;
  z-index: -1;
}
.theme-cyberpunk {
  background-image:
    linear-gradient(45deg, #0d0221 0%, #241734 100%),
    radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.05), transparent 50%);
  border-color: #0ff !important;
}
.neon-theme {
  box-shadow: inset 0 0 100px rgba(99, 102, 241, 0.1);
}
.avatar-frame-pro::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid #eab308;
  border-radius: 9999px;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.avatar-frame-neon::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid #22d3ee;
  border-radius: 9999px;
  animation: neon-border-rotate 3s linear infinite;
  filter: blur(1px);
}
select option {
  background: #1e293b;
  color: #fff;
}
.calendar-scroll {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
}
.calendar-scroll::-webkit-scrollbar {
  width: 4px;
}
.calendar-scroll::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 99px;
}
.calendar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.focus-ring-container {
  filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.15));
}
@keyframes focus-glow {
  0%, 100% {
    filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.2));
  }
  50% {
    filter: drop-shadow(0 0 60px rgba(99, 102, 241, 0.35));
  }
}
.focus-ring-container svg {
  animation: focus-glow 4s ease-in-out infinite;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scheme-dark {
  color-scheme: dark;
}
.scheme-light {
  color-scheme: light;
}
````

## File: .ai-instructions.md
````markdown
# AI Instructions - TT Daily Task

## CRITICAL: Source of Truth
Before starting ANY task, you MUST read the following document and follow its instructions:
- docs/prompt.md

This document contains the order of operations, technical guidelines, and current project architecture. Always prioritize rules in docs/prompt.md and docs/GUIDELINES.md over internal assumptions.
````

## File: package.json
````json
{
  "name": "tt-daily-task",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "pack": "repomix",
    "migrate:assignee": "node scripts/migrate-assignee.mjs",
    "migrate:assignee:dry": "node scripts/migrate-assignee-admin.mjs",
    "migrate:assignee:apply": "node scripts/migrate-assignee-admin.mjs --apply"
  },
  "dependencies": {
    "canvas-confetti": "^1.9.4",
    "date-fns": "^4.1.0",
    "firebase": "^12.11.0",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.7.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@tailwindcss/postcss": "^4.2.2",
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^25.6.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.27",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "firebase-admin": "^13.8.0",
    "globals": "^17.4.0",
    "postcss": "^8.5.8",
    "repomix": "^1.13.1",
    "tailwindcss": "^4.2.2",
    "typescript": "^6.0.3",
    "vite": "^8.0.1"
  }
}
````

## File: README.md
````markdown
# TT Daily Task

Ứng dụng quản lý công việc cho cặp đôi với focus mode, calendar sync, gamification và AI assistant.

## Quick Start
```bash
npm install
npm run dev
```

## Scripts
- `npm run dev`: chạy local
- `npm run build`: build production
- `npm run lint`: lint code
- `npm run pack`: tạo repomix context khi cần

## Project Structure
- `src/components/`: UI theo feature
- `src/hooks/`: business logic
- `src/services/`: tích hợp Firebase/AI/API
- `src/store/`: Zustand store
- `src/utils/`: constants/helpers
- `chrome-extension/`: extension YouTube focus-block (project riêng)

## Docs
- [docs/prompt.md](./docs/prompt.md)
- [docs/runbook.md](./docs/runbook.md)
- [docs/GUIDELINES.md](./docs/GUIDELINES.md)
- [docs/architecture.md](./docs/architecture.md)
````

## File: docs/architecture.md
````markdown
# Architecture Snapshot

Last updated: 2026-04-30

## Stack
- React 19 + Vite
- TypeScript (`strict: true`) — **100% TS trong `src/`**
- Zustand for global state
- Firebase (Auth, Firestore, Storage)

## Source Layout
- `src/components/`: UI theo feature (100% TSX)
- `src/hooks/`: business logic orchestration (100% TS)
- `src/services/`: external integrations (Firebase/AI/API)
- `src/store/`: Zustand state container
- `src/contexts/`: cross-feature contexts
- `src/utils/`: constants/helpers
- `chrome-extension/`: dự án phụ, plain JS (không qua build step)
- `public/widget.js`: Scriptable iOS widget, plain JS (platform requirement)

## Runtime Flow
1. `main.tsx` boot app
2. `App.tsx` mount layout/providers
3. `useTTApp.ts` điều phối state + hooks chính
4. Hooks gọi `services/*` để sync dữ liệu
5. UI components render theo state từ hooks/store/contexts

## Key Rules
- Không đưa business logic nặng vào component.
- API/Firestore logic phải đi qua `services/`.
- Tránh duplicate module `.js/.ts` cùng tên.
- Bắt buộc `npm run build` + `npm run lint` pass trước khi kết thúc task.

## Sync Logic & Debug
### Calendar Sync
- **Source of Truth:** Fetch qua Apps Script (fallback Direct API).
- **Auto-create task:** Xử lý tại `useCalendarAutoSync.ts`.
- **Dedupe strategy:** Ưu tiên `calendarEventId`, fallback `title + scheduledStartTime`.
- **Force sync:** Xảy ra ngay khi chuyển sang tab Calendar.

### Debug Checklist
- Kiểm tra ENV: `VITE_APPS_SCRIPT_URL`, `VITE_GOOGLE_CALENDAR_API_KEY`, `VITE_CALENDAR_ID_TIT`, `VITE_CALENDAR_ID_TUN`.
- Kiểm tra User Setting: `autoSyncCalendar`.
- Heartbeat stale check: Xem tại `checkTaskStale` trong `helpers.ts`.

## TS Migration — COMPLETED 2026-04-30
- Toàn bộ `src/` đã 100% TypeScript/TSX.
- Chrome Extension và Scriptable widget giữ plain JS theo yêu cầu platform.
````

## File: docs/prompt.md
````markdown
# Prompt cho AI

## Prompt siêu ngắn (copy-paste):
```
Đọc docs/prompt.md và làm theo đó.
```

## Prompt đầy đủ (AI tự đọc file này và làm):
Đọc 2 file sau theo thứ tự trước khi làm bất cứ gì:
1. `docs/GUIDELINES.md` — quy tắc code, TypeScript rules, quality gates
2. `docs/architecture.md` — stack, layout thư mục, runtime flow, sync/debug logic

Sau đó:
- Làm đúng task được yêu cầu, không mở rộng scope.
- Chạy `npm run build` và `npm run lint` sau mỗi thay đổi.
- Cập nhật `docs/architecture.md` nếu đổi contract module/hook/context.
- Báo kết quả ngắn gọn: đã làm gì, kết quả build/lint ra sao.
````

## File: src/components/layout/AppMainContent.tsx
````typescript
import React, { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import TaskForm from '../tasks/TaskForm';
import TaskBoard from '../tasks/TaskBoard.jsx';
import TaskListView from '../tasks/TaskListView.jsx';
import type { Task, UserData, TeamMember, LevelInfo } from '../../utils/helpers';
import type { ShopItem } from '../../utils/constants';
import type { User } from 'firebase/auth';
const CalendarView = lazy(() => import('../calendar/CalendarView'));
const Dashboard = lazy(() => import('./Dashboard'));
interface CalendarViewProps {
  isDark: boolean;
  calendarApiKey: string;
  calendarIdTit: string;
  calendarIdTun: string;
  appsScriptUrl: string;
  tasks: Task[];
  teamMembers: TeamMember[];
  currentAssigneeId: string | null;
  now: number;
  aiLoading: boolean;
  userData: UserData;
  onUpdateSettings: (updates: Partial<UserData>) => void;
}
const CalendarViewTyped = CalendarView as React.ComponentType<CalendarViewProps>;
type DailyQuest = Record<string, any>;
type AIReport = string;
interface AppMainContentProps {
  activeTab: string;
  user: User | null;
  userData: UserData;
  teamMembers: TeamMember[];
  tasks: Task[];
  filteredTasks: Task[];
  aiLoading: boolean;
  currentAssigneeId: string | null;
  now: number;
  calendarApiKey: string;
  calendarIdTit: string;
  calendarIdTun: string;
  appsScriptUrl: string;
  handleUpdateSettings: (updates: Partial<UserData>) => void;
  levelInfo: LevelInfo;
  handleBuyItem: (itemId: string) => void;
  handleUseTicket: (ticketId: string) => void;
  handleSummarize: () => void;
  isSummarizing: boolean;
  aiReport: AIReport;
  triggerSystemFocus: (shortcutName: string) => void;
  handleTabChange: (tab: string) => void;
  dailyQuest: DailyQuest | null;
  handleRefreshDailyQuest: () => void;
  handleRenameMascot: () => void;
  handleChangeMascotAvatar: () => void;
  partnerTask?: Task;
  myRunningTask?: Task;
  onCompleteDailyQuest: () => void;
  toggleTaskStatus: (id: string, action: 'start' | 'pause' | 'complete') => Promise<void>;
  handleDeleteTask: (id: string) => void;
}
interface LazyErrorBoundaryState {
  hasError: boolean;
}
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): LazyErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: Error): void {
    console.error('Lazy chunk render failed:', error);
  }
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-black">
          Không thể tải module giao diện. Vui lòng tải lại trang.
        </div>
      );
    }
    return this.props.children;
  }
}
function AppMainContent({
  activeTab,
  user,
  userData,
  teamMembers,
  tasks,
  filteredTasks,
  aiLoading,
  currentAssigneeId,
  now,
  calendarApiKey,
  calendarIdTit,
  calendarIdTun,
  appsScriptUrl,
  handleUpdateSettings,
  levelInfo,
  handleBuyItem,
  handleUseTicket,
  handleSummarize,
  isSummarizing,
  aiReport,
  triggerSystemFocus,
  handleTabChange,
  dailyQuest,
  handleRefreshDailyQuest,
  handleRenameMascot,
  handleChangeMascotAvatar,
  partnerTask,
  myRunningTask,
  onCompleteDailyQuest,
  toggleTaskStatus,
  handleDeleteTask
}: AppMainContentProps): React.ReactElement {
  return (
    <AnimatePresence mode="wait">
      {activeTab === 'tasks' || activeTab === 'calendar' || activeTab === 'list' ? (
        <div key="main-tasks">
          <div className="animate-in slide-in-from-bottom-8">
            <TaskForm user={user} isDark={userData.isDarkMode} teamMembers={teamMembers} />
          </div>
          {activeTab === 'tasks' && (
            <TaskBoard
              tasks={filteredTasks}
              user={user}
              currentAssigneeId={currentAssigneeId}
              isDark={userData.isDarkMode}
              now={now}
              aiLoading={aiLoading}
            />
          )}
          {activeTab === 'calendar' && (
            <LazyErrorBoundary>
              <Suspense
                fallback={
                  <div className="p-6 text-xs font-black text-slate-400">Đang tải Calendar...</div>
                }
              >
                <CalendarViewTyped
                  isDark={userData.isDarkMode}
                  calendarApiKey={calendarApiKey}
                  calendarIdTit={calendarIdTit}
                  calendarIdTun={calendarIdTun}
                  appsScriptUrl={appsScriptUrl}
                  tasks={tasks}
                  teamMembers={teamMembers}
                  currentAssigneeId={currentAssigneeId}
                  now={now}
                  aiLoading={aiLoading}
                  userData={userData}
                  onUpdateSettings={handleUpdateSettings}
                />
              </Suspense>
            </LazyErrorBoundary>
          )}
          {activeTab === 'list' && (
            <TaskListView
              tasks={filteredTasks}
              user={user}
              currentAssigneeId={currentAssigneeId}
              isDark={userData.isDarkMode}
              now={now}
              onStart={(id: string) => toggleTaskStatus(id, 'start')}
              onPause={(id: string) => toggleTaskStatus(id, 'pause')}
              onComplete={(id: string) => toggleTaskStatus(id, 'complete')}
              onDelete={handleDeleteTask}
            />
          )}
        </div>
      ) : (
        <div key={activeTab}>
          <LazyErrorBoundary>
            <Suspense
              fallback={
                <div className="p-6 text-xs font-black text-slate-400">Đang tải dashboard...</div>
              }
            >
              <Dashboard
                view={activeTab}
                tasks={tasks}
                isDark={userData.isDarkMode}
                teamMembers={teamMembers}
                userData={userData}
                levelInfo={levelInfo}
                onBuyItem={handleBuyItem}
                onUseTicket={handleUseTicket}
                onSummarize={handleSummarize}
                isSummarizing={isSummarizing}
                aiReport={aiReport}
                onUpdateSettings={handleUpdateSettings}
                triggerSystemFocus={triggerSystemFocus}
                onTabChange={handleTabChange}
                dailyQuest={dailyQuest}
                onRefreshDailyQuest={handleRefreshDailyQuest}
                onCompleteDailyQuest={onCompleteDailyQuest}
                currentTab={activeTab}
                onRenameMascot={handleRenameMascot}
                onChangeMascotAvatar={handleChangeMascotAvatar}
                partnerTask={partnerTask}
                myRunningTask={myRunningTask}
                now={now}
              />
            </Suspense>
          </LazyErrorBoundary>
        </div>
      )}
    </AnimatePresence>
  );
}
export default React.memo(AppMainContent);
````

## File: src/hooks/useUserStats.ts
````typescript
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import * as userService from '../services/userService';
import {
  getAssigneeIdByEmail, calculateLevel, TeamMember, UserData
} from '../utils/helpers';
import {
  DEFAULT_AVATARS, BOOSTER_DURATIONS, GOLD_PER_TASK, GOLD_PER_SUBTASK,
  DAILY_CHECKIN_GOLD, XP_PER_TASK, DAILY_CHECKIN_XP,
  XP_PER_SUBTASK, SHOP_ITEMS, ShopItem
} from '../utils/constants';
import { useAppStore, defaultUserData } from '../store/useAppStore';
type UserStatsUpdates = Partial<UserData> & Record<string, unknown>;
const DEFAULT_SHORTCUT_NAME = 'Làm việc';
type AssigneeKey = 'tit' | 'tun';
type BoosterType = keyof typeof BOOSTER_DURATIONS;
const isAssigneeKey = (value: string | null): value is AssigneeKey => value === 'tit' || value === 'tun';
const isBoosterType = (value: unknown): value is BoosterType => value === 'xp' || value === 'gold';
const getDefaultAvatarByEmail = (email: string | null | undefined, fallbackSeed?: string) => {
  const assigneeId = getAssigneeIdByEmail(email);
  if (isAssigneeKey(assigneeId)) return DEFAULT_AVATARS[assigneeId];
  return { seed: fallbackSeed };
};
const ignoreAsyncError = () => undefined;
export function useUserStats(user: User | null) {
  const userData = useAppStore((state) => state.userData);
  const setUserData = useAppStore((state) => state.setUserData);
  const patchUserData = useAppStore((state) => state.patchUserData);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  useEffect(() => {
    if (!user || user.uid === "local-user-test") return;
    const unsubscribe = userService.subscribeToUserStats(user.uid, async (data: UserData | null) => {
      if (data) {
        let needsUpdate = false;
        const updates: UserStatsUpdates = {};
        if (data.streakFreezes === undefined) { updates.streakFreezes = 3; needsUpdate = true; }
        if (data.unlockedBadgeIds === undefined) { updates.unlockedBadgeIds = []; updates.lastSeenLevel = data.level || 1; needsUpdate = true; }
        if (data.avatarConfig === undefined || (data.avatarConfig as Record<string, unknown>)?.avatarVersion !== 8) {
          updates.avatarConfig = getDefaultAvatarByEmail(user.email ?? undefined, user.displayName ?? undefined);
          needsUpdate = true;
        }
        if (data.ttGold === undefined) { updates.ttGold = 0; needsUpdate = true; }
        if (data.ticketHistory === undefined) { updates.ticketHistory = []; needsUpdate = true; }
        if (data.checkInHistory === undefined) { updates.checkInHistory = {}; needsUpdate = true; }
        if (data.mascotName === undefined) { updates.mascotName = 'Mochi'; needsUpdate = true; }
        if (data.mascotAvatar === undefined) { updates.mascotAvatar = '🤖'; needsUpdate = true; }
        if (needsUpdate) {
          userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
        }
        patchUserData({ ...data, ...updates, isLoaded: true });
      } else {
        const currentMember = teamMembers.find(m => m.uid === user.uid);
        const initial = {
          ...defaultUserData,
          level: currentMember?.level || 1,
          streak: currentMember?.streak || 0,
          streakFreezes: currentMember?.streakFreezes !== undefined ? currentMember.streakFreezes : 3,
          xp: currentMember?.xp || 0,
          ttGold: currentMember?.ttGold || 0,
          isDarkMode: false,
          unlockedBadgeIds: [], lastSeenLevel: 1, ownedItemIds: [], aiMode: 'cute',
          ticketHistory: [], checkInHistory: {}, autoFocusShortcut: true,
          shortcutName: DEFAULT_SHORTCUT_NAME, offShortcutName: '', defaultView: 'tasks',
          calendarVisibility: { tit: true, tun: true },
          avatarConfig: getDefaultAvatarByEmail(user?.email ?? undefined, user?.displayName ?? undefined)
        };
        userService.initializeUserStats(user.uid, initial).catch(ignoreAsyncError);
        patchUserData({ ...initial, isLoaded: true });
      }
    });
    return () => unsubscribe();
  }, [user, patchUserData, user?.email, user?.displayName]);
  useEffect(() => {
    if (!user || user.uid === "local-user-test") return;
    const un = userService.subscribeToTeamMembers((members) => {
      setTeamMembers(members);
      const currentMember = members.find(m => m.uid === user.uid);
      if (currentMember) {
        const isTit = user.email?.toLowerCase().includes('dinhthai');
        const correctFreezes = isTit
          ? Math.max(currentMember.streakFreezes || 0, 3)
          : (currentMember.streakFreezes || 0);
        patchUserData({
          streak: currentMember.streak,
          xp: currentMember.xp,
          level: currentMember.level,
          ttGold: currentMember.ttGold,
          streakFreezes: correctFreezes,
          lastCheckIn: currentMember.lastCheckIn
        });
        if (correctFreezes !== (currentMember.streakFreezes || 0)) {
          userService.updateTeamMemberActive(user.uid, { streakFreezes: correctFreezes }).catch(ignoreAsyncError);
          userService.updateUserStats(user.uid, { streakFreezes: correctFreezes }).catch(ignoreAsyncError);
        }
      }
    });
    return () => un();
  }, [user, patchUserData]);
  useEffect(() => {
    if (!user || user.uid === "local-user-test" || user.isAnonymous) return;
    const updateActive = async () => {
      try {
        await userService.updateTeamMemberActive(user.uid, {
          photoURL: undefined,
          streak: userData.streak || 0,
          xp: userData.xp || 0,
          level: userData.level || 1,
          ttGold: userData.ttGold || 0,
          streakFreezes: userData.streakFreezes || 0
        });
      } catch {
        ignoreAsyncError();
      }
    };
    updateActive();
    const interval = setInterval(updateActive, 20000);
    return () => clearInterval(interval);
  }, [user, userData.ownedItemIds, userData.avatarConfig, userData.streak, userData.xp, userData.level, userData.ttGold, userData.streakFreezes]);
  useEffect(() => {
    if (!userData.activeBooster) return;
    const interval = setInterval(() => {
      if (userData.activeBooster && Date.now() > userData.activeBooster.expiresAt) {
        const updates = { activeBooster: null };
        patchUserData(updates);
        if (user && user.uid !== 'local-user-test') {
          userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [userData.activeBooster, user, patchUserData]);
  const handleUpdateSettings = async (updates: UserStatsUpdates) => {
    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };
  const handleBuyItem = async (itemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if ((userData.ttGold || 0) < item.price) {
      alert("Bạn không đủ TT Gold để mua vật phẩm này! Hãy chăm chỉ làm việc thêm nhé.");
      return;
    }
    const currentLevel = calculateLevel(userData.xp || 0).level;
    if (currentLevel < (item.minLevel || 1)) {
      alert(`Bạn cần đạt Level ${item.minLevel} để mua vật phẩm này!`);
      return;
    }
    let updates: UserStatsUpdates = { ttGold: (userData.ttGold || 0) - item.price };
    if (item.id === 'freeze') updates.streakFreezes = (userData.streakFreezes || 0) + 1;
    else if (item.type === 'booster') {
      const boosterType = item.boosterType as unknown;
      const durationMs = isBoosterType(boosterType) ? BOOSTER_DURATIONS[boosterType] : 0;
      updates.activeBooster = { id: item.id, multiplier: item.multiplier ?? 1, boosterType: item.boosterType ?? '', expiresAt: Date.now() + durationMs };
    } else {
      if (userData.ownedItemIds?.includes(item.id) && item.type !== 'ticket') {
        alert("Bạn đã sở hữu vật phẩm này rồi!");
        return;
      }
      updates.ownedItemIds = [...(userData.ownedItemIds || []), item.id];
    }
    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };
  const handleUseTicket = async (ticketId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === ticketId);
    if (!item || !userData.ownedItemIds?.includes(ticketId)) return;
    if (!window.confirm(`Bạn muốn sử dụng "${item.name}" ngay bây giờ?`)) return;
    const newOwned = [...userData.ownedItemIds];
    newOwned.splice(newOwned.indexOf(ticketId), 1);
    const updates = {
      ownedItemIds: newOwned,
      ticketHistory: [...(userData.ticketHistory || []), { id: crypto.randomUUID(), ticketId, name: item.name, usedAt: Date.now(), user: user?.displayName || "Thành viên" }]
    };
    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
    alert(`Đã kích hoạt ${item.name}! Hãy tận hưởng nhé ✨`);
  };
  const handleEquipItem = async (category: string, val: unknown) => {
    const updates = { avatarConfig: { ...(userData.avatarConfig || {}), [category]: val } };
    patchUserData(updates);
    if (user && user.uid !== 'local-user-test') userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };
  const awardTaskRewards = async (isLate: boolean) => {
    if (!user || user.uid === 'local-user-test') return;
    try {
      const today = new Date().toDateString();
      let xpEarned = isLate ? Math.floor(XP_PER_TASK / 2) : XP_PER_TASK;
      let statsUpdates: UserStatsUpdates = { xp: (userData.xp || 0) + xpEarned };
      if (userData.lastCheckIn !== today) {
        xpEarned += DAILY_CHECKIN_XP;
        statsUpdates.lastCheckIn = today;
        statsUpdates.ttGold = (userData.ttGold || 0) + DAILY_CHECKIN_GOLD;
        const checkInHistory = { ...(userData.checkInHistory || {}) };
        checkInHistory[today] = 'active';
        statsUpdates.checkInHistory = checkInHistory;
        if (userData.lastCheckIn) {
          const lastDate = new Date(userData.lastCheckIn);
          lastDate.setHours(0,0,0,0);
          const currentDate = new Date();
          currentDate.setHours(0,0,0,0);
          const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / 86400000);
          if (diffDays === 1) {
            statsUpdates.streak = (userData.streak || 0) + 1;
          } else if (diffDays > 1 && (userData.streakFreezes || 0) >= diffDays - 1) {
            statsUpdates.streak = (userData.streak || 0) + 1;
            statsUpdates.streakFreezes = (userData.streakFreezes || 0) - (diffDays - 1);
            for (let i = 1; i < diffDays; i++) {
              const freezeDate = new Date(currentDate.getTime() - i * 86400000).toDateString();
              checkInHistory[freezeDate] = 'freeze';
            }
          } else if (diffDays > 0) {
            statsUpdates.streak = 1;
          }
        } else {
          statsUpdates.streak = 1;
        }
      }
      let goldEarned = GOLD_PER_TASK;
      if (userData.activeBooster) {
        if (userData.activeBooster.boosterType === 'xp') xpEarned *= userData.activeBooster.multiplier;
        else if (userData.activeBooster.boosterType === 'gold') goldEarned *= userData.activeBooster.multiplier;
      }
      const finalXp = (statsUpdates.xp !== undefined ? statsUpdates.xp : (userData.xp || 0)) + Math.round(xpEarned);
      const finalGold = (statsUpdates.ttGold !== undefined ? statsUpdates.ttGold : (userData.ttGold || 0)) + Math.round(goldEarned);
      statsUpdates.xp = finalXp;
      statsUpdates.ttGold = finalGold;
      statsUpdates.level = calculateLevel(finalXp).level;
      patchUserData(statsUpdates);
      await userService.updateUserStats(user.uid, statsUpdates);
    } catch (e) {
      console.warn('Award rewards failed', e);
    }
  };
  const awardSubTaskRewards = async () => {
    if (!user || user.uid === 'local-user-test') return;
    let xpG = XP_PER_SUBTASK;
    let goldG = GOLD_PER_SUBTASK;
    if (userData.activeBooster) {
      if (userData.activeBooster.boosterType === 'xp') xpG *= userData.activeBooster.multiplier;
      else if (userData.activeBooster.boosterType === 'gold') goldG *= userData.activeBooster.multiplier;
    }
    const updates = {
      xp: (userData.xp || 0) + Math.round(xpG),
      ttGold: (userData.ttGold || 0) + Math.round(goldG)
    };
    patchUserData(updates);
    userService.updateUserStats(user.uid, updates).catch(ignoreAsyncError);
  };
  return {
    userData,
    setUserData,
    teamMembers,
    handleBuyItem,
    handleUseTicket,
    handleEquipItem,
    handleUpdateSettings,
    awardTaskRewards,
    awardSubTaskRewards
  };
}
````

## File: .gitignore
````
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Temporary AI/context artifacts
tmp/

# Firebase admin key (local only)
service-account*.json
*.service-account.json

.env

.firebase
````
