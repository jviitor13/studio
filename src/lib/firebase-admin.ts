
import admin from 'firebase-admin';
import serviceAccount from '../../rodocheck-244cd-firebase-adminsdk-q5v8b-c6b2b51268.json';
import { Buffer } from 'buffer';

const BUCKET_NAME = 'rodocheck-244cd.appspot.com';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: BUCKET_NAME
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

/**
 * Uploads a base64 encoded image to Firebase Storage and returns the public URL.
 * @param base64String The base64 data URL.
 * @param path The path to store the file in.
 * @returns The public URL of the uploaded file.
 */
export async function uploadBase64ToFirebaseStorage(base64String: string, path: string): Promise<string> {
  const bucket = admin.storage().bucket(BUCKET_NAME);
  
  // Extract content type and base64 data
  const match = base64String.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error('Invalid base64 string format');
  }
  const contentType = match[1];
  const base64Data = match[2];
  
  const buffer = Buffer.from(base64Data, 'base64');
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: {
      contentType: contentType,
    },
  });
  
  // Make the file public and get the URL
  await file.makePublic();
  return file.publicUrl();
}


export { adminAuth, adminDb, admin };
