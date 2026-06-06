/**
 * TT DAILY TASK — FULL AUTOMATION SYSTEM v7.0
 * ============================================================================
 * Bản hợp nhất chạy NỀN trên Google Apps Script (KHÔNG cần mở web app):
 *   1) doGet            — proxy cho web app đọc Google Calendar (như cũ).
 *   2) syncCalendarToTasks — *** MỚI *** TẠO task từ Calendar vào Firestore.
 *   3) checkHeartbeatTimeout — tự start/done task tự động, tự pause task thủ công.
 *   4) runAutomation    — hàm trigger gọi (2) rồi (3); cài chạy mỗi 5 phút.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PHIÊN BẢN v6.0 CŨ CHỈ QUẢN LÝ VÒNG ĐỜI TASK, KHÔNG TẠO TASK TỪ LỊCH.
 *     v7.0 bổ sung syncCalendarToTasks() để task tự sinh kể cả khi bạn offline.
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
var PROJECT_ID = 'tt-daily-task';
var APP_ID = 'tt-daily-task';
var CALENDAR_ID_TIT = 'thaitd.mathtech@gmail.com';
var CALENDAR_ID_TUN = '9bfaacc5ea449c8dd82d1fd5018c4032ddeb4e0d6abb0f901fb5287928762c3d@group.calendar.google.com';
var UID_TIT = 'XR4Z15wXvrgoY68XKPcEzDfhbBz1';
var UID_TUN = 'DnvU6r5jGBZu9oKBQpaummXtId93';
var NAME_TIT = 'Tít';
var NAME_TUN = 'Tún';
var TIMEOUT_MS = 5 * 60 * 1000;   // quá 5' không có heartbeat -> pause task thủ công
var MIN_DURATION_MINS = 25;       // thời lượng tối thiểu cho countdown
// Service Account — ưu tiên Script Properties; fallback: sa-credentials.gs (local)
var SA_EMAIL = '';
var SA_PRIVATE_KEY = '';
// ===================

var TASKS_PATH = 'projects/' + PROJECT_ID + '/databases/(default)/documents/artifacts/' +
  APP_ID + '/public/data/tasks';
var TASKS_URL = 'https://firestore.googleapis.com/v1/' + TASKS_PATH;

/** Cài/làm mới trigger: runAutomation chạy mỗi ngày vào lúc 2h sáng. Chỉ chạy 1 lần. */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runAutomation') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runAutomation')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
  Logger.log('Đã cài trigger: runAutomation chạy mỗi ngày vào lúc 2h sáng.');
}

/** Hàm trigger gọi mỗi ngày vào lúc 2h sáng để đồng bộ task từ Calendar. */
function runAutomation() {
  var token = getFirestoreToken_();           // Service Account token
  var docs = listAllTasks_(token);            // fetch 1 lần, dùng chung
  if (docs === null) {
    Logger.log('[Automation] Bỏ qua — không đọc được tasks từ Firestore.');
    return;
  }
  syncCalendarToTasks_(token, docs);          // tạo task còn thiếu cho ngày mới
}

/* ============================================================================
 * (1) PROXY ĐỌC LỊCH CHO WEB APP — giữ nguyên hành vi v6.0
 * ==========================================================================*/
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'uploadMusic') {
      return uploadMusicToDrive_(body);
    }
    return jsonOut_({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOut_({ success: false, error: err.toString() });
  }
}

function uploadMusicToDrive_(body) {
  var fileName = body.fileName || 'track.mp3';
  var mimeType = body.mimeType || 'audio/mpeg';
  if (!body.base64) {
    return jsonOut_({ success: false, error: 'Missing file data' });
  }

  var blob = Utilities.newBlob(Utilities.base64Decode(body.base64), mimeType, fileName);
  var folderName = 'TT Daily Task Music';
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonOut_({
    success: true,
    id: file.getId(),
    url: 'https://drive.google.com/uc?export=download&id=' + file.getId()
  });
}

function doGet(e) {
  if (e.parameter.mode === 'widget') {
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
        return jsonOut_({ error: 'Script không có quyền truy cập lịch này.' });
      }
      var events = calendar.getEvents(new Date(timeMin), new Date(timeMax));
      var formatted = events.map(function (ev) {
        return {
          id: ev.getId(),
          summary: ev.getTitle(),
          location: ev.getLocation(),
          start: { dateTime: ev.getStartTime().toISOString() },
          end: { dateTime: ev.getEndTime().toISOString() }
        };
      });
      return jsonOut_({ items: formatted });
    } catch (err) {
      return jsonOut_({ error: err.toString() });
    }
  }
  return ContentService.createTextOutput('System Active!').setMimeType(ContentService.MimeType.TEXT);
}

/* ============================================================================
 * (2) TẠO TASK TỪ CALENDAR  — phần MỚI, lõi giải quyết "tự tạo khi offline"
 * ==========================================================================*/
function syncCalendarToTasks() {              // bản gọi tay để test
  var token = getFirestoreToken_();
  syncCalendarToTasks_(token, listAllTasks_(token));
}

function normalizeEventId_(id) {
  if (!id) return '';
  return String(id).replace(/@google\.com$/i, '').split('_')[0];
}

function taskMatchesCalendarEvent_(doc, ev) {
  var f = doc.fields || {};
  var calId = stringField_(f.calendarEventId);
  if (calId && ev.id) {
    if (calId === ev.id) return true;
    if (normalizeEventId_(calId) === normalizeEventId_(ev.id)) return true;
  }
  return (
    stringField_(f.title) === ev.title &&
    numberField_(f.scheduledStartTime) === ev.start &&
    stringField_(f.assigneeId) === ev.assigneeId
  );
}

function syncCalendarToTasks_(token, existingDocs) {
  if (existingDocs === null) {
    Logger.log('[Sync] Bỏ qua tạo task — không đọc được danh sách hiện có.');
    return [];
  }

  var now = Date.now();
  var tMin = new Date(now - 24 * 3600 * 1000);          // 24h trước
  var tMax = new Date(now + 2 * 24 * 3600 * 1000);      // 2 ngày tới

  var events = []
    .concat(readCalendar_(CALENDAR_ID_TIT, 'tit', tMin, tMax))
    .concat(readCalendar_(CALENDAR_ID_TUN, 'tun', tMin, tMax));

  var created = 0;
  var createdDocs = [];
  events.forEach(function (ev) {
    var exists = (existingDocs || []).some(function (d) {
      return taskMatchesCalendarEvent_(d, ev);
    });
    if (exists) return;

    var createdDoc = createTaskDoc_(token, ev);
    if (createdDoc) {
      createdDocs.push(createdDoc);
      existingDocs.push(createdDoc);
      created++;
    }
  });
  Logger.log('[Sync] Tạo mới ' + created + '/' + events.length + ' task từ lịch.');
  return createdDocs;
}

function readCalendar_(calId, owner, tMin, tMax) {
  if (!calId) return [];
  var cal = CalendarApp.getCalendarById(calId);
  if (!cal) { Logger.log('[Sync] Không mở được lịch: ' + calId); return []; }
  var uid = owner === 'tit' ? UID_TIT : UID_TUN;
  var name = owner === 'tit' ? NAME_TIT : NAME_TUN;

  return cal.getEvents(tMin, tMax)
    .filter(function (e) { return !e.isAllDayEvent(); })
    .map(function (e) {
      var start = e.getStartTime().getTime();
      var end = e.getEndTime().getTime();
      return {
        id: e.getId(),
        title: e.getTitle() || '(Không tiêu đề)',
        owner: owner,
        assigneeId: uid || owner,
        assigneeName: name,
        start: start,
        end: end,
        durationMins: Math.max(MIN_DURATION_MINS, Math.round((end - start) / 60000)),
        durationMs: Math.max(MIN_DURATION_MINS * 60 * 1000, end - start),
        isPast: end < Date.now()
      };
    });
}

function createTaskDoc_(token, ev) {
  var fields = {
    title:              { stringValue: ev.title },
    createdBy:          { stringValue: 'system-autosync-gas' },
    creatorName:        { stringValue: 'AutoSync' },
    assigneeId:         { stringValue: ev.assigneeId },
    assigneeName:       { stringValue: ev.assigneeName },
    assigneePhoto:      { nullValue: null },
    deadline:           { integerValue: String(ev.end) },
    scheduledStartTime: { integerValue: String(ev.start) },
    scheduledEndTime:   { integerValue: String(ev.end) },
    calendarEventId:    { stringValue: ev.id },
    priority:           { stringValue: 'medium' },
    type:               { stringValue: 'stopwatch' },
    limitTime:          { integerValue: '0' },
    isDone:             { booleanValue: ev.isPast },
    status:             { stringValue: ev.isPast ? 'completed' : 'idle' },
    totalTrackedTime:   { integerValue: String(ev.isPast ? ev.durationMs : 0) },
    createdAt:          { integerValue: String(Date.now()) },
    subTasks:           { arrayValue: { values: [] } },
    isAutomated:        { booleanValue: false }
  };
  if (ev.isPast) fields.endTime = { integerValue: String(ev.end) };

  var res = UrlFetchApp.fetch(TASKS_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() >= 300) {
    Logger.log('[Sync] Lỗi tạo task "' + ev.title + '": ' + res.getContentText());
    return null;
  }
  return JSON.parse(res.getContentText());
}

/* ============================================================================
 * (3) VÒNG ĐỜI TASK — logic v6.0, tách hàm để dùng chung danh sách docs
 * ==========================================================================*/
function checkHeartbeatTimeout() {            // bản gọi tay để test
  var token = getFirestoreToken_();
  processTaskLifecycle_(token, listAllTasks_(token));
}

/** Chạy MỘT LẦN: dán nội dung file JSON service account vào biến `json`. */
function setupServiceAccountFromJson() {
  var json = ''; // <-- dán JSON Firebase service account vào đây
  if (!json) {
    throw new Error('Dán nội dung file JSON service account vào biến json trong hàm này.');
  }
  var sa = JSON.parse(json);
  if (!sa.client_email || !sa.private_key) {
    throw new Error('JSON thiếu client_email hoặc private_key.');
  }
  PropertiesService.getScriptProperties().setProperties({
    SA_CLIENT_EMAIL: sa.client_email,
    SA_PRIVATE_KEY: sa.private_key
  });
  Logger.log('Đã lưu Script Properties. SA_CLIENT_EMAIL=' + sa.client_email);
}

function verifyFirestoreAccess() {
  var creds = getServiceAccountCredentials_();
  Logger.log('[Verify] SA_CLIENT_EMAIL=' + creds.email);
  var token = getFirestoreToken_();
  var resp = UrlFetchApp.fetch(TASKS_URL + '?pageSize=1', {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  Logger.log('[Verify] List tasks status=' + resp.getResponseCode());
  Logger.log('[Verify] Body=' + resp.getContentText());
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
      if (status === 'idle' && now >= startTime && now < endTime) {
        patchFirestore(doc.name, {
          status: { stringValue: 'running' },
          lastStartTime: { integerValue: String(now) },
          currentWorker: f.assigneeId || { nullValue: null },
          currentWorkerName: f.assigneeName || { stringValue: 'AutoSync' }
        });
        return;
      }
      if (status === 'running' && now >= endTime) {
        completeAutomatedTask_(doc.name, f, endTime);
        return;
      }
      return;
    }

    // --- TASK THỦ CÔNG: pause khi mất heartbeat quá hạn ---
    if (status === 'running') {
      var lastHB = Number((f.lastHeartbeat || {}).integerValue || 0);
      var lastStart = Number((f.lastStartTime || {}).integerValue || 0);
      var ref = lastHB || lastStart;
      if (ref && (now - ref > TIMEOUT_MS)) {
        var activeTime = lastHB ? Math.max(0, lastHB - lastStart) : 0;
        var prevTracked = Number((f.totalTrackedTime || {}).integerValue || 0);
        patchFirestore(doc.name, {
          status: { stringValue: 'paused' },
          totalTrackedTime: { integerValue: String(prevTracked + activeTime) },
          lastStartTime: { nullValue: null },
          currentWorker: { nullValue: null },
          lastHeartbeat: { nullValue: null },
          autoPauseReason: { stringValue: 'heartbeat_timeout' }
        });
        Logger.log('[Life] Auto-paused task thủ công do timeout.');
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
    status: { stringValue: 'completed' },
    isDone: { booleanValue: true },
    totalTrackedTime: { integerValue: String(finalTime) },
    endTime: { integerValue: String(endTime) },
    lastStartTime: { nullValue: null },
    currentWorker: { nullValue: null }
  });
  Logger.log('[Life] Auto-completed task calendar: ' + docName);
}

/* ============================================================================
 * HELPERS
 * ==========================================================================*/

/** Lấy TẤT CẢ task (có phân trang) để không sót khi > 20 task. */
function listAllTasks_(token) {
  var headers = { Authorization: 'Bearer ' + token };
  var all = [];
  var pageToken = '';
  do {
    var url = TASKS_URL + '?pageSize=300' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
    var resp = UrlFetchApp.fetch(url, { headers: headers, muteHttpExceptions: true });
    if (resp.getResponseCode() >= 300) {
      Logger.log('[List] Lỗi đọc tasks (' + resp.getResponseCode() + '): ' + resp.getContentText());
      return null;
    }
    var data = JSON.parse(resp.getContentText());
    if (data.documents) all = all.concat(data.documents);
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return all;
}

/** PATCH 1 document Firestore qua REST API. */
function patchFirestore(docName, fields) {
  var token = getFirestoreToken_();
  var mask = Object.keys(fields).map(function (p) { return 'updateMask.fieldPaths=' + p; }).join('&');
  UrlFetchApp.fetch('https://firestore.googleapis.com/v1/' + docName + '?' + mask, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getWidgetPayload_(userKey) {
  var key = (userKey || 'tit').toLowerCase();
  var users = {
    tit: { uid: UID_TIT, legacyId: 'tit' },
    tun: { uid: UID_TUN, legacyId: 'tun' }
  };
  var user = users[key] || users.tit;
  var token = getFirestoreToken_();
  var statsDoc = getDocByPath_(token, 'artifacts/' + APP_ID + '/public/data/team_members/' + user.uid);
  var tasks = listAllTasks_(token).map(function (doc) {
    var f = doc.fields || {};
    return {
      id: doc.name.split('/').pop(),
      title: stringField_(f.title),
      status: stringField_(f.status),
      currentWorker: stringField_(f.currentWorker),
      assigneeId: stringField_(f.assigneeId),
      scheduledStartTime: numberField_(f.scheduledStartTime),
      deadline: numberField_(f.deadline)
    };
  });
  return {
    stats: {
      streak:        numberField_((statsDoc && statsDoc.fields || {}).streak),
      level:         numberField_((statsDoc && statsDoc.fields || {}).level),
      xp:            numberField_((statsDoc && statsDoc.fields || {}).xp),
      ttGold:        numberField_((statsDoc && statsDoc.fields || {}).ttGold),
      streakFreezes: numberField_((statsDoc && statsDoc.fields || {}).streakFreezes),
      updatedAt:     numberField_((statsDoc && statsDoc.fields || {}).updatedAt)
    },
    tasks: tasks
  };
}

function getDocByPath_(token, path) {
  var resp = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
    '/databases/(default)/documents/' + path, {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });
  if (resp.getResponseCode() >= 300) return null;
  return JSON.parse(resp.getContentText());
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
var _SA_TOKEN_CACHE = null;   // cache trong 1 lần thực thi

/** Đọc service account từ Script Properties, SA_JSON, hoặc hằng số SA_EMAIL. */
function getServiceAccountCredentials_() {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('SA_CLIENT_EMAIL');
  var key = props.getProperty('SA_PRIVATE_KEY');

  if (!email || !key) {
    var jsonRaw = props.getProperty('SA_JSON');
    if (jsonRaw) {
      var sa = JSON.parse(jsonRaw);
      email = sa.client_email;
      key = sa.private_key;
    }
  }

  email = email || SA_EMAIL;
  key = key || SA_PRIVATE_KEY;
  key = (key || '').replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error(
      'Thiếu Service Account. Xem mục B đầu file:\n' +
      '  • Script Properties: SA_CLIENT_EMAIL + SA_PRIVATE_KEY\n' +
      '  • hoặc SA_JSON (dán cả file JSON)\n' +
      '  • hoặc điền SA_EMAIL / SA_PRIVATE_KEY trong CẤU HÌNH\n' +
      '  • hoặc chạy setupServiceAccountFromJson() một lần'
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
  var header = { alg: 'RS256', typ: 'JWT' };
  var claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  };
  var toSign = b64url_(JSON.stringify(header)) + '.' + b64url_(JSON.stringify(claim));
  var sig = Utilities.computeRsaSha256Signature(toSign, key);
  var jwt = toSign + '.' + Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');

  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt },
    muteHttpExceptions: true
  });
  var token = JSON.parse(res.getContentText()).access_token;
  if (!token) throw new Error('Không lấy được token Service Account: ' + res.getContentText());
  _SA_TOKEN_CACHE = token;
  return token;
}

function b64url_(s) {
  return Utilities.base64EncodeWebSafe(Utilities.newBlob(s).getBytes()).replace(/=+$/, '');
}
