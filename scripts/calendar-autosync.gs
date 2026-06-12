/**
 * TT DAILY TASK — FULL AUTOMATION SYSTEM v8.0
 * ============================================================================
 * Bản hợp nhất chạy NỀN trên Google Apps Script (KHÔNG cần mở web app):
 *   1) doGet            — proxy cho web app đọc Google Calendar (như cũ).
 *   2) syncCalendarToTasks — TẠO task từ Calendar vào Firestore (chống trùng 3 lớp).
 *   3) checkHeartbeatTimeout — tự start/done task tự động, tự pause task thủ công.
 *   4) runAutomation    — hàm trigger gọi (2); cài chạy mỗi ngày 2h sáng.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  v8.0 — CHỐNG TRÙNG TASK TUYỆT ĐỐI (3 lớp):
 *   L1. LEDGER: mỗi event đã tạo task được ghi vào Script Properties theo ngày
 *       (SYNC_LEDGER_yyyy-MM-dd). Đã có trong ledger thì KHÔNG BAO GIỜ tạo lại,
 *       kể cả khi bạn đã XOÁ task đó trong app (đây là lỗi tạo lại trước đây).
 *   L2. KHỚP THEO NGÀY: event lặp lại (recurring) trong Apps Script trả về CÙNG
 *       một getId() cho mọi instance, nên việc so id "trần" vừa chặn nhầm vừa
 *       lọt trùng. v8.0 so sánh normalizedEventId + NGÀY + assignee.
 *   L3. LOCK: LockService chặn 2 phiên chạy chồng nhau (trigger + chạy tay).
 *   Kèm theo: previewDuplicateCalendarTasks() / dedupeCalendarTasks() để dọn
 *   sạch các task đã bị trùng từ trước (chạy preview trước, xoá sau).
 *
 * ⚠️  v8.1 — TIẾT KIỆM QUOTA FIRESTORE (fix lỗi 429 RESOURCE_EXHAUSTED):
 *   Trước đây heartbeat (mỗi 5') và widget ĐỌC TOÀN BỘ collection tasks —
 *   288 lần/ngày × hàng trăm doc completed cũ là cháy 50K reads miễn phí/ngày.
 *   • checkHeartbeatTimeout: chỉ query task status in (idle, running).
 *   • runAutomation/sync:    chỉ query task có scheduledStartTime trong hôm nay.
 *   • Widget payload:        query lọc + cache CacheService 180s (mọi widget
 *                            của cả 2 user dùng chung 1 lượt đọc).
 *   • Mọi request Firestore: tự retry 429/5xx với backoff.
 *   Lưu ý: quota ngày đã cháy thì phải đợi reset (0h giờ Thái Bình Dương,
 *   ≈ 14–15h giờ VN) — retry không cứu được daily quota.
 * ---------------------------------------------------------------------------
 *
 * ========================== CÀI ĐẶT 1 LẦN ==========================
 * A) Khai báo OAuth scope trong appsscript.json (Editor → ⚙️ Project
 *    Settings → tick "Show appsscript.json" → mở file), đảm bảo có:
 *      "oauthScopes": [
 *        "https://www.googleapis.com/auth/calendar.readonly",
 *        "https://www.googleapis.com/auth/script.external_request",
 *        "https://www.googleapis.com/auth/script.scriptapp"
 *      ]
 *    (calendar.readonly: đọc lịch của bạn; external_request: gọi REST;
 *     script.scriptapp: tạo trigger. KHÔNG cần scope datastore nữa vì
 *     việc ghi Firestore dùng Service Account ở mục B.)
 *
 * B) GHI FIRESTORE BẰNG SERVICE ACCOUNT (BẮT BUỘC — tránh lỗi 403 của
 *    token người dùng). Chọn MỘT trong các cách sau:
 *
 *    Cách 1 (khuyên dùng): Script Properties → thêm 2 property:
 *         SA_CLIENT_EMAIL = <client_email>
 *         SA_PRIVATE_KEY  = <private_key>  (dán nguyên, kể cả \n)
 *
 *    Cách 2: Script Properties → thêm 1 property:
 *         SA_JSON = <dán nguyên nội dung file JSON service account>
 *
 *    Cách 3: Điền SA_EMAIL / SA_PRIVATE_KEY trong mục CẤU HÌNH bên dưới.
 *
 *    Cách 4: Chạy `setupServiceAccountFromJson` MỘT LẦN (dán JSON vào biến
 *            json trong hàm) → tự lưu vào Script Properties.
 *
 *    Lấy file JSON: Firebase Console → Project Settings → Service accounts →
 *    Generate new private key.
 *
 * C) Kiểm tra UID Firebase của Tít/Tún trong UID_TIT / UID_TUN bên dưới để
 *    task nền và Scriptable widget gán/đọc đúng người.
 *
 * D) Deploy Web App lại sau khi cập nhật code, rồi chạy `setupTriggers` MỘT LẦN
 *    (chọn hàm → Run), cấp quyền khi hỏi.
 *    Từ đó runAutomation tự chạy mỗi 5 phút.
 *
 * E) (Kiểm tra) Chạy `verifyFirestoreAccess` trước, rồi chạy
 *    `syncCalendarToTasks` thủ công, xem Logs (Ctrl+Enter).
 * ===================================================================
 */

// === 1. CẤU HÌNH ===
var PROJECT_ID = "tt-daily-task";
var APP_ID = "tt-daily-task";
var CALENDAR_ID_TIT = "thaitd.mathtech@gmail.com";
var CALENDAR_ID_TUN =
  "9bfaacc5ea449c8dd82d1fd5018c4032ddeb4e0d6abb0f901fb5287928762c3d@group.calendar.google.com";
var UID_TIT = "XR4Z15wXvrgoY68XKPcEzDfhbBz1";
var UID_TUN = "DnvU6r5jGBZu9oKBQpaummXtId93";
var NAME_TIT = "Tít";
var NAME_TUN = "Tún";
var TIMEOUT_MS = 5 * 60 * 1000; // quá 5' không có heartbeat -> pause task thủ công
var MIN_DURATION_MINS = 25; // thời lượng tối thiểu cho countdown
var CREATE_PAST_EVENTS = false; // true = vẫn tạo task "completed" cho event đã kết thúc (dễ sinh rác khi chạy tay giữa ngày)
var LEDGER_RETENTION_DAYS = 7; // số ngày giữ sổ chống trùng + cờ email trong Script Properties
// Service Account — ưu tiên Script Properties; fallback: sa-credentials.gs (local)
var SA_EMAIL = "";
var SA_PRIVATE_KEY = "";
// ===================

var TASKS_PATH =
  "projects/" +
  PROJECT_ID +
  "/databases/(default)/documents/artifacts/" +
  APP_ID +
  "/public/data/tasks";
var TASKS_URL = "https://firestore.googleapis.com/v1/" + TASKS_PATH;

/** Cài/làm mới trigger:
 *   - runAutomation chạy mỗi ngày vào lúc 2h sáng (đồng bộ lịch).
 *   - checkHeartbeatTimeout chạy mỗi 5 phút (kiểm tra vòng đời task/heartbeat).
 */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (
      fn === "runAutomation" ||
      fn === "checkHeartbeatTimeout" ||
      fn === "checkAndSendReminders"
    ) {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Trigger chạy mỗi ngày lúc 2h sáng để đồng bộ lịch
  ScriptApp.newTrigger("runAutomation")
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();

  // Trigger chạy mỗi 5 phút để check heartbeat / tự động dừng task
  ScriptApp.newTrigger("checkHeartbeatTimeout")
    .timeBased()
    .everyMinutes(5)
    .create();

  // Trigger chạy mỗi giờ để kiểm tra và gửi email nhắc nhở chưa học
  ScriptApp.newTrigger("checkAndSendReminders")
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log(
    "Đã cập nhật trigger thành công: runAutomation (2h sáng), checkHeartbeatTimeout (mỗi 5 phút), và checkAndSendReminders (mỗi 1 giờ).",
  );
}

/** Hàm trigger gọi mỗi ngày vào lúc 2h sáng để đồng bộ task từ Calendar. */
function runAutomation() {
  withScriptLock_("runAutomation", function () {
    var token = getFirestoreToken_(); // Service Account token
    // Chỉ cần task của HÔM NAY để đối chiếu trùng — không đọc cả lịch sử
    var range = todayRange_();
    var docs = queryTodayTasks_(token, range.min, range.max);
    if (docs === null) {
      Logger.log("[Automation] Bỏ qua — không đọc được tasks từ Firestore.");
      return;
    }
    syncCalendarToTasks_(token, docs); // tạo task còn thiếu cho ngày mới
  });
}

/** Khoảng thời gian hôm nay [00:00:00, 23:59:59] theo timezone script. */
function todayRange_() {
  var now = new Date();
  return {
    min: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime(),
    max: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime(),
  };
}

/** L3 — Lock toàn script: 2 phiên ghi task không bao giờ được chạy chồng nhau. */
function withScriptLock_(label, fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30 * 1000)) {
    Logger.log("[Lock] Bỏ qua " + label + " — một phiên khác đang chạy.");
    return;
  }
  try {
    fn();
  } finally {
    lock.releaseLock();
  }
}

/* ============================================================================
 * (1) PROXY ĐỌC LỊCH CHO WEB APP — giữ nguyên hành vi v6.0
 * ==========================================================================*/
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === "uploadMusic") {
      return uploadMusicToDrive_(body);
    }
    return jsonOut_({ success: false, error: "Unknown action" });
  } catch (err) {
    return jsonOut_({ success: false, error: err.toString() });
  }
}

function uploadMusicToDrive_(body) {
  var fileName = body.fileName || "track.mp3";
  var mimeType = body.mimeType || "audio/mpeg";
  if (!body.base64) {
    return jsonOut_({ success: false, error: "Missing file data" });
  }

  var blob = Utilities.newBlob(
    Utilities.base64Decode(body.base64),
    mimeType,
    fileName,
  );
  var folderName = "TT Daily Task Music";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(folderName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonOut_({
    success: true,
    id: file.getId(),
    url: "https://drive.google.com/uc?export=download&id=" + file.getId(),
  });
}

function doGet(e) {
  if (e.parameter.mode === "widget") {
    try {
      return jsonOut_(getWidgetPayload_(e.parameter.user));
    } catch (err) {
      return jsonOut_({ error: err.toString() });
    }
  }

  var calendarId = e.parameter.calendarId;
  var timeMin = e.parameter.timeMin;
  var timeMax = e.parameter.timeMax;

  if (calendarId) {
    try {
      var calendar = CalendarApp.getCalendarById(calendarId);
      if (!calendar) {
        return jsonOut_({ error: "Script không có quyền truy cập lịch này." });
      }
      var events = calendar.getEvents(new Date(timeMin), new Date(timeMax));
      var formatted = events.map(function (ev) {
        return {
          id: ev.getId(),
          summary: ev.getTitle(),
          location: ev.getLocation(),
          start: { dateTime: ev.getStartTime().toISOString() },
          end: { dateTime: ev.getEndTime().toISOString() },
        };
      });
      return jsonOut_({ items: formatted });
    } catch (err) {
      return jsonOut_({ error: err.toString() });
    }
  }
  return ContentService.createTextOutput("System Active!").setMimeType(
    ContentService.MimeType.TEXT,
  );
}

/* ============================================================================
 * (2) TẠO TASK TỪ CALENDAR  — phần MỚI, lõi giải quyết "tự tạo khi offline"
 * ==========================================================================*/
function syncCalendarToTasks() {
  // bản gọi tay để test
  withScriptLock_("syncCalendarToTasks", function () {
    var token = getFirestoreToken_();
    var range = todayRange_();
    syncCalendarToTasks_(token, queryTodayTasks_(token, range.min, range.max));
  });
}

function normalizeEventId_(id) {
  if (!id) return "";
  return String(id)
    .replace(/@google\.com$/i, "")
    .split("_")[0];
}

/** Khóa ngày theo timezone của script (Asia/Ho_Chi_Minh). */
function dayKey_(ms) {
  return Utilities.formatDate(
    new Date(ms),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd",
  );
}

/** Khóa duy nhất của 1 instance event trong 1 ngày (id + ngày + người nhận). */
function eventKey_(ev) {
  return (
    normalizeEventId_(ev.id) +
    "|" +
    dayKey_(ev.start) +
    "|" +
    (ev.assigneeId || "")
  );
}

// --- L1: Sổ chống trùng (ledger) trong Script Properties, 1 key / ngày ---
function ledgerPropKey_(dayKey) {
  return "SYNC_LEDGER_" + dayKey;
}

function loadLedger_(props, dayKey) {
  try {
    var raw = props.getProperty(ledgerPropKey_(dayKey));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLedger_(props, dayKey, ledger) {
  props.setProperty(ledgerPropKey_(dayKey), JSON.stringify(ledger));
}

/** Dọn ledger + cờ email cũ hơn LEDGER_RETENTION_DAYS để Properties không phình. */
function cleanupOldProperties_(props) {
  var cutoff = Date.now() - LEDGER_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  props.getKeys().forEach(function (k) {
    if (!/^(SYNC_LEDGER_|SENT_)/.test(k)) return;
    var m = k.match(/(\d{4}-\d{2}-\d{2})$/);
    if (!m) return;
    var t = new Date(m[1] + "T00:00:00").getTime();
    if (t && t < cutoff) props.deleteProperty(k);
  });
}

/**
 * L2 — Task hiện có khớp với event không?
 * LƯU Ý: event lặp lại dùng chung 1 getId() cho mọi ngày, nên id chỉ được coi
 * là trùng khi task nằm CÙNG NGÀY với event. So id "trần" như trước vừa chặn
 * nhầm instance hôm nay (vì khớp task hôm qua) vừa để lọt trùng khi id lệch.
 */
function taskMatchesCalendarEvent_(doc, ev) {
  var f = doc.fields || {};
  var taskStart = numberField_(f.scheduledStartTime);
  var sameDay = taskStart > 0 && dayKey_(taskStart) === dayKey_(ev.start);

  var calId = stringField_(f.calendarEventId);
  if (calId && ev.id && sameDay) {
    if (normalizeEventId_(calId) === normalizeEventId_(ev.id)) return true;
  }
  // Fallback: cùng tiêu đề + đúng giờ bắt đầu + cùng người nhận
  return (
    (stringField_(f.title) || "").trim() === (ev.title || "").trim() &&
    taskStart === ev.start &&
    stringField_(f.assigneeId) === ev.assigneeId
  );
}

function syncCalendarToTasks_(token, existingDocs) {
  if (existingDocs === null) {
    Logger.log("[Sync] Bỏ qua tạo task — không đọc được danh sách hiện có.");
    return [];
  }

  var now = new Date();
  var tMin = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  var tMax = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );
  var todayKey = dayKey_(now.getTime());

  var props = PropertiesService.getScriptProperties();
  cleanupOldProperties_(props);
  var ledger = loadLedger_(props, todayKey);

  var isTitSyncEnabled = isUserAutoSyncEnabled_(token, UID_TIT);
  var isTunSyncEnabled = isUserAutoSyncEnabled_(token, UID_TUN);
  if (!isTitSyncEnabled) {
    Logger.log(
      "[Sync] Bỏ qua đồng bộ lịch cho Tít vì autoSyncCalendar = false.",
    );
  }
  if (!isTunSyncEnabled) {
    Logger.log(
      "[Sync] Bỏ qua đồng bộ lịch cho Tún vì autoSyncCalendar = false.",
    );
  }

  var events = []
    .concat(
      isTitSyncEnabled ? readCalendar_(CALENDAR_ID_TIT, "tit", tMin, tMax) : [],
    )
    .concat(
      isTunSyncEnabled ? readCalendar_(CALENDAR_ID_TUN, "tun", tMin, tMax) : [],
    );

  // Khử trùng ngay trong danh sách event (1 event xuất hiện 2 lần do lịch chia sẻ)
  var seen = {};
  events = events.filter(function (ev) {
    var key = eventKey_(ev);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });

  var created = 0;
  var skippedLedger = 0;
  var skippedExisting = 0;
  var skippedPast = 0;
  var createdDocs = [];

  events.forEach(function (ev) {
    var key = eventKey_(ev);

    // L1 — đã từng tạo task cho event này (kể cả khi user đã xoá): không tạo lại
    if (ledger[key]) {
      skippedLedger++;
      return;
    }

    if (!CREATE_PAST_EVENTS && ev.isPast) {
      skippedPast++;
      return;
    }

    // L2 — task tương ứng đã tồn tại: ghi nhận vào ledger rồi bỏ qua
    var exists = existingDocs.some(function (d) {
      return taskMatchesCalendarEvent_(d, ev);
    });
    if (exists) {
      ledger[key] = { t: Date.now(), s: "existing" };
      skippedExisting++;
      return;
    }

    var createdDoc = createTaskDoc_(token, ev);
    if (createdDoc) {
      ledger[key] = { t: Date.now(), s: "created" };
      createdDocs.push(createdDoc);
      existingDocs.push(createdDoc);
      created++;
      // Lưu ledger NGAY sau mỗi lần tạo — script chết giữa chừng vẫn không tạo lại
      saveLedger_(props, todayKey, ledger);
    }
  });

  saveLedger_(props, todayKey, ledger);
  Logger.log(
    "[Sync] " +
      events.length +
      " event hôm nay → tạo mới " +
      created +
      ", đã tồn tại " +
      skippedExisting +
      ", ledger chặn " +
      skippedLedger +
      ", quá khứ bỏ qua " +
      skippedPast +
      ".",
  );
  return createdDocs;
}

function readCalendar_(calId, owner, tMin, tMax) {
  if (!calId) return [];
  var uid = owner === "tit" ? UID_TIT : UID_TUN;
  var name = owner === "tit" ? NAME_TIT : NAME_TUN;

  var rawEvents;
  try {
    var cal = CalendarApp.getCalendarById(calId);
    if (!cal) {
      Logger.log("[Sync] Không mở được lịch: " + calId);
      return [];
    }
    rawEvents = cal.getEvents(tMin, tMax);
  } catch (err) {
    Logger.log("[Sync] Lỗi đọc lịch " + calId + ": " + err);
    return [];
  }

  return rawEvents
    .filter(function (e) {
      return !e.isAllDayEvent();
    })
    .map(function (e) {
      var start = e.getStartTime().getTime();
      var end = e.getEndTime().getTime();
      return {
        id: e.getId(),
        title: (e.getTitle() || "").trim() || "(Không tiêu đề)",
        owner: owner,
        assigneeId: uid || owner,
        assigneeName: name,
        start: start,
        end: end,
        durationMins: Math.max(
          MIN_DURATION_MINS,
          Math.round((end - start) / 60000),
        ),
        durationMs: Math.max(MIN_DURATION_MINS * 60 * 1000, end - start),
        isPast: end < Date.now(),
      };
    });
}

/* ============================================================================
 * (2b) DỌN TASK TRÙNG ĐÃ LỠ TẠO TỪ TRƯỚC
 * Chạy previewDuplicateCalendarTasks() trước để xem danh sách sẽ xoá (DRY RUN),
 * ưng rồi thì chạy dedupeCalendarTasks() để xoá thật.
 * ==========================================================================*/
function previewDuplicateCalendarTasks() {
  dedupeCalendarTasks_(true);
}

function dedupeCalendarTasks() {
  withScriptLock_("dedupeCalendarTasks", function () {
    dedupeCalendarTasks_(false);
  });
}

function dedupeCalendarTasks_(dryRun) {
  var token = getFirestoreToken_();
  var docs = listAllTasks_(token);
  if (docs === null) {
    Logger.log("[Dedupe] Không đọc được danh sách tasks.");
    return;
  }

  var groups = {};
  docs.forEach(function (doc) {
    var f = doc.fields || {};
    var calId = stringField_(f.calendarEventId);
    var createdBy = stringField_(f.createdBy) || "";
    // Chỉ gom task sinh từ calendar (server hoặc client autosync)
    if (!calId && createdBy.indexOf("system-autosync") !== 0) return;

    var start = numberField_(f.scheduledStartTime);
    var assignee = stringField_(f.assigneeId) || "";
    var key =
      calId && start > 0
        ? normalizeEventId_(calId) + "|" + dayKey_(start) + "|" + assignee
        : (stringField_(f.title) || "").trim() + "|" + start + "|" + assignee;
    (groups[key] = groups[key] || []).push(doc);
  });

  var removed = 0;
  Object.keys(groups).forEach(function (key) {
    var group = groups[key];
    if (group.length < 2) return;
    // Giữ task "giá trị nhất": đã hoàn thành > đang/tạm chạy > nhiều giờ nhất > tạo sớm nhất
    group.sort(function (a, b) {
      return taskKeepScore_(b) - taskKeepScore_(a);
    });
    group.slice(1).forEach(function (doc) {
      removed++;
      var title = stringField_((doc.fields || {}).title);
      var id = doc.name.split("/").pop();
      if (dryRun) {
        Logger.log('[Dedupe][DRY] Sẽ xoá: "' + title + '" (' + id + ") key=" + key);
      } else {
        deleteFirestoreDoc_(token, doc.name);
        Logger.log('[Dedupe] Đã xoá: "' + title + '" (' + id + ")");
      }
    });
  });
  Logger.log(
    "[Dedupe] " + (dryRun ? "DRY RUN — sẽ xoá " : "Đã xoá ") + removed + " task trùng.",
  );
}

function taskKeepScore_(doc) {
  var f = doc.fields || {};
  var status = stringField_(f.status);
  var score = 0;
  if (status === "completed" || status === "completed_late") score += 1e15;
  if (status === "running" || status === "paused") score += 5e14;
  score += Math.min(numberField_(f.totalTrackedTime), 1e13);
  score -= numberField_(f.createdAt) / 1e6; // tạo sớm hơn được ưu tiên giữ
  return score;
}

function deleteFirestoreDoc_(token, docName) {
  fetchWithRetry_(
    "https://firestore.googleapis.com/v1/" + docName,
    {
      method: "delete",
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    },
    "delete " + docName.split("/").pop(),
  );
}

function createTaskDoc_(token, ev) {
  var fields = {
    title: { stringValue: ev.title },
    createdBy: { stringValue: "system-autosync-gas" },
    creatorName: { stringValue: "AutoSync" },
    assigneeId: { stringValue: ev.assigneeId },
    assigneeName: { stringValue: ev.assigneeName },
    assigneePhoto: { nullValue: null },
    deadline: { integerValue: String(ev.end) },
    scheduledStartTime: { integerValue: String(ev.start) },
    scheduledEndTime: { integerValue: String(ev.end) },
    calendarEventId: { stringValue: ev.id },
    priority: { stringValue: "medium" },
    type: { stringValue: "stopwatch" },
    limitTime: { integerValue: "0" },
    isDone: { booleanValue: ev.isPast },
    status: { stringValue: ev.isPast ? "completed" : "idle" },
    totalTrackedTime: { integerValue: String(ev.isPast ? ev.durationMs : 0) },
    createdAt: { integerValue: String(Date.now()) },
    subTasks: { arrayValue: { values: [] } },
    isAutomated: { booleanValue: false },
  };
  if (ev.isPast) fields.endTime = { integerValue: String(ev.end) };

  var res = fetchWithRetry_(
    TASKS_URL,
    {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify({ fields: fields }),
      muteHttpExceptions: true,
    },
    "create task",
  );
  if (res.getResponseCode() >= 300) {
    Logger.log(
      '[Sync] Lỗi tạo task "' + ev.title + '": ' + res.getContentText(),
    );
    return null;
  }
  return JSON.parse(res.getContentText());
}

/* ============================================================================
 * (3) VÒNG ĐỜI TASK — logic v6.0, tách hàm để dùng chung danh sách docs
 * ==========================================================================*/
function checkHeartbeatTimeout() {
  withScriptLock_("checkHeartbeatTimeout", function () {
    var token = getFirestoreToken_();
    // Vòng đời chỉ đụng tới task idle/running — không đọc cả núi task completed
    processTaskLifecycle_(token, queryTasksByStatus_(token, ["idle", "running"]));
  });
}

/** Chạy MỘT LẦN: dán nội dung file JSON service account vào biến `json`. */
function setupServiceAccountFromJson() {
  var json = ""; // <-- dán JSON Firebase service account vào đây
  if (!json) {
    throw new Error(
      "Dán nội dung file JSON service account vào biến json trong hàm này.",
    );
  }
  var sa = JSON.parse(json);
  if (!sa.client_email || !sa.private_key) {
    throw new Error("JSON thiếu client_email hoặc private_key.");
  }
  PropertiesService.getScriptProperties().setProperties({
    SA_CLIENT_EMAIL: sa.client_email,
    SA_PRIVATE_KEY: sa.private_key,
  });
  Logger.log("Đã lưu Script Properties. SA_CLIENT_EMAIL=" + sa.client_email);
}

function verifyFirestoreAccess() {
  var creds = getServiceAccountCredentials_();
  Logger.log("[Verify] SA_CLIENT_EMAIL=" + creds.email);
  var token = getFirestoreToken_();
  var resp = UrlFetchApp.fetch(TASKS_URL + "?pageSize=1", {
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
  });
  Logger.log("[Verify] List tasks status=" + resp.getResponseCode());
  Logger.log("[Verify] Body=" + resp.getContentText());
}

function processTaskLifecycle_(token, docs) {
  var now = Date.now();
  (docs || []).forEach(function (doc) {
    var f = doc.fields || {};
    var status = (f.status || {}).stringValue;
    var isAutomated = (f.isAutomated || {}).booleanValue === true;
    var startTime = Number((f.scheduledStartTime || {}).integerValue || 0);
    var endTime = Number((f.scheduledEndTime || {}).integerValue || 0);

    // --- TASK TỰ ĐỘNG (CALENDAR) ---
    if (isAutomated) {
      if (status === "idle" && now >= startTime && now < endTime) {
        patchFirestore(doc.name, {
          status: { stringValue: "running" },
          lastStartTime: { integerValue: String(now) },
          currentWorker: f.assigneeId || { nullValue: null },
          currentWorkerName: f.assigneeName || { stringValue: "AutoSync" },
        });
        return;
      }
      if (status === "running" && now >= endTime) {
        completeAutomatedTask_(doc.name, f, endTime);
        return;
      }
      return;
    }

    // --- TASK THỦ CÔNG: pause khi mất heartbeat quá hạn ---
    if (status === "running") {
      var lastHB = Number((f.lastHeartbeat || {}).integerValue || 0);
      var lastStart = Number((f.lastStartTime || {}).integerValue || 0);
      var ref = lastHB || lastStart;
      if (ref && now - ref > TIMEOUT_MS) {
        var activeTime = lastHB ? Math.max(0, lastHB - lastStart) : 0;
        var prevTracked = Number((f.totalTrackedTime || {}).integerValue || 0);
        patchFirestore(doc.name, {
          status: { stringValue: "paused" },
          totalTrackedTime: { integerValue: String(prevTracked + activeTime) },
          lastStartTime: { nullValue: null },
          currentWorker: { nullValue: null },
          lastHeartbeat: { nullValue: null },
          autoPauseReason: { stringValue: "heartbeat_timeout" },
        });
        Logger.log("[Life] Auto-paused task thủ công do timeout.");
      }
    }
  });
}

function completeAutomatedTask_(docName, f, endTime) {
  var prevTracked = Number((f.totalTrackedTime || {}).integerValue || 0);
  var lastStart = Number((f.lastStartTime || {}).integerValue || 0);
  var startTime = Number((f.scheduledStartTime || {}).integerValue || 0);
  var finalTime = prevTracked + (endTime - (lastStart || startTime));

  patchFirestore(docName, {
    status: { stringValue: "completed" },
    isDone: { booleanValue: true },
    totalTrackedTime: { integerValue: String(finalTime) },
    endTime: { integerValue: String(endTime) },
    lastStartTime: { nullValue: null },
    currentWorker: { nullValue: null },
  });
  Logger.log("[Life] Auto-completed task calendar: " + docName);
}

/* ============================================================================
 * HELPERS
 * ==========================================================================*/

/** Fetch có retry với backoff cho lỗi tạm thời (429 rate-limit, 5xx). */
function fetchWithRetry_(url, options, label) {
  var delay = 2000;
  var resp;
  for (var attempt = 1; attempt <= 4; attempt++) {
    resp = UrlFetchApp.fetch(url, options);
    var code = resp.getResponseCode();
    if (code !== 429 && code < 500) return resp;
    if (attempt === 4) break;
    Logger.log(
      "[Retry] " + (label || url) + " bị " + code +
        " — thử lại sau " + delay + "ms (lần " + attempt + "/3).",
    );
    Utilities.sleep(delay + Math.floor(Math.random() * 500));
    delay *= 2;
  }
  return resp;
}

/** Chạy structured query trên collection tasks — chỉ đọc doc cần thiết. */
function runTasksQuery_(token, where) {
  var parent =
    "projects/" + PROJECT_ID + "/databases/(default)/documents/artifacts/" +
    APP_ID + "/public/data";
  var resp = fetchWithRetry_(
    "https://firestore.googleapis.com/v1/" + parent + ":runQuery",
    {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + token },
      payload: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "tasks" }],
          where: where,
          limit: 1000,
        },
      }),
      muteHttpExceptions: true,
    },
    "runQuery tasks",
  );
  if (resp.getResponseCode() >= 300) {
    Logger.log(
      "[Query] Lỗi (" + resp.getResponseCode() + "): " + resp.getContentText(),
    );
    return null;
  }
  var docs = [];
  JSON.parse(resp.getContentText()).forEach(function (row) {
    if (row.document) docs.push(row.document);
  });
  return docs;
}

/** Task theo status (vd ["idle","running"]) — bỏ qua núi task completed cũ. */
function queryTasksByStatus_(token, statuses) {
  return runTasksQuery_(token, {
    fieldFilter: {
      field: { fieldPath: "status" },
      op: "IN",
      value: {
        arrayValue: {
          values: statuses.map(function (s) {
            return { stringValue: s };
          }),
        },
      },
    },
  });
}

/** Task có scheduledStartTime trong khoảng [minMs, maxMs] (range 1 field — không cần index). */
function queryTodayTasks_(token, minMs, maxMs) {
  return runTasksQuery_(token, {
    compositeFilter: {
      op: "AND",
      filters: [
        {
          fieldFilter: {
            field: { fieldPath: "scheduledStartTime" },
            op: "GREATER_THAN_OR_EQUAL",
            value: { integerValue: String(minMs) },
          },
        },
        {
          fieldFilter: {
            field: { fieldPath: "scheduledStartTime" },
            op: "LESS_THAN_OR_EQUAL",
            value: { integerValue: String(maxMs) },
          },
        },
      ],
    },
  });
}

/** Task "đang quan tâm": idle/running + mọi task có lịch hôm nay (gộp, khử trùng). */
function queryRelevantTasks_(token) {
  var range = todayRange_();
  var open = queryTasksByStatus_(token, ["idle", "running"]);
  var today = queryTodayTasks_(token, range.min, range.max);
  if (open === null && today === null) return null;
  var byName = {};
  var docs = [];
  (open || []).concat(today || []).forEach(function (doc) {
    if (byName[doc.name]) return;
    byName[doc.name] = true;
    docs.push(doc);
  });
  return docs;
}

/** Lấy TẤT CẢ task (có phân trang) — chỉ dùng cho việc hiếm (dedupe thủ công). */
function listAllTasks_(token) {
  var headers = { Authorization: "Bearer " + token };
  var all = [];
  var pageToken = "";
  do {
    var url =
      TASKS_URL +
      "?pageSize=300" +
      (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
    var resp = fetchWithRetry_(
      url,
      { headers: headers, muteHttpExceptions: true },
      "list tasks",
    );
    if (resp.getResponseCode() >= 300) {
      Logger.log(
        "[List] Lỗi đọc tasks (" +
          resp.getResponseCode() +
          "): " +
          resp.getContentText(),
      );
      return null;
    }
    var data = JSON.parse(resp.getContentText());
    if (data.documents) all = all.concat(data.documents);
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return all;
}

/** PATCH 1 document Firestore qua REST API. */
function patchFirestore(docName, fields) {
  var token = getFirestoreToken_();
  var mask = Object.keys(fields)
    .map(function (p) {
      return "updateMask.fieldPaths=" + p;
    })
    .join("&");
  fetchWithRetry_(
    "https://firestore.googleapis.com/v1/" + docName + "?" + mask,
    {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token },
      contentType: "application/json",
      payload: JSON.stringify({ fields: fields }),
      muteHttpExceptions: true,
    },
    "patch " + docName.split("/").pop(),
  );
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getWidgetPayload_(userKey) {
  var key = (userKey || "tit").toLowerCase();
  var users = {
    tit: { uid: UID_TIT, legacyId: "tit" },
    tun: { uid: UID_TUN, legacyId: "tun" },
  };
  var user = users[key] || users.tit;

  // Cache 180s — mọi widget (cả 2 user, nhiều size) dùng chung 1 lượt đọc Firestore
  var cache = CacheService.getScriptCache();
  var cacheKey = "WIDGET_PAYLOAD_" + key;
  var hit = cache.get(cacheKey);
  if (hit) {
    try {
      var cachedPayload = JSON.parse(hit);
      cachedPayload.fromCache = true;
      return cachedPayload;
    } catch (e) {}
  }

  var token = getFirestoreToken_();

  // profile/stats là NGUỒN CHUẨN; team_members chỉ là mirror (hay bị cũ) → fallback từng field
  var primaryDoc = getDocByPath_(
    token,
    "artifacts/" + APP_ID + "/users/" + user.uid + "/profile/stats",
  );
  var mirrorDoc = getDocByPath_(
    token,
    "artifacts/" + APP_ID + "/public/data/team_members/" + user.uid,
  );
  var pf = (primaryDoc && primaryDoc.fields) || {};
  var mf = (mirrorDoc && mirrorDoc.fields) || {};
  function statNum_(name) {
    return pf[name] !== undefined ? numberField_(pf[name]) : numberField_(mf[name]);
  }

  // Widget chỉ cần: task đang mở (idle/running) + task của hôm nay (tính tiến độ)
  var docs = queryRelevantTasks_(token) || [];

  var tasks = docs.map(function (doc) {
    var f = doc.fields || {};
    return {
      id: doc.name.split("/").pop(),
      title: stringField_(f.title),
      status: stringField_(f.status),
      currentWorker: stringField_(f.currentWorker),
      assigneeId: stringField_(f.assigneeId),
      scheduledStartTime: numberField_(f.scheduledStartTime),
      scheduledEndTime: numberField_(f.scheduledEndTime),
      deadline: numberField_(f.deadline),
      createdAt: numberField_(f.createdAt),
      isDone: (f.isDone || {}).booleanValue === true,
    };
  });

  var payload = {
    generatedAt: Date.now(),
    // false = không đọc được doc stats nào (vd quota 429) → widget nên dùng cache cũ
    statsOk: !!(primaryDoc || mirrorDoc),
    stats: {
      streak: statNum_("streak"),
      level: statNum_("level"),
      xp: statNum_("xp"),
      ttGold: statNum_("ttGold"),
      streakFreezes: statNum_("streakFreezes"),
      updatedAt: statNum_("updatedAt"),
    },
    tasks: tasks,
  };

  try {
    cache.put(cacheKey, JSON.stringify(payload), 180);
  } catch (e) {
    // payload quá 100KB thì bỏ cache, không sao
  }
  return payload;
}

function getDocByPath_(token, path) {
  var resp = fetchWithRetry_(
    "https://firestore.googleapis.com/v1/projects/" +
      PROJECT_ID +
      "/databases/(default)/documents/" +
      path,
    {
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    },
    "get " + path.split("/").pop(),
  );
  if (resp.getResponseCode() >= 300) return null;
  return JSON.parse(resp.getContentText());
}

function isUserAutoSyncEnabled_(token, uid) {
  if (!uid) return false;
  var path = "artifacts/" + APP_ID + "/users/" + uid + "/profile/stats";
  var doc = getDocByPath_(token, path);
  if (!doc || !doc.fields) {
    Logger.log(
      "[Sync] Không đọc được stats của user " + uid + ", mặc định là false.",
    );
    return false;
  }
  var autoSyncField = doc.fields.autoSyncCalendar;
  var enabled = autoSyncField ? autoSyncField.booleanValue === true : false;
  Logger.log("[Sync] Check autoSyncCalendar cho " + uid + ": " + enabled);
  return enabled;
}

function stringField_(field) {
  return field && field.stringValue ? field.stringValue : null;
}

function numberField_(field) {
  if (!field) return 0;
  return Number(field.integerValue || field.doubleValue || 0);
}

/* ============================================================================
 * SERVICE ACCOUNT AUTH — token để ghi Firestore (không phụ thuộc token user)
 * ==========================================================================*/
var _SA_TOKEN_CACHE = null; // cache trong 1 lần thực thi

/** Đọc service account từ Script Properties, SA_JSON, hoặc hằng số SA_EMAIL. */
function getServiceAccountCredentials_() {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty("SA_CLIENT_EMAIL");
  var key = props.getProperty("SA_PRIVATE_KEY");

  if (!email || !key) {
    var jsonRaw = props.getProperty("SA_JSON");
    if (jsonRaw) {
      var sa = JSON.parse(jsonRaw);
      email = sa.client_email;
      key = sa.private_key;
    }
  }

  email = email || SA_EMAIL;
  key = key || SA_PRIVATE_KEY;
  key = (key || "").replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Thiếu Service Account. Xem mục B đầu file:\n" +
        "  • Script Properties: SA_CLIENT_EMAIL + SA_PRIVATE_KEY\n" +
        "  • hoặc SA_JSON (dán cả file JSON)\n" +
        "  • hoặc điền SA_EMAIL / SA_PRIVATE_KEY trong CẤU HÌNH\n" +
        "  • hoặc chạy setupServiceAccountFromJson() một lần",
    );
  }
  return { email: email, key: key };
}

/** Lấy access token từ Service Account. */
function getFirestoreToken_() {
  if (_SA_TOKEN_CACHE) return _SA_TOKEN_CACHE;

  var creds = getServiceAccountCredentials_();
  var email = creds.email;
  var key = creds.key;

  var now = Math.floor(Date.now() / 1000);
  var header = { alg: "RS256", typ: "JWT" };
  var claim = {
    iss: email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  var toSign =
    b64url_(JSON.stringify(header)) + "." + b64url_(JSON.stringify(claim));
  var sig = Utilities.computeRsaSha256Signature(toSign, key);
  var jwt =
    toSign + "." + Utilities.base64EncodeWebSafe(sig).replace(/=+$/, "");

  var res = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    },
    muteHttpExceptions: true,
  });
  var token = JSON.parse(res.getContentText()).access_token;
  if (!token)
    throw new Error(
      "Không lấy được token Service Account: " + res.getContentText(),
    );
  _SA_TOKEN_CACHE = token;
  return token;
}

function b64url_(s) {
  return Utilities.base64EncodeWebSafe(Utilities.newBlob(s).getBytes()).replace(
    /=+$/,
    "",
  );
}

/* ============================================================================
 * (4) HỆ THỐNG EMAIL NHẮC NHỞ HỌC TẬP (DUOLINGO-STYLE EMAIL REMINDERS)
 * ==========================================================================*/

/** Hàm điều phối kiểm tra và gửi email nhắc nhở vào các khung giờ vàng (chống trượt do trễ trigger) */
function checkAndSendReminders() {
  var token = getFirestoreToken_();
  var now = new Date();
  var hours = now.getHours();

  // Format ngày hiện tại dạng YYYY-MM-DD theo múi giờ VN (GMT+7)
  var todayStr = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd");

  var users = [
    {
      uid: UID_TIT,
      email: "dinhthai.ctv@gmail.com",
      name: NAME_TIT,
      legacyId: "tit",
    },
    {
      uid: UID_TUN,
      email: "transontruc.03@gmail.com",
      name: NAME_TUN,
      legacyId: "tun",
    },
  ];

  users.forEach(function (u) {
    // 1. Nhắc nhở Buổi sáng: Gửi trong khoảng từ 06:00 đến 11:59 trưa
    if (hours >= 6 && hours < 12) {
      checkAndSendMorningReminder_(token, u, todayStr);
    }
    // 2. Nhắc nhở Buổi tối: Gửi trong khoảng từ 18:00 đến 21:59 tối
    else if (hours >= 18 && hours < 22) {
      checkAndSendEveningReminder_(token, u, todayStr);
    }
    // 3. Cảnh báo khẩn cấp: Gửi trong khoảng từ 22:00 đến 23:59 đêm
    else if (hours >= 22 && hours < 24) {
      checkAndSendEmergencyReminder_(token, u, todayStr);
    }
  });
}

/** Cấp độ 1: Nhắc nhở Buổi sáng (08:30) - Lên kế hoạch & khởi động */
function checkAndSendMorningReminder_(token, u, todayStr) {
  var propertyKey = "SENT_MORNING_" + u.uid + "_" + todayStr;
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(propertyKey) === "true") {
    return; // Đã gửi rồi
  }

  var allTasks = queryRelevantTasks_(token);
  if (allTasks === null) return;

  var now = new Date();
  var startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  ).getTime();
  var endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();

  var userTasks = allTasks.filter(function (doc) {
    var f = doc.fields || {};
    var assignee = stringField_(f.assigneeId);
    if (assignee !== u.uid && assignee !== u.legacyId) return false;

    var schedStart = numberField_(f.scheduledStartTime);
    var createdAt = numberField_(f.createdAt);
    var refTime = schedStart || createdAt;

    return refTime >= startOfDay && refTime <= endOfDay;
  });

  var statsPath = "artifacts/" + APP_ID + "/users/" + u.uid + "/profile/stats";
  var statsDoc = getDocByPath_(token, statsPath);
  var streak = 0;
  var freezes = 3;
  if (statsDoc && statsDoc.fields) {
    streak = numberField_(statsDoc.fields.streak) || 0;
    freezes = numberField_(statsDoc.fields.streakFreezes) || 0;
  }

  var subject = "";
  var message = "";
  var btnText = "";
  var shouldSend = false;

  if (userTasks.length === 0) {
    subject =
      "[TT Daily Task] 🌅 Chào ngày mới, lên kế hoạch học tập ngay thôi!";
    message =
      "Bạn chưa có nhiệm vụ nào được lên lịch cho hôm nay. Hãy mở ứng dụng và lên kế hoạch học tập ngay để duy trì chuỗi tiến độ tuyệt vời của mình nhé!";
    btnText = "Lên Kế Hoạch Ngay";
    shouldSend = true;
  } else {
    var allIdle = userTasks.every(function (doc) {
      var status = stringField_(doc.fields.status);
      return status === "idle";
    });
    if (allIdle) {
      subject = "[TT Daily Task] 📚 Bắt đầu bài học đầu tiên trong ngày nào!";
      message =
        "Hôm nay bạn đang có <b>" +
        userTasks.length +
        ' nhiệm vụ</b> đang chờ xử lý. Hãy mở ứng dụng, chọn nhiệm vụ và bấm nút "Bắt đầu" để khởi động ngày học tập hiệu quả nhé!';
      btnText = "Bắt Đầu Học";
      shouldSend = true;
    }
  }

  if (shouldSend) {
    var htmlBody = buildHtmlEmail_(
      u.name,
      subject,
      message,
      streak,
      freezes,
      btnText,
    );
    MailApp.sendEmail({
      to: u.email,
      subject: subject,
      htmlBody: htmlBody,
    });
    props.setProperty(propertyKey, "true");
    Logger.log("[Email] Đã gửi morning reminder thành công cho " + u.name);
  }
}

/** Cấp độ 2: Nhắc nhở Buổi tối (20:00) - Đôn đốc hoàn thành bài học giữ streak */
function checkAndSendEveningReminder_(token, u, todayStr) {
  var propertyKey = "SENT_EVENING_" + u.uid + "_" + todayStr;
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(propertyKey) === "true") {
    return; // Đã gửi rồi
  }

  var statsPath = "artifacts/" + APP_ID + "/users/" + u.uid + "/profile/stats";
  var statsDoc = getDocByPath_(token, statsPath);
  if (!statsDoc || !statsDoc.fields) return;

  var lastCheckIn = stringField_(statsDoc.fields.lastCheckIn) || "";
  var streak = numberField_(statsDoc.fields.streak) || 0;
  var freezes = numberField_(statsDoc.fields.streakFreezes) || 0;

  var now = new Date();
  var todayString = now.toDateString();
  var hasCheckedInToday = lastCheckIn === todayString;

  if (!hasCheckedInToday) {
    var subject =
      "[TT Daily Task] 🔥 Đừng để ngọn lửa Streak của bạn bị dập tắt!";
    var message =
      "Tối muộn rồi mà bạn vẫn chưa hoàn thành bài học nào trong ngày hôm nay sao? 😢<br><br>Cú Duo đang rất buồn đấy... Hãy dành ra ít phút mở ứng dụng học ngay 1 nhiệm vụ để duy trì và thắp sáng chuỗi streak của mình nhé!";
    var btnText = "Vào Học Ngay";
    var htmlBody = buildHtmlEmail_(
      u.name,
      subject,
      message,
      streak,
      freezes,
      btnText,
    );

    MailApp.sendEmail({
      to: u.email,
      subject: subject,
      htmlBody: htmlBody,
    });
    props.setProperty(propertyKey, "true");
    Logger.log("[Email] Đã gửi evening reminder thành công cho " + u.name);
  }
}

/** Cấp độ 3: Cảnh báo khẩn cấp (22:30) - Giờ chót bảo vệ Streak */
function checkAndSendEmergencyReminder_(token, u, todayStr) {
  var propertyKey = "SENT_EMERGENCY_" + u.uid + "_" + todayStr;
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(propertyKey) === "true") {
    return; // Đã gửi rồi
  }

  var statsPath = "artifacts/" + APP_ID + "/users/" + u.uid + "/profile/stats";
  var statsDoc = getDocByPath_(token, statsPath);
  if (!statsDoc || !statsDoc.fields) return;

  var lastCheckIn = stringField_(statsDoc.fields.lastCheckIn) || "";
  var streak = numberField_(statsDoc.fields.streak) || 0;
  var freezes = numberField_(statsDoc.fields.streakFreezes) || 0;

  var now = new Date();
  var todayString = now.toDateString();
  var hasCheckedInToday = lastCheckIn === todayString;

  if (!hasCheckedInToday) {
    var subject =
      "[TT Daily Task] 🚨 KHẨN CẤP: Chỉ còn 1.5 giờ để bảo vệ chuỗi Streak!";
    var message =
      "<b>Nguy hiểm! 🚨</b> Chuỗi <b>" +
      streak +
      " ngày streak</b> liên tục của bạn đang bị đe dọa nghiêm trọng khi chỉ còn chưa đầy 1.5 tiếng nữa là hết ngày!<br><br>" +
      (freezes > 0
        ? "Bạn vẫn còn <b>" +
          freezes +
          " lượt Streak Freeze (Băng)</b> để tự động bảo vệ, nhưng đừng lạm dụng nó. Hãy tự mình hoàn thành bài học để giữ ngọn lửa tự nhiên rực cháy nhé!"
        : "<b>CẢNH BÁO: Bạn đã HẾT lượt Streak Freeze (Băng)!</b> Nếu không hoàn thành bài học trước 24:00 đêm nay, bạn sẽ mất hoàn toàn chuỗi streak này. Hãy vào học gấp!") +
      "<br><br>Cú Duo đang đứng canh cửa và đợi bạn!";
    var btnText = "HỌC CỨU STREAK NGAY";
    var htmlBody = buildHtmlEmail_(
      u.name,
      subject,
      message,
      streak,
      freezes,
      btnText,
    );

    MailApp.sendEmail({
      to: u.email,
      subject: subject,
      htmlBody: htmlBody,
    });
    props.setProperty(propertyKey, "true");
    Logger.log("[Email] Đã gửi emergency reminder thành công cho " + u.name);
  }
}

/** Helper render template HTML Email cao cấp (Dark-mode, responsive) */
function buildHtmlEmail_(uName, title, message, streak, freezes, btnText) {
  var streakHtml = "";
  if (streak !== undefined) {
    streakHtml = `
      <div style="text-align: center; margin: 20px 0;">
        <div style="display: inline-block; background-color: #0f172a; padding: 10px 20px; border-radius: 30px; border: 2px solid #f97316; margin-right: 10px; margin-bottom: 10px;">
          <span style="font-size: 20px; vertical-align: middle;">🔥</span>
          <span style="font-size: 16px; font-weight: 900; color: #f97316; margin-left: 6px; vertical-align: middle;">${streak} NGÀY</span>
        </div>
        <div style="display: inline-block; background-color: #0f172a; padding: 10px 20px; border-radius: 30px; border: 2px solid #38bdf8; margin-bottom: 10px;">
          <span style="font-size: 20px; vertical-align: middle;">❄️</span>
          <span style="font-size: 16px; font-weight: 900; color: #38bdf8; margin-left: 6px; vertical-align: middle;">${freezes} BĂNG</span>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" maxWidth="600px" style="max-width: 600px; background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
              <!-- Logo / Header -->
              <tr>
                <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #334155;">
                  <div style="font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #818cf8; text-transform: uppercase;">
                    ⚡ TT DAILY TASK ⚡
                  </div>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 24px 0 12px 0; text-align: left;">
                  <h2 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0;">Chào ${uName},</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
                    ${message}
                  </p>
                </td>
              </tr>
              
              <!-- Streak Stats Widget -->
              <tr>
                <td align="center">
                  ${streakHtml}
                </td>
              </tr>
              
              <!-- Action Button -->
              <tr>
                <td align="center" style="padding: 12px 0 24px 0;">
                  <a href="https://tt-daily-task.web.app" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                    ${btnText}
                  </a>
                </td>
              </tr>
              
              <!-- Footer/Quote -->
              <tr>
                <td align="center" style="padding-top: 24px; border-top: 1px solid #334155; font-size: 13px; color: #64748b; line-height: 1.5;">
                  <i>"Đừng làm chích bông buồn, hãy hoàn thành bài học mỗi ngày nhé! 😉"</i>
                  <br><br>
                  Email này được gửi tự động từ hệ thống quản lý học tập <b>TT Daily Task Automation</b>.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/** Hàm kiểm thử nhanh hệ thống gửi email từ Apps Script Editor */
function testSendEmailReminders() {
  var token = getFirestoreToken_();
  var u = {
    uid: UID_TIT,
    email: "dinhthai.ctv@gmail.com",
    name: NAME_TIT + " (Bản Test)",
    legacyId: "tit",
  };

  Logger.log("Đang chạy thử nghiệm gửi email mẫu...");

  // 1. Test Morning
  var subjectM =
    "[Test Morning] Chào ngày mới, lên kế hoạch học tập ngay thôi!";
  var msgM =
    "Đây là email thử nghiệm nhắc nhở buổi sáng (Morning Reminder). Bạn nhận được email này vì hệ thống phát hiện bạn chưa lên kế hoạch học tập hôm nay.";
  var htmlBodyM = buildHtmlEmail_(
    u.name,
    subjectM,
    msgM,
    15,
    3,
    "Lên Kế Hoạch Ngay",
  );
  MailApp.sendEmail({ to: u.email, subject: subjectM, htmlBody: htmlBodyM });
  Logger.log("Đã gửi mail Test Morning tới " + u.email);

  // 2. Test Evening
  var subjectE = "[Test Evening] Đừng để ngọn lửa Streak của bạn bị dập tắt!";
  var msgE =
    "Đây là email thử nghiệm nhắc nhở buổi tối (Evening Reminder). Bạn nhận được email này vì hệ thống phát hiện bạn chưa hoàn thành bất kỳ task nào trong ngày.";
  var htmlBodyE = buildHtmlEmail_(
    u.name,
    subjectE,
    msgE,
    15,
    3,
    "Vào Học Ngay",
  );
  MailApp.sendEmail({ to: u.email, subject: subjectE, htmlBody: htmlBodyE });
  Logger.log("Đã gửi mail Test Evening tới " + u.email);

  // 3. Test Emergency
  var subjectEm =
    "[Test Emergency] KHẨN CẤP: Chỉ còn 1.5 giờ để bảo vệ chuỗi Streak!";
  var msgEm =
    "Đây là email thử nghiệm nhắc nhở khẩn cấp (Emergency Alert). Chuỗi 15 ngày streak của bạn đang gặp nguy hiểm vì đã 22h30 đêm rồi!";
  var htmlBodyEm = buildHtmlEmail_(
    u.name,
    subjectEm,
    msgEm,
    15,
    3,
    "HỌC CỨU STREAK NGAY",
  );
  MailApp.sendEmail({ to: u.email, subject: subjectEm, htmlBody: htmlBodyEm });
  Logger.log("Đã gửi mail Test Emergency tới " + u.email);

  Logger.log("Thử nghiệm hoàn tất! Vui lòng kiểm tra hòm thư của bạn.");
}
