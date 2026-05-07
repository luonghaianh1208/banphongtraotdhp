/**
 * One-off script: xóa toàn bộ đơn vị test cũ trong Firestore + Firebase Auth
 * Chạy: node scripts/cleanup-old-units.js
 * Yêu cầu: firebase-admin đã cài trong functions/
 */
const admin = require('firebase-admin');
const path = require('path');

// Use service account from functions directory or default credentials
const serviceAccountPath = path.join(__dirname, '..', 'functions', 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch {
  // Fallback to default credentials (if running in CI or with GOOGLE_APPLICATION_CREDENTIALS)
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

async function deleteAllUnits() {
  console.log('🔍 Đang tìm tất cả đơn vị trong collection "units"...');
  
  const unitsSnap = await db.collection('units').get();
  
  if (unitsSnap.empty) {
    console.log('✅ Không có đơn vị nào để xóa.');
    return;
  }
  
  console.log(`📋 Tìm thấy ${unitsSnap.size} đơn vị. Bắt đầu xóa...`);
  
  for (const unitDoc of unitsSnap.docs) {
    const unitId = unitDoc.id;
    const data = unitDoc.data();
    console.log(`\n🗑️  Xóa đơn vị: "${data.unitName || data.displayName}" (ID: ${unitId})`);
    
    // 1. Xóa criteriaSubmissions
    const subsSnap = await db.collection('criteriaSubmissions').where('unitId', '==', unitId).get();
    if (!subsSnap.empty) {
      const batch = db.batch();
      subsSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log(`   ↳ Đã xóa ${subsSnap.size} criteriaSubmissions`);
    }
    
    // 2. Xóa criteriaAssignments
    const assignSnap = await db.collection('criteriaAssignments').where('unitId', '==', unitId).get();
    if (!assignSnap.empty) {
      const batch = db.batch();
      assignSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log(`   ↳ Đã xóa ${assignSnap.size} criteriaAssignments`);
    }
    
    // 3. Xóa contestEntries
    const entriesSnap = await db.collection('contestEntries').where('unitId', '==', unitId).get();
    if (!entriesSnap.empty) {
      const batch = db.batch();
      entriesSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      console.log(`   ↳ Đã xóa ${entriesSnap.size} contestEntries`);
    }
    
    // 4. Xóa Firebase Auth user
    try {
      await auth.deleteUser(unitId);
      console.log(`   ↳ Đã xóa Firebase Auth user`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`   ↳ Firebase Auth user không tồn tại (skip)`);
      } else {
        console.error(`   ↳ Lỗi xóa Auth: ${err.message}`);
      }
    }
    
    // 5. Xóa Firestore document
    await unitDoc.ref.delete();
    console.log(`   ↳ Đã xóa Firestore document`);
  }
  
  console.log(`\n✅ Hoàn tất! Đã xóa ${unitsSnap.size} đơn vị test.`);
}

deleteAllUnits()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  });
