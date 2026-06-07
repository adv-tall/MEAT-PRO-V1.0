import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./firebase-blueprint.json', 'utf-8'));
} catch (e) {
  serviceAccount = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
}

if (!serviceAccount.projectId) {
    serviceAccount = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
}

initializeApp({
  projectId: serviceAccount.projectId
});

const db = getFirestore();

async function cleanup() {
  const collRef = db.collection('Std_Process_Time');
  const snapshot = await collRef.get();
  let deletedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let isBad = false;

    if (
      (data.id && typeof data.id === 'object') ||
      (data.name && typeof data.name === 'object') ||
      (data.category && typeof data.category === 'object') ||
      (data.status && typeof data.status === 'object') ||
      (data.rawWeightPerBatch && typeof data.rawWeightPerBatch === 'object')
    ) {
      isBad = true;
    }

    if (isBad) {
      console.log(`Deleting bad document: ${doc.id}`);
      await doc.ref.delete();
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} bad documents from Firestore.`);
  process.exit(0);
}

cleanup().catch(e => {
  console.error(e);
  process.exit(1);
});
