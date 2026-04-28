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
