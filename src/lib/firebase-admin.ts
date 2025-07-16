
import admin from 'firebase-admin';
import serviceAccount from '../../rodocheck-244cd-firebase-adminsdk-q5v8b-c6b2b51268.json';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };
