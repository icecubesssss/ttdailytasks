// TT Daily Task Widget v5.0 - Full Featured
// Widget Parameter: "tit" hoac "tun" (default: tit)

var APP  = "https://tt-daily-task.web.app/";
var BASE = "https://firestore.googleapis.com/v1/projects/tt-daily-task/databases/(default)/documents/";
var AID  = "tt-daily-task";

var USERS = {
  "tit": { uid: "XR4Z15wXvrgoY68XKPcEzDfhbBz1", shortName: "TIT", color: "#60a5fa" },
  "tun": { uid: "DnvU6r5jGBZu9oKBQpaummXtId93", shortName: "TUN", color: "#fcd34d" }
};

var param = (args.widgetParameter || "tit").toLowerCase().trim();
var ME = USERS[param] || USERS["tit"];

// --- Helpers (sync) ---
function fv(doc, field, type) {
  if (!doc || !doc.fields || !doc.fields[field]) return null;
  return doc.fields[field][type] || null;
}

function getStreak(doc) {
  if (!doc || !doc.fields) return 0;
  // streak can be integerValue or doubleValue depending on how Firebase stored it
  var sv = fv(doc, "streak", "integerValue") || fv(doc, "streak", "doubleValue");
  return sv ? parseInt(sv) : 0;
}

function getTheme() {
  var h = new Date().getHours();
  if (h < 12) return { c1: "#9a3412", c2: "#7c2d12" };
  if (h < 18) return { c1: "#4c1d95", c2: "#2e1065" };
  if (h < 22) return { c1: "#9f1239", c2: "#4c0519" };
  return      { c1: "#0f0c29",  c2: "#302b63" };
}

function findRunningTask(docs, uid) {
  for (var i = 0; i < docs.length; i++) {
    var t = docs[i];
    if (fv(t, "status", "stringValue") === "running" &&
        fv(t, "currentWorker", "stringValue") === uid) {
      return { id: t.name.split("/").pop(), title: fv(t, "title", "stringValue") || "Dang lam..." };
    }
  }
  return null;
}

function findNextTask(docs) {
  for (var i = 0; i < docs.length; i++) {
    var t = docs[i];
    if (fv(t, "status", "stringValue") === "idle") {
      return { id: t.name.split("/").pop(), title: fv(t, "title", "stringValue") || "Task moi" };
    }
  }
  return null;
}

// --- UI Builder (sync) ---
function buildWidget(streak, runningTask, nextTask) {
  var theme = getTheme();
  var w = new ListWidget();
  var gr = new LinearGradient();
  gr.colors = [new Color(theme.c1), new Color(theme.c2)];
  gr.locations = [0, 1];
  w.backgroundGradient = gr;
  w.setPadding(16, 16, 16, 16);
  w.url = APP + "?filter=" + param;

  // Header
  var hdr = w.addStack();
  hdr.layoutHorizontally();
  hdr.centerAlignContent();
  var nameT = hdr.addText(ME.shortName);
  nameT.font = Font.blackSystemFont(13);
  nameT.textColor = new Color(ME.color);
  hdr.addSpacer();
  var timeT = hdr.addText(new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}));
  timeT.font = Font.systemFont(11);
  timeT.textColor = new Color("#ffffff", 0.4);

  w.addSpacer(10);

  // Streak
  var sRow = w.addStack();
  sRow.layoutHorizontally();
  sRow.centerAlignContent();
  var fireImg = sRow.addImage(SFSymbol.named("flame.fill").image);
  fireImg.imageSize = new Size(28, 28);
  fireImg.tintColor = new Color("#fb923c");
  sRow.addSpacer(8);
  var numCol = sRow.addStack();
  numCol.layoutVertically();
  var sNum = numCol.addText(String(streak));
  sNum.font = Font.blackRoundedSystemFont(44);
  sNum.textColor = Color.white();
  var sSub = numCol.addText("NGAY STREAK");
  sSub.font = Font.blackSystemFont(9);
  sSub.textColor = new Color("#ffffff", 0.4);

  w.addSpacer(14);

  // Task action area
  if (runningTask) {
    // Running task card
    var tCard = w.addStack();
    tCard.layoutHorizontally();
    tCard.centerAlignContent();
    tCard.backgroundColor = new Color("#ffffff", 0.08);
    tCard.cornerRadius = 10;
    tCard.setPadding(8, 10, 8, 10);
    var rIco = tCard.addImage(SFSymbol.named("play.circle.fill").image);
    rIco.imageSize = new Size(14, 14);
    rIco.tintColor = new Color("#4ade80");
    tCard.addSpacer(6);
    var tTxt = tCard.addText(runningTask.title);
    tTxt.font = Font.mediumSystemFont(12);
    tTxt.textColor = Color.white();
    tTxt.lineLimit = 1;

    w.addSpacer(8);

    // Complete button
    var dBtn = w.addStack();
    dBtn.layoutHorizontally();
    dBtn.centerAlignContent();
    dBtn.backgroundColor = new Color("#10b981");
    dBtn.cornerRadius = 10;
    dBtn.setPadding(10, 12, 10, 12);
    dBtn.url = APP + "?taskId=" + runningTask.id + "&action=complete";
    dBtn.addSpacer();
    var dIco = dBtn.addImage(SFSymbol.named("checkmark.circle.fill").image);
    dIco.imageSize = new Size(14, 14);
    dIco.tintColor = Color.white();
    dBtn.addSpacer(6);
    var dTxt = dBtn.addText("HOAN THANH");
    dTxt.font = Font.blackSystemFont(12);
    dTxt.textColor = Color.white();
    dBtn.addSpacer();

  } else if (nextTask) {
    // Start next task button
    var nBtn = w.addStack();
    nBtn.layoutHorizontally();
    nBtn.centerAlignContent();
    nBtn.backgroundColor = new Color("#6366f1");
    nBtn.cornerRadius = 10;
    nBtn.setPadding(10, 12, 10, 12);
    nBtn.url = APP + "?taskId=" + nextTask.id + "&action=start";
    nBtn.addSpacer();
    var nIco = nBtn.addImage(SFSymbol.named("play.fill").image);
    nIco.imageSize = new Size(13, 13);
    nIco.tintColor = Color.white();
    nBtn.addSpacer(6);
    var nTxt = nBtn.addText(nextTask.title);
    nTxt.font = Font.boldSystemFont(12);
    nTxt.textColor = Color.white();
    nTxt.lineLimit = 1;
    nBtn.addSpacer();

  } else {
    var eBtn = w.addStack();
    eBtn.layoutHorizontally();
    eBtn.centerAlignContent();
    eBtn.backgroundColor = new Color("#ffffff", 0.08);
    eBtn.cornerRadius = 10;
    eBtn.setPadding(10, 12, 10, 12);
    eBtn.url = APP;
    eBtn.addSpacer();
    var eTxt = eBtn.addText("Het viec! Nghi ngoi thoi 🎉");
    eTxt.font = Font.italicSystemFont(12);
    eTxt.textColor = new Color("#ffffff", 0.5);
    eBtn.addSpacer();
  }

  w.refreshAfterDate = new Date(Date.now() + 600000);
  Script.setWidget(w);
  Script.complete();
  if (!config.runsInWidget) { w.presentSmall(); }
}

// --- Main async entry ---
async function run() {
  var statsDoc = null;
  var taskDocs = [];

  try {
    // Read from public mirror — written by app whenever stats change (no auth needed)
    var r1 = new Request(BASE + "artifacts/" + AID + "/public/data/widget_stats/" + ME.uid);
    var s = await r1.loadJSON();
    if (s && !s.error) statsDoc = s;
  } catch(e) {}

  try {
    var r2 = new Request(BASE + "artifacts/" + AID + "/public/data/tasks");
    var raw = await r2.loadJSON();
    if (raw && raw.documents) taskDocs = raw.documents;
  } catch(e) {}

  var streak = getStreak(statsDoc);
  var running = findRunningTask(taskDocs, ME.uid);
  var next = running ? null : findNextTask(taskDocs);

  buildWidget(streak, running, next);
}

run();
