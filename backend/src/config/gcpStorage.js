import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const BUCKET_NAME = process.env.GCP_STORAGE_BUCKET_NAME || 'cloudtune-media-bucket';

let storageClient = null;
let bucket = null;
let isGcsAvailable = false;

try {
  if (process.env.ENABLE_GCS_UPLOAD === 'true') {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      storageClient = new Storage({
        credentials: creds,
        projectId: creds.project_id
      });
    } else {
      storageClient = new Storage();
    }
    bucket = storageClient.bucket(BUCKET_NAME);
    isGcsAvailable = true;
    console.log(`📦 Cloud Storage initialized with target bucket: ${BUCKET_NAME}`);
  } else {
    console.log('ℹ️ Cloud Storage: Local media delivery mode active.');
    isGcsAvailable = false;
  }
} catch (error) {
  console.warn('⚠️ Google Cloud Storage client unavailable. Using local fallback storage:', error.message);
  isGcsAvailable = false;
}

/**
 * Upload a file to Cloud Storage (or save to local uploads directory)
 */
export const uploadFileToStorage = async (fileBuffer, destinationPath, contentType) => {
  if (isGcsAvailable && process.env.ENABLE_GCS_UPLOAD === 'true') {
    try {
      const file = bucket.file(destinationPath);
      await file.save(fileBuffer, {
        metadata: {
          contentType: contentType,
          cacheControl: 'public, max-age=31536000',
        },
        resumable: false
      });
      return {
        path: destinationPath,
        storageType: 'gcs',
        bucket: BUCKET_NAME
      };
    } catch (gcsError) {
      console.warn('GCS upload error, falling back to local file storage:', gcsError.message);
    }
  }

  // Local filesystem fallback
  const localDir = path.resolve('uploads', path.dirname(destinationPath));
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localFilePath = path.resolve('uploads', destinationPath);
  fs.writeFileSync(localFilePath, fileBuffer);

  return {
    path: destinationPath,
    storageType: 'local',
    localUrl: `/uploads/${destinationPath.replace(/\\/g, '/')}`
  };
};

/**
 * Generate a short-lived V4 signed URL for audio streaming
 * Duration: 60 minutes
 */
export const generateSignedStreamUrl = async (objectPath, expiresInMinutes = 60) => {
  if (isGcsAvailable && process.env.ENABLE_GCS_UPLOAD === 'true') {
    try {
      const file = bucket.file(objectPath);
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInMinutes * 60 * 1000, // 1 hour
      });
      return url;
    } catch (signedUrlErr) {
      console.warn('Failed to generate GCS signed URL:', signedUrlErr.message);
    }
  }

  // Fallback: Return local streaming endpoint or demo path
  return `/api/songs/stream-local?file=${encodeURIComponent(objectPath)}`;
};

/**
 * Delete object from storage
 */
export const deleteFileFromStorage = async (objectPath) => {
  if (isGcsAvailable && process.env.ENABLE_GCS_UPLOAD === 'true') {
    try {
      await bucket.file(objectPath).delete();
    } catch (err) {
      console.warn(`Could not delete GCS object ${objectPath}:`, err.message);
    }
  }

  // Remove local file if present
  try {
    const localFilePath = path.resolve('uploads', objectPath);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  } catch {}
};

export { storageClient, bucket, isGcsAvailable, BUCKET_NAME };
