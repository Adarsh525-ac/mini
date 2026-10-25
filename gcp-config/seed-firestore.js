/**
 * Script to seed initial songs, artists, and albums into Google Cloud Firestore
 * Usage:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="path/to/key.json"
 *   node gcp-config/seed-firestore.js
 */
import admin from 'firebase-admin';
import { initialSongs, initialArtists, initialAlbums } from '../backend/src/utils/seedData.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
}

const db = admin.firestore();

async function seed() {
  console.log('🌱 Seeding CloudTune catalogue to Firestore...');

  // Seed Artists
  for (const artist of initialArtists) {
    await db.collection('artists').doc(artist.id).set(artist, { merge: true });
    console.log(`  ✅ Seeded Artist: ${artist.name}`);
  }

  // Seed Albums
  for (const album of initialAlbums) {
    await db.collection('albums').doc(album.id).set(album, { merge: true });
    console.log(`  ✅ Seeded Album: ${album.title}`);
  }

  // Seed Songs
  for (const song of initialSongs) {
    await db.collection('songs').doc(song.id).set(song, { merge: true });
    console.log(`  ✅ Seeded Song: ${song.title}`);
  }

  console.log('\n🎉 Firestore seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
