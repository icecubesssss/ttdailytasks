import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const keyPath = path.join(ROOT, 'tt-daily-task.service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function main() {
  const collectionPath = 'artifacts/tt-daily-task/public/data/tasks';
  console.log('Querying active tasks from:', collectionPath);
  
  // Query only non-completed tasks
  const snap = await db.collection(collectionPath)
    .where('status', 'in', ['idle', 'running', 'paused'])
    .get();
    
  console.log(`Active tasks found: ${snap.size}`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id} | Title: "${data.title}" | Status: ${data.status} | Start: ${data.scheduledStartTime ? new Date(data.scheduledStartTime).toLocaleString() : 'N/A'}`);
  });

  // Query tasks for calendar sync check (e.g. from 24h ago to 48h future)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  console.log('\nQuerying tasks for calendar sync check (scheduledStartTime >= oneDayAgo):');
  const syncSnap = await db.collection(collectionPath)
    .where('scheduledStartTime', '>=', oneDayAgo)
    .get();
  console.log(`Tasks for sync found: ${syncSnap.size}`);
  syncSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${doc.id} | Title: "${data.title}" | Status: ${data.status} | Start: ${data.scheduledStartTime ? new Date(data.scheduledStartTime).toLocaleString() : 'N/A'}`);
  });
}

main().catch(console.error);
