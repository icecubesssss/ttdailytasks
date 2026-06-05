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
  console.log('Querying collection:', collectionPath);
  const snap = await db.collection(collectionPath).get();
  console.log(`Total tasks found: ${snap.size}`);
  
  const tasks = [];
  snap.forEach(doc => {
    const data = doc.data();
    tasks.push({
      id: doc.id,
      title: data.title,
      scheduledStartTime: data.scheduledStartTime,
      calendarEventId: data.calendarEventId,
      createdBy: data.createdBy,
      assigneeId: data.assigneeId
    });
  });

  // Sort by scheduledStartTime descending
  tasks.sort((a, b) => (b.scheduledStartTime || 0) - (a.scheduledStartTime || 0));

  console.log('\nRecent 50 Tasks:');
  tasks.slice(0, 50).forEach(t => {
    console.log(`- ID: ${t.id} | Title: "${t.title}" | Start: ${t.scheduledStartTime ? new Date(t.scheduledStartTime).toLocaleString() : 'N/A'} | CalEventId: ${t.calendarEventId} | CreatedBy: ${t.createdBy} | Assignee: ${t.assigneeId}`);
  });

  // Check for duplicates
  const seen = new Map();
  const duplicates = [];
  tasks.forEach(t => {
    if (!t.title || !t.scheduledStartTime) return;
    const key = `${t.title}-${t.scheduledStartTime}-${t.assigneeId}`;
    if (seen.has(key)) {
      duplicates.push({ first: seen.get(key), duplicate: t });
    } else {
      seen.set(key, t);
    }
  });

  console.log(`\nFound ${duplicates.length} duplicate tasks by (Title, StartTime, Assignee):`);
  duplicates.slice(0, 20).forEach(d => {
    console.log(`- Duplicate pair:`);
    console.log(`  1) ID: ${d.first.id} | CalEventId: ${d.first.calendarEventId} | CreatedBy: ${d.first.createdBy}`);
    console.log(`  2) ID: ${d.duplicate.id} | CalEventId: ${d.duplicate.calendarEventId} | CreatedBy: ${d.duplicate.createdBy}`);
  });
}

main().catch(console.error);
