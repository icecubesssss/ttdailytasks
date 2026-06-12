// TT Daily Task Widget v7.0 — small / medium / large / extraLarge
// Widget Parameter: "tit" hoac "tun" (default: tit)
//
// v7.0:
//  - Data dung nguon chuan (Apps Script doc profile/stats thay vi team_members)
//  - Cache-busting moi lan fetch -> het canh widget hien so cu
//  - Cache offline: mat mang van hien du lieu lan cuoi (kem nhan OFFLINE)
//  - Task duoc sort theo lich hom nay -> "task tiep theo" luon dung
//  - Thanh tien do hoan thanh hom nay + giao dien gradient moi

var APP  = "https://tt-daily-task.web.app/";
var BASE = "https://firestore.googleapis.com/v1/projects/tt-daily-task/databases/(default)/documents/";
var AID  = "tt-daily-task";
var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYIP70rPBMD82EdKXOLFAf-ufCZ6iptvpgv9ODHOalM7J6FO-SZgWpoE_f5qygpWuH/exec";

var USERS = {
  "tit": { uid: "XR4Z15wXvrgoY68XKPcEzDfhbBz1", shortName: "TIT", color: "#7dd3fc" },
  "tun": { uid: "DnvU6r5jGBZu9oKBQpaummXtId93", shortName: "TUN", color: "#fcd34d" }
};

var param = (args.widgetParameter || "tit").toLowerCase().trim();
var ME = USERS[param] || USERS["tit"];

function widgetFamily() {
  if (config.runsInWidget && config.widgetFamily) return config.widgetFamily;
  return "small";
}

function isSmallFamily(f) {
  return f === "small" || f === "accessoryCircular" || f === "accessoryInline" || f === "accessoryRectangular";
}

function isLargeFamily(f) {
  return f === "large" || f === "extraLarge";
}

// --- Time helpers ---
function pad2(n) { return (n < 10 ? "0" : "") + n; }

function fmtClock(d) { return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }

function fmtTime(ms) { return fmtClock(new Date(ms)); }

function fmtDateShort() {
  var d = new Date();
  var dows = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return dows[d.getDay()] + " " + pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1);
}

function isToday(ms) {
  if (!ms) return false;
  var d = new Date(ms), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

// --- Data helpers (ho tro ca payload JSON thuong lan Firestore REST doc) ---
function fv(doc, field, type) {
  if (doc && doc[field] !== undefined && doc[field] !== null) {
    if (type === "integerValue" || type === "doubleValue") return String(doc[field]);
    if (type === "booleanValue") return Boolean(doc[field]);
    return doc[field];
  }
  if (!doc || !doc.fields || !doc.fields[field]) return null;
  if (type === "booleanValue") return doc.fields[field][type] === true;
  return doc.fields[field][type] || null;
}

function getNum(doc, field) {
  if (!doc) return 0;
  if (typeof doc[field] === "number") return doc[field];
  if (typeof doc[field] === "string" && doc[field] !== "") return parseInt(doc[field], 10) || 0;
  var sv = fv(doc, field, "integerValue") || fv(doc, field, "doubleValue");
  return sv ? parseInt(sv, 10) : 0;
}

function extractStats(doc) {
  return {
    streak: getNum(doc, "streak"),
    level: getNum(doc, "level"),
    xp: getNum(doc, "xp"),
    ttGold: getNum(doc, "ttGold"),
    freezes: getNum(doc, "streakFreezes")
  };
}

function getDocId(doc) {
  if (doc && doc.id) return doc.id;
  if (doc && doc.name) return doc.name.split("/").pop();
  return "";
}

function parseTask(t) {
  return {
    id: getDocId(t),
    title: fv(t, "title", "stringValue") || "Task",
    status: fv(t, "status", "stringValue") || "idle",
    currentWorker: fv(t, "currentWorker", "stringValue"),
    assigneeId: fv(t, "assigneeId", "stringValue"),
    scheduledStartTime: getNum(t, "scheduledStartTime"),
    scheduledEndTime: getNum(t, "scheduledEndTime"),
    deadline: getNum(t, "deadline"),
    createdAt: getNum(t, "createdAt"),
    isDone: fv(t, "isDone", "booleanValue") === true
  };
}

function isMine(t, uid, legacyId) {
  return !t.assigneeId || t.assigneeId === uid || t.assigneeId === legacyId;
}

function isCompleted(t) {
  return t.isDone || t.status === "completed" || t.status === "completed_late";
}

// Xep hang: viec co lich HOM NAY truoc, roi viec khong lich, roi viec ngay khac
function taskRank(t) {
  if (t.scheduledStartTime && isToday(t.scheduledStartTime)) return 0;
  if (!t.scheduledStartTime) return 1;
  return 2;
}

function taskSortKey(t) {
  return t.scheduledStartTime || t.deadline || t.createdAt || 9e15;
}

function buildModel(rawTasks, statsDoc, uid, legacyId) {
  var tasks = [];
  for (var i = 0; i < rawTasks.length; i++) tasks.push(parseTask(rawTasks[i]));

  var running = null;
  var idle = [];
  var todayTotal = 0, todayDone = 0;

  for (var j = 0; j < tasks.length; j++) {
    var t = tasks[j];
    if (t.status === "running" && t.currentWorker === uid) running = t;
    if (!isMine(t, uid, legacyId)) continue;
    if (t.status === "idle") idle.push(t);

    var belongsToday = isToday(t.scheduledStartTime) || isToday(t.deadline) ||
      (!t.scheduledStartTime && !t.deadline && isToday(t.createdAt));
    if (belongsToday) {
      todayTotal++;
      if (isCompleted(t)) todayDone++;
    }
  }

  idle.sort(function (a, b) {
    var r = taskRank(a) - taskRank(b);
    if (r !== 0) return r;
    return taskSortKey(a) - taskSortKey(b);
  });

  return {
    stats: extractStats(statsDoc),
    running: running,
    next: running ? null : (idle[0] || null),
    idle: idle,
    todayTotal: todayTotal,
    todayDone: todayDone
  };
}

// --- Theme ---
function getTheme() {
  var h = new Date().getHours();
  if (h >= 5 && h < 12)  return { name: "morning", colors: ["#C33764", "#1D2671"] };
  if (h >= 12 && h < 18) return { name: "afternoon", colors: ["#0F2027", "#203A43", "#2C5364"] };
  if (h >= 18 && h < 22) return { name: "evening", colors: ["#AD5389", "#3C1053"] };
  return                        { name: "night", colors: ["#000428", "#004E92"] };
}

function sfSymbol(name) {
  try {
    var sym = SFSymbol.named(name);
    if (sym) return sym.image;
  } catch (e) {}
  return SFSymbol.named("circle.fill").image;
}

// Thanh tien do bo goc ve bang DrawContext -> luon sac net
function progressBarImage(width, height, ratio, fgHex, bgHex) {
  var ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  var bgPath = new Path();
  bgPath.addRoundedRect(new Rect(0, 0, width, height), height / 2, height / 2);
  ctx.addPath(bgPath);
  ctx.setFillColor(new Color(bgHex, 0.25));
  ctx.fillPath();

  var r = Math.min(1, Math.max(0, ratio));
  if (r > 0) {
    var w = Math.max(height, width * r);
    var fgPath = new Path();
    fgPath.addRoundedRect(new Rect(0, 0, w, height), height / 2, height / 2);
    ctx.addPath(fgPath);
    ctx.setFillColor(new Color(fgHex));
    ctx.fillPath();
  }
  return ctx.getImage();
}

// --- UI primitives ---
function createWidget(family) {
  var theme = getTheme();
  var w = new ListWidget();
  var gr = new LinearGradient();
  gr.colors = theme.colors.map(function (c) { return new Color(c); });
  gr.locations = theme.colors.map(function (_, i) { return i / (theme.colors.length - 1); });
  gr.startPoint = new Point(0, 0);
  gr.endPoint = new Point(1, 1);
  w.backgroundGradient = gr;
  w.spacing = 4;

  if (isSmallFamily(family)) w.setPadding(10, 12, 10, 12);
  else if (isLargeFamily(family)) w.setPadding(14, 16, 12, 16);
  else w.setPadding(12, 16, 12, 16);

  return w;
}

function addHeader(parent, compact, offline) {
  var hdr = parent.addStack();
  hdr.layoutHorizontally();
  hdr.centerAlignContent();

  var chip = hdr.addStack();
  chip.backgroundColor = new Color(ME.color, 0.22);
  chip.cornerRadius = compact ? 6 : 7;
  chip.setPadding(2, compact ? 5 : 7, 2, compact ? 5 : 7);
  var nameT = chip.addText(ME.shortName);
  nameT.font = Font.blackSystemFont(compact ? 9 : 11);
  nameT.textColor = new Color(ME.color);

  if (offline) {
    hdr.addSpacer(5);
    var off = hdr.addStack();
    off.backgroundColor = new Color("#ef4444", 0.3);
    off.cornerRadius = compact ? 6 : 7;
    off.setPadding(2, 5, 2, 5);
    var offT = off.addText("OFFLINE");
    offT.font = Font.blackSystemFont(compact ? 7 : 8);
    offT.textColor = new Color("#fecaca");
  }

  hdr.addSpacer();
  var timeT = hdr.addText(compact ? fmtClock(new Date()) : fmtDateShort() + " · " + fmtClock(new Date()));
  timeT.font = Font.mediumSystemFont(compact ? 9 : 10);
  timeT.textColor = new Color("#ffffff", 0.5);
}

function addStreakBlock(parent, stats, compact) {
  var row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  var iconSz = compact ? 20 : 28;
  var numSz  = compact ? 30 : 38;

  var fire = row.addImage(sfSymbol("flame.fill"));
  fire.imageSize = new Size(iconSz, iconSz);
  fire.tintColor = new Color(stats.streak > 0 ? "#fb923c" : "#94a3b8");
  row.addSpacer(compact ? 4 : 7);

  var col = row.addStack();
  col.layoutVertically();

  var num = col.addText(String(stats.streak));
  num.font = Font.blackRoundedSystemFont(numSz);
  num.textColor = Color.white();
  num.shadowColor = new Color("#000000", 0.35);
  num.shadowRadius = 3;
  num.shadowOffset = new Point(0, 2);
  num.lineLimit = 1;
  num.minimumScaleFactor = 0.6;

  var sub = col.addText("NGAY STREAK");
  sub.font = Font.boldSystemFont(compact ? 7 : 8);
  sub.textColor = new Color("#ffffff", 0.45);
  sub.lineLimit = 1;
}

function addProgressBlock(parent, model, barWidth, compact) {
  if (model.todayTotal <= 0) return;
  var ratio = model.todayDone / model.todayTotal;

  var row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  var bar = row.addImage(progressBarImage(barWidth, compact ? 5 : 6, ratio, ratio >= 1 ? "#4ade80" : ME.color, "#ffffff"));
  bar.imageSize = new Size(barWidth, compact ? 5 : 6);
  row.addSpacer(6);

  var lbl = row.addText(model.todayDone + "/" + model.todayTotal);
  lbl.font = Font.boldRoundedSystemFont(compact ? 9 : 10);
  lbl.textColor = new Color("#ffffff", 0.75);
  lbl.lineLimit = 1;
}

function addActionRow(parent, opts, allowChildUrl) {
  var row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.backgroundColor = new Color(opts.bg || "#ffffff", opts.bgOpacity != null ? opts.bgOpacity : 1);
  row.cornerRadius = opts.radius || 10;
  row.setPadding(opts.padV || 8, opts.padH || 10, opts.padV || 8, opts.padH || 10);
  if (opts.url && allowChildUrl) row.url = opts.url;

  if (opts.icon) {
    var ico = row.addImage(sfSymbol(opts.icon));
    ico.imageSize = new Size(opts.iconSize || 12, opts.iconSize || 12);
    ico.tintColor = new Color(opts.iconColor || "#ffffff");
    row.addSpacer(6);
  }

  var txt = row.addText(opts.text);
  txt.font = opts.font || Font.semiboldSystemFont(11);
  txt.textColor = new Color(opts.textColor || "#ffffff");
  txt.lineLimit = opts.lines || 1;

  if (opts.trailing) {
    row.addSpacer();
    var tr = row.addText(opts.trailing);
    tr.font = Font.boldRoundedSystemFont(9);
    tr.textColor = new Color("#ffffff", 0.65);
    tr.lineLimit = 1;
  }
}

function addStatPill(parent, icon, label, value, color) {
  var pill = parent.addStack();
  pill.layoutVertically();
  pill.centerAlignContent();
  pill.backgroundColor = new Color("#ffffff", 0.1);
  pill.cornerRadius = 9;
  pill.setPadding(6, 5, 6, 5);

  var top = pill.addStack();
  top.layoutHorizontally();
  top.centerAlignContent();
  var ico = top.addImage(sfSymbol(icon));
  ico.imageSize = new Size(10, 10);
  ico.tintColor = new Color(color);
  top.addSpacer(3);
  var val = top.addText(String(value));
  val.font = Font.blackRoundedSystemFont(13);
  val.textColor = Color.white();
  val.lineLimit = 1;
  val.minimumScaleFactor = 0.7;

  var lbl = pill.addText(label);
  lbl.font = Font.boldSystemFont(7);
  lbl.textColor = new Color("#ffffff", 0.45);
  lbl.lineLimit = 1;
}

function addTaskLine(parent, task, allowChildUrl) {
  var row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  if (allowChildUrl) row.url = APP + "?taskId=" + task.id + "&action=start";

  var dot = row.addImage(sfSymbol("circle.fill"));
  dot.imageSize = new Size(5, 5);
  dot.tintColor = new Color(ME.color, 0.9);
  row.addSpacer(6);

  var lbl = row.addText(task.title);
  lbl.font = Font.regularSystemFont(11);
  lbl.textColor = new Color("#ffffff", 0.85);
  lbl.lineLimit = 1;

  if (task.scheduledStartTime && isToday(task.scheduledStartTime)) {
    row.addSpacer();
    var tm = row.addText(fmtTime(task.scheduledStartTime));
    tm.font = Font.boldRoundedSystemFont(9);
    tm.textColor = new Color("#ffffff", 0.5);
    tm.lineLimit = 1;
  }
}

function nextTaskTrailing(t) {
  return t.scheduledStartTime && isToday(t.scheduledStartTime) ? fmtTime(t.scheduledStartTime) : null;
}

// --- Layouts ---
function buildSmall(w, model, offline) {
  addHeader(w, true, offline);
  w.addSpacer(2);
  addStreakBlock(w, model.stats, true);
  addProgressBlock(w, model, 86, true);
  w.addSpacer(4);

  if (model.running) {
    w.url = APP + "?taskId=" + model.running.id + "&action=complete";
    addActionRow(w, {
      bg: "#10b981", icon: "checkmark.circle.fill",
      text: model.running.title, font: Font.boldSystemFont(11), padV: 7, padH: 8, iconSize: 11
    }, false);
  } else if (model.next) {
    w.url = APP + "?taskId=" + model.next.id + "&action=start";
    addActionRow(w, {
      bg: "#6366f1", icon: "play.fill",
      text: model.next.title, font: Font.boldSystemFont(11), padV: 7, padH: 8, iconSize: 10
    }, false);
  } else {
    w.url = APP;
    addActionRow(w, {
      bg: "#ffffff", bgOpacity: 0.1, text: "Het viec! Nghi ngoi thoi",
      font: Font.italicSystemFont(10), textColor: "#ffffff", padV: 7, padH: 8
    }, false);
  }
}

function buildMedium(w, model, offline) {
  addHeader(w, false, offline);
  w.addSpacer(6);

  var body = w.addStack();
  body.layoutHorizontally();
  body.centerAlignContent();

  var left = body.addStack();
  left.layoutVertically();
  left.size = new Size(110, 0);
  addStreakBlock(left, model.stats, false);
  left.addSpacer(4);
  addProgressBlock(left, model, 76, true);

  body.addSpacer(10);

  var right = body.addStack();
  right.layoutVertically();

  var pills = right.addStack();
  pills.layoutHorizontally();
  addStatPill(pills, "star.fill", "LEVEL", model.stats.level, "#fbbf24");
  pills.addSpacer(5);
  addStatPill(pills, "dollarsign.circle.fill", "GOLD", model.stats.ttGold, "#fcd34d");
  pills.addSpacer(5);
  addStatPill(pills, "snowflake", "FREEZE", model.stats.freezes, "#93c5fd");
  right.addSpacer(6);

  if (model.running) {
    addActionRow(right, {
      bg: "#10b981", icon: "checkmark.circle.fill",
      text: model.running.title, font: Font.boldSystemFont(11), padV: 7, padH: 8,
      url: APP + "?taskId=" + model.running.id + "&action=complete"
    }, true);
  } else if (model.next) {
    addActionRow(right, {
      bg: "#6366f1", icon: "play.fill",
      text: model.next.title, font: Font.boldSystemFont(11), padV: 8, padH: 10,
      trailing: nextTaskTrailing(model.next),
      url: APP + "?taskId=" + model.next.id + "&action=start"
    }, true);
  } else {
    addActionRow(right, {
      bg: "#ffffff", bgOpacity: 0.1,
      text: "Het viec! Nghi ngoi thoi", font: Font.italicSystemFont(11),
      textColor: "#ffffff", padV: 8, padH: 10, url: APP
    }, true);
  }

  w.url = APP + "?filter=" + param;
}

function buildLarge(w, model, offline) {
  addHeader(w, false, offline);
  w.addSpacer(8);

  var statsRow = w.addStack();
  statsRow.layoutHorizontally();
  statsRow.centerAlignContent();
  addStatPill(statsRow, "flame.fill", "STREAK", model.stats.streak, "#fb923c");
  statsRow.addSpacer(6);
  addStatPill(statsRow, "star.fill", "LEVEL", model.stats.level, "#fbbf24");
  statsRow.addSpacer(6);
  addStatPill(statsRow, "dollarsign.circle.fill", "GOLD", model.stats.ttGold, "#fcd34d");
  statsRow.addSpacer(6);
  addStatPill(statsRow, "snowflake", "FREEZE", model.stats.freezes, "#93c5fd");

  w.addSpacer(8);
  addProgressBlock(w, model, 250, false);
  w.addSpacer(8);

  if (model.running) {
    var runLbl = w.addText("DANG LAM");
    runLbl.font = Font.blackSystemFont(9);
    runLbl.textColor = new Color("#4ade80");
    w.addSpacer(4);
    addActionRow(w, {
      bg: "#ffffff", bgOpacity: 0.12, icon: "play.circle.fill", iconColor: "#4ade80",
      text: model.running.title, font: Font.boldSystemFont(12), padV: 8, padH: 10
    }, true);
    addActionRow(w, {
      bg: "#10b981", icon: "checkmark.circle.fill",
      text: "Hoan thanh task", font: Font.boldSystemFont(11), padV: 8, padH: 10,
      url: APP + "?taskId=" + model.running.id + "&action=complete"
    }, true);
    w.addSpacer(8);
  }

  var queueLbl = w.addText(model.running ? "TIEP THEO" : "VIEC CAN LAM");
  queueLbl.font = Font.blackSystemFont(9);
  queueLbl.textColor = new Color("#ffffff", 0.45);
  w.addSpacer(4);

  var shown = 0;
  if (!model.running && model.next) {
    addActionRow(w, {
      bg: "#6366f1", icon: "play.fill",
      text: model.next.title, font: Font.boldSystemFont(12), padV: 8, padH: 10,
      trailing: nextTaskTrailing(model.next),
      url: APP + "?taskId=" + model.next.id + "&action=start"
    }, true);
    shown = 1;
  }

  var maxLines = model.running ? 3 : 4;
  for (var i = shown; i < model.idle.length && i < maxLines; i++) {
    addTaskLine(w, model.idle[i], true);
    if (i < maxLines - 1) w.addSpacer(3);
  }

  if (!model.running && !model.next && model.idle.length === 0) {
    addActionRow(w, {
      bg: "#ffffff", bgOpacity: 0.1,
      text: "Het viec! Nghi ngoi thoi", font: Font.italicSystemFont(12),
      textColor: "#ffffff", padV: 10, padH: 12, url: APP
    }, true);
  }

  w.addSpacer();
  w.url = APP + "?filter=" + param;
}

function buildWidget(model, offline) {
  var family = widgetFamily();
  var w = createWidget(family);

  try {
    if (isLargeFamily(family)) buildLarge(w, model, offline);
    else if (family === "medium") buildMedium(w, model, offline);
    else buildSmall(w, model, offline);
  } catch (err) {
    w = createWidget("small");
    buildSmall(w, model, offline);
  }

  w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);
  Script.setWidget(w);
  Script.complete();

  if (!config.runsInWidget) {
    if (family === "medium") w.presentMedium();
    else if (isLargeFamily(family)) w.presentLarge();
    else w.presentSmall();
  }
}

// --- Cache offline ---
function cachePath() {
  var fm = FileManager.local();
  return fm.joinPath(fm.documentsDirectory(), "tt-widget-cache-" + param + ".json");
}

function saveCache(payload) {
  try {
    var fm = FileManager.local();
    fm.writeString(cachePath(), JSON.stringify({ ts: Date.now(), payload: payload }));
  } catch (e) {}
}

function loadCache() {
  try {
    var fm = FileManager.local();
    var p = cachePath();
    if (!fm.fileExists(p)) return null;
    var data = JSON.parse(fm.readString(p));
    return data && data.payload ? data.payload : null;
  } catch (e) {
    return null;
  }
}

// --- Network ---
async function fetchJSON(url) {
  try {
    var r = new Request(url);
    r.timeoutInterval = 15;
    var data = await r.loadJSON();
    if (data && !data.error) return data;
  } catch (e) {}
  return null;
}

async function run() {
  var statsDoc = null;
  var taskDocs = [];
  var offline = false;

  // 1) Nguon chinh: Apps Script (stats tu profile/stats + task list da loc)
  // statsOk === false nghia la server khong doc duoc stats (vd quota 429) -> bo qua, dung cache
  if (APPS_SCRIPT_URL) {
    var data = await fetchJSON(
      APPS_SCRIPT_URL + "?mode=widget&user=" + encodeURIComponent(param) + "&_=" + Date.now()
    );
    if (data && data.stats && data.statsOk !== false) {
      statsDoc = data.stats;
      taskDocs = data.tasks || [];
      saveCache(data);
    }
  }

  // 2) Fallback: doc truc tiep Firestore REST (khong can auth voi data public)
  if (!statsDoc) {
    statsDoc = await fetchJSON(BASE + "artifacts/" + AID + "/public/data/team_members/" + ME.uid);
  }
  if (!taskDocs.length) {
    var raw = await fetchJSON(BASE + "artifacts/" + AID + "/public/data/tasks?pageSize=300");
    if (raw && raw.documents) taskDocs = raw.documents;
  }

  // Fallback thanh cong -> van luu cache de lan sau mat mang con data
  if (statsDoc && !offline) {
    saveCache({ stats: statsDoc, tasks: taskDocs });
  }

  // 3) Fallback cuoi: cache offline cua lan fetch thanh cong gan nhat
  if (!statsDoc) {
    var cached = loadCache();
    if (cached && cached.stats) {
      statsDoc = cached.stats;
      taskDocs = cached.tasks || [];
      offline = true;
    }
  }

  var model = buildModel(taskDocs, statsDoc, ME.uid, param);
  buildWidget(model, offline);
}

await run();
