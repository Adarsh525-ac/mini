import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let adminAuth = null;
let firestoreDb = null;
let isFirebaseInitialized = false;

try {
  // Check if Firebase service account credentials are provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.GCP_STORAGE_BUCKET_NAME || `${serviceAccount.project_id}.appspot.com`
    });
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin initialized with service account key.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Standard Google Cloud Run / ADC authentication
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.GCP_STORAGE_BUCKET_NAME
    });
    isFirebaseInitialized = true;
    console.log('✅ Firebase Admin initialized via Google Application Default Credentials.');
  } else if (process.env.K_SERVICE && process.env.GCP_PROJECT_ID) {
    // Running inside GCP Cloud Run with attached service account
    try {
      admin.initializeApp({
        projectId: process.env.GCP_PROJECT_ID,
        storageBucket: process.env.GCP_STORAGE_BUCKET_NAME
      });
      isFirebaseInitialized = true;
      console.log('✅ Firebase Admin initialized within GCP Cloud Run environment.');
    } catch (e) {
      console.warn('⚠️ Cloud Run default credential init failed:', e.message);
    }
  } else {
    console.log('ℹ️ Local Development Mode: Using in-memory store & local audio fallback.');
    isFirebaseInitialized = false;
  }

  if (isFirebaseInitialized) {
    adminAuth = admin.auth();
    firestoreDb = admin.firestore();
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization deferred/failed:', error.message);
  isFirebaseInitialized = false;
}

export { admin, adminAuth, firestoreDb, isFirebaseInitialized };
