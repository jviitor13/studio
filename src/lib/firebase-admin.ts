
import * as admin from 'firebase-admin';

const getFirebaseAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('The GOOGLE_PRIVATE_KEY environment variable is not set.');
    }

    const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.GOOGLE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, '\n'),
    };

    try {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error: any) {
        console.error('Firebase admin initialization error:', error);
        // Throw a more specific error if initialization fails
        throw new Error(`Firebase admin initialization failed: ${error.message}`);
    }
};

const app = getFirebaseAdminApp();
const adminAuth = app.auth();
const adminDb = app.firestore();

export { adminAuth, adminDb };
