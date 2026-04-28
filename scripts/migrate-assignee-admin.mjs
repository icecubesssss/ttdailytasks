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
