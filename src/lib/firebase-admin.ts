
import * as admin from 'firebase-admin';

// This is the one place we use require
const serviceAccount = require('../../rodocheck-244cd-firebase-adminsdk-q5v8b-c6b2b51268.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };
