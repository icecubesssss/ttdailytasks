// TT Daily Task Widget v6.1 — adaptive small / medium / large / extraLarge
// Widget Parameter: "tit" hoac "tun" (default: tit)

var APP  = "https://tt-daily-task.web.app/";
var BASE = "https://firestore.googleapis.com/v1/projects/tt-daily-task/databases/(default)/documents/";
var AID  = "tt-daily-task";
var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYIP70rPBMD82EdKXOLFAf-ufCZ6iptvpgv9ODHOalM7J6FO-SZgWpoE_f5qygpWuH/exec";

var USERS = {
  "tit": { uid: "XR4Z15wXvrgoY68XKPcEzDfhbBz1", shortName: "TIT", color: "#60a5fa" },
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

// --- Data helpers ---
function fv(doc, field, type) {
  if (doc && doc[field] !== undefined && doc[field] !== null) {
    if (type === "integerValue" || type === "doubleValue") return String(doc[field]);
    if (type === "booleanValue") return Boolean(doc[field]);
    return doc[field];
  }
  if (!doc || !doc.fields || !doc.fields[field]) return null;
  return doc.fields[field][type] || null;
}

function getNum(doc, field) {
  if (!doc) return 0;
  if (typeof doc[field] === "number") return doc[field];
  if (typeof doc[field] === "string" && doc[field] !== "") return parseInt(doc[field], 10) || 0;
  var sv = fv(doc, field, "integerValue") || fv(doc, field, "doubleValue");
  return sv ? parseInt(sv, 10) : 0;
}

function getStreak(doc) { return getNum(doc, "streak"); }

function extractStats(doc, streak) {
  return {
    streak: streak,
    level: getNum(doc, "level"),
    xp: getNum(doc, "xp"),
    ttGold: getNum(doc, "ttGold"),
    freezes: getNum(doc, "streakFreezes")
  };
}

function getTheme() {
  var h = new Date().getHours();
  if (h < 12) return { c1: "#9a3412", c2: "#7c2d12" };
  if (h < 18) return { c1: "#4c1d95", c2: "#2e1065" };
  if (h < 22) return { c1: "#9f1239", c2: "#4c0519" };
  return      { c1: "#0f0c29",  c2: "#302b63" };
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
    assigneeId: fv(t, "assigneeId", "stringValue")
  };
}

function findRunningTask(docs, uid) {
  for (var i = 0; i < docs.length; i++) {
    var t = parseTask(docs[i]);
    if (t.status === "running" && t.currentWorker === uid) return t;
  }
  return null;
}

function findNextTask(docs, uid, legacyId) {
  for (var i = 0; i < docs.length; i++) {
    var t = parseTask(docs[i]);
    if (t.status === "idle" && (!t.assigneeId || t.assigneeId === uid || t.assigneeId === legacyId)) {
      return t;
    }
  }
  return null;
}

function listIdleTasks(docs, uid, legacyId, limit) {
  var out = [];
  for (var i = 0; i < docs.length; i++) {
    var t = parseTask(docs[i]);
    if (t.status === "idle" && (!t.assigneeId || t.assigneeId === uid || t.assigneeId === legacyId)) {
      out.push(t);
      if (out.length >= limit) break;
    }
  }
  return out;
}

function sfSymbol(name) {
  try {
    var sym = SFSymbol.named(name);
    if (sym) return sym.image;
  } catch (e) {}
  return SFSymbol.named("circle.fill").image;
}

// --- UI primitives ---
function createWidget(family) {
  var theme = getTheme();
  var w = new ListWidget();
  var gr = new LinearGradient();
  gr.colors = [new Color(theme.c1), new Color(theme.c2)];
  gr.locations = [0, 1];
  w.backgroundGradient = gr;
  w.spacing = 4;

  if (isSmallFamily(family)) w.setPadding(10, 12, 10, 12);
  else if (isLargeFamily(family)) w.setPadding(14, 16, 14, 16);
  else w.setPadding(12, 16, 12, 16);

  return w;
}

function addHeader(parent, compact) {
  var hdr = parent.addStack();
  hdr.layoutHorizontally();
  hdr.centerAlignContent();
  var nameT = hdr.addText(ME.shortName);
  nameT.font = Font.blackSystemFont(compact ? 10 : 12);
  nameT.textColor = new Color(ME.color);
  hdr.addSpacer();
  var timeT = hdr.addText(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  timeT.font = Font.systemFont(compact ? 9 : 10);
  timeT.textColor = new Color("#ffffff", 0.45);
}

function addStreakBlock(parent, stats, compact) {
  var row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  var iconSz = compact ? 18 : 26;
  var numSz  = compact ? 30 : 36;

  var fire = row.addImage(sfSymbol("flame.fill"));
  fire.imageSize = new Size(iconSz, iconSz);
  fire.tintColor = new Color("#fb923c");
  row.addSpacer(compact ? 4 : 6);

  var col = row.addStack();
  col.layoutVertically();

  var num = col.addText(String(stats.streak));
  num.font = Font.blackRoundedSystemFont(numSz);
  num.textColor = Color.white();
  num.lineLimit = 1;

  var sub = col.addText("NGAY STREAK");
  sub.font = Font.boldSystemFont(compact ? 7 : 8);
  sub.textColor = new Color("#ffffff", 0.4);
  sub.lineLimit = 1;
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
}

function addStatPill(parent, icon, label, value, color) {
  var pill = parent.addStack();
  pill.layoutVertically();
  pill.centerAlignContent();
  pill.backgroundColor = new Color("#ffffff", 0.08);
  pill.cornerRadius = 8;
  pill.setPadding(6, 4, 6, 4);

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

  var lbl = pill.addText(label);
  lbl.font = Font.systemFont(7);
  lbl.textColor = new Color("#ffffff", 0.4);
  lbl.lineLimit = 1;
}

function addTaskLine(parent, task, allowChildUrl) {
  var row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  if (allowChildUrl) row.url = APP + "?taskId=" + task.id + "&action=start";

  var dot = row.addImage(sfSymbol("circle.fill"));
  dot.imageSize = new Size(5, 5);
  dot.tintColor = new Color("#a5b4fc");
  row.addSpacer(6);
  var lbl = row.addText(task.title);
  lbl.font = Font.regularSystemFont(11);
  lbl.textColor = new Color("#ffffff", 0.85);
  lbl.lineLimit = 1;
}

// --- Layouts ---
function buildSmall(w, stats, running, next) {
  addHeader(w, true);
  w.addSpacer(2);
  addStreakBlock(w, stats, true);
  w.addSpacer(4);

  if (running) {
    w.url = APP + "?taskId=" + running.id + "&action=complete";
    addActionRow(w, {
      bg: "#10b981", icon: "checkmark.circle.fill",
      text: running.title, font: Font.boldSystemFont(11), padV: 7, padH: 8, iconSize: 11
    }, false);
  } else if (next) {
    w.url = APP + "?taskId=" + next.id + "&action=start";
    addActionRow(w, {
      bg: "#6366f1", icon: "play.fill",
      text: next.title, font: Font.boldSystemFont(11), padV: 7, padH: 8, iconSize: 10
    }, false);
  } else {
    w.url = APP;
    addActionRow(w, {
      bg: "#ffffff", bgOpacity: 0.08, text: "Het viec! Nghi ngoi thoi",
      font: Font.italicSystemFont(10), textColor: "#ffffff", padV: 7, padH: 8
    }, false);
  }
}

function buildMedium(w, stats, running, next) {
  addHeader(w, false);
  w.addSpacer(6);

  var body = w.addStack();
  body.layoutHorizontally();
  body.centerAlignContent();

  var left = body.addStack();
  left.layoutVertically();
  left.size = new Size(100, 0);
  addStreakBlock(left, stats, false);

  body.addSpacer(8);

  var right = body.addStack();
  right.layoutVertically();

  if (running) {
    addActionRow(right, {
      bg: "#ffffff", bgOpacity: 0.08, icon: "play.circle.fill", iconColor: "#4ade80",
      text: running.title, font: Font.regularSystemFont(11), padV: 6, padH: 8
    }, true);
    right.addSpacer(4);
    addActionRow(right, {
      bg: "#10b981", icon: "checkmark.circle.fill",
      text: "Hoan thanh", font: Font.boldSystemFont(11), padV: 7, padH: 8,
      url: APP + "?taskId=" + running.id + "&action=complete"
    }, true);
  } else if (next) {
    addActionRow(right, {
      bg: "#6366f1", icon: "play.fill",
      text: next.title, font: Font.boldSystemFont(11), padV: 8, padH: 10,
      url: APP + "?taskId=" + next.id + "&action=start"
    }, true);
  } else {
    addActionRow(right, {
      bg: "#ffffff", bgOpacity: 0.08,
      text: "Het viec! Nghi ngoi thoi", font: Font.italicSystemFont(11),
      textColor: "#ffffff", padV: 8, padH: 10, url: APP
    }, true);
  }

  w.url = APP + "?filter=" + param;
}

function buildLarge(w, stats, running, next, idleTasks) {
  addHeader(w, false);
  w.addSpacer(8);

  var statsRow = w.addStack();
  statsRow.layoutHorizontally();
  statsRow.centerAlignContent();
  addStatPill(statsRow, "flame.fill", "STREAK", stats.streak, "#fb923c");
  statsRow.addSpacer(6);
  addStatPill(statsRow, "star.fill", "LEVEL", stats.level, "#fbbf24");
  statsRow.addSpacer(6);
  addStatPill(statsRow, "dollarsign.circle.fill", "GOLD", stats.ttGold, "#fcd34d");
  statsRow.addSpacer(6);
  addStatPill(statsRow, "snowflake.circle.fill", "FREEZE", stats.freezes, "#93c5fd");

  w.addSpacer(10);

  if (running) {
    var runLbl = w.addText("DANG LAM");
    runLbl.font = Font.blackSystemFont(9);
    runLbl.textColor = new Color("#4ade80");
    w.addSpacer(4);
    addActionRow(w, {
      bg: "#ffffff", bgOpacity: 0.1, icon: "play.circle.fill", iconColor: "#4ade80",
      text: running.title, font: Font.boldSystemFont(12), padV: 8, padH: 10
    }, true);
    addActionRow(w, {
      bg: "#10b981", icon: "checkmark.circle.fill",
      text: "Hoan thanh task", font: Font.boldSystemFont(11), padV: 8, padH: 10,
      url: APP + "?taskId=" + running.id + "&action=complete"
    }, true);
    w.addSpacer(8);
  }

  var queueLbl = w.addText(running ? "TIEP THEO" : "VIEC CAN LAM");
  queueLbl.font = Font.blackSystemFont(9);
  queueLbl.textColor = new Color("#ffffff", 0.4);
  w.addSpacer(4);

  var shown = 0;
  if (!running && next) {
    addActionRow(w, {
      bg: "#6366f1", icon: "play.fill",
      text: next.title, font: Font.boldSystemFont(12), padV: 8, padH: 10,
      url: APP + "?taskId=" + next.id + "&action=start"
    }, true);
    shown = 1;
  }

  var maxLines = running ? 3 : 4;
  for (var i = shown; i < idleTasks.length && i < maxLines; i++) {
    addTaskLine(w, idleTasks[i], true);
    if (i < maxLines - 1) w.addSpacer(3);
  }

  if (!running && !next && idleTasks.length === 0) {
    addActionRow(w, {
      bg: "#ffffff", bgOpacity: 0.08,
      text: "Het viec! Nghi ngoi thoi", font: Font.italicSystemFont(12),
      textColor: "#ffffff", padV: 10, padH: 12, url: APP
    }, true);
  }

  w.url = APP + "?filter=" + param;
}

function buildWidget(statsDoc, streak, running, next, idleTasks) {
  var family = widgetFamily();
  var stats = extractStats(statsDoc, streak);
  var allowChildUrl = !isSmallFamily(family);
  var w = createWidget(family);

  try {
    if (isLargeFamily(family)) {
      buildLarge(w, stats, running, next, idleTasks);
    } else if (family === "medium") {
      buildMedium(w, stats, running, next);
    } else {
      buildSmall(w, stats, running, next);
    }
  } catch (err) {
    w = createWidget("small");
    buildSmall(w, stats, running, next);
  }

  w.refreshAfterDate = new Date(Date.now() + 600000);
  Script.setWidget(w);
  Script.complete();

  if (!config.runsInWidget) {
    if (family === "medium") w.presentMedium();
    else if (isLargeFamily(family)) w.presentLarge();
    else w.presentSmall();
  }
}

// --- Network ---
async function fetchFirestoreDoc(path) {
  try {
    var doc = await new Request(BASE + path).loadJSON();
    if (doc && !doc.error) return doc;
  } catch (e) {}
  return null;
}

async function run() {
  var statsDoc = null;
  var taskDocs = [];

  if (APPS_SCRIPT_URL) {
    try {
      var data = await new Request(
        APPS_SCRIPT_URL + "?mode=widget&user=" + encodeURIComponent(param)
      ).loadJSON();
      if (data && !data.error && data.stats) {
        statsDoc = data.stats;
        taskDocs = data.tasks || [];
      }
    } catch (e) {}
  }

  if (!statsDoc) {
    statsDoc = await fetchFirestoreDoc("artifacts/" + AID + "/public/data/team_members/" + ME.uid);
  }

  if (!taskDocs.length) {
    var raw = await fetchFirestoreDoc("artifacts/" + AID + "/public/data/tasks");
    if (raw && raw.documents) taskDocs = raw.documents;
  }

  var streak = getStreak(statsDoc);
  var running = findRunningTask(taskDocs, ME.uid);
  var next = running ? null : findNextTask(taskDocs, ME.uid, param);
  var idleTasks = listIdleTasks(taskDocs, ME.uid, param, 6);

  buildWidget(statsDoc, streak, running, next, idleTasks);
}

run();
