# CloudTune REST API Specification

Base URL (Local): `http://localhost:5000/api`  
Base URL (Cloud Run Production): `https://<service-url>.a.run.app/api`

---

## 1. System Health & Diagnostics

### `GET /api/health`
Inspect system health, uptime, GCP region, and connected storage/database engines.
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-12T21:40:00.000Z",
  "service": "CloudTune Music Streaming API",
  "platform": "Google Cloud Platform (Cloud Run)",
  "region": "us-central1",
  "uptimeSeconds": 1420,
  "features": {
    "firestore": "connected",
    "cloudStorage": "connected",
    "storageBucket": "cloudtune-media-bucket"
  }
}
```

---

## 2. Songs & Catalogue

### `GET /api/songs`
List tracks with optional search query, genre filtering, and pagination.
- **Access**: Public / Optional Auth
- **Query Parameters**:
  - `q` (string): Search across title, artist name, and album.
  - `genre` (string): Filter by genre (`Electronic`, `Pop`, `Rock`, `Lofi`, etc.).
  - `page` (number): Page number (default: `1`).
  - `limit` (number): Items per page (default: `20`).
- **Response `200 OK`**:
```json
{
  "total": 6,
  "page": 1,
  "limit": 20,
  "songs": [
    {
      "id": "song-1",
      "title": "SoundHelix Song 1",
      "artistId": "artist-1",
      "artistName": "SoundHelix Ensemble",
      "albumId": "album-1",
      "albumName": "Algorithmic Symphonies",
      "genre": "Electronic",
      "duration": 372,
      "audioObjectPath": "audio/song-1.mp3",
      "coverObjectPath": "covers/cover-1.jpg",
      "coverUrl": "https://images.unsplash.com/...",
      "createdAt": "2026-10-12T21:00:00.000Z"
    }
  ]
}
```

### `GET /api/songs/:id`
Retrieve metadata for a single song.
- **Access**: Public

### `GET /api/songs/:id/stream`
Generates a short-lived signed URL for audio streaming.
- **Access**: Public / Authenticated
- **Response `200 OK`**:
```json
{
  "streamUrl": "https://storage.googleapis.com/cloudtune-media-bucket/audio/song-1.mp3?X-Goog-Algorithm=GOOG4-RSA-SHA256&...",
  "expiresInMinutes": 60,
  "protocol": "HTTPS Signed URL"
}
```

---

## 3. Artists & Albums

### `GET /api/artists`
Retrieve artist profiles and biographies.

### `GET /api/albums`
Retrieve curated album collections.

---

## 4. Playlists

### `GET /api/playlists`
Retrieve playlists owned by authenticated user.
- **Access**: Private (Requires `Authorization: Bearer <token>`)

### `POST /api/playlists`
Create a personal playlist.
- **Access**: Private
- **Request Body**:
```json
{
  "name": "Cloud Computing Study Beats"
}
```

### `PATCH /api/playlists/:id`
Rename playlist (Enforces owner check).

### `DELETE /api/playlists/:id`
Delete playlist (Enforces owner check).

### `POST /api/playlists/:id/songs`
Add a track to playlist.
- **Request Body**: `{ "songId": "song-1" }`

### `DELETE /api/playlists/:id/songs/:songId`
Remove track from playlist.

---

## 5. User Activity (Likes & History)

### `GET /api/users/me`
Retrieve user profile and server-verified role.

### `GET /api/users/me/likes`
List user's liked tracks.

### `POST /api/songs/:id/like`
Like a track.

### `DELETE /api/songs/:id/like`
Unlike a track.

### `GET /api/users/me/history`
List recently played tracks.

### `POST /api/users/me/history`
Record song playback event.
- **Request Body**: `{ "songId": "song-1" }`

---

## 6. Admin Endpoints

Protected by `verifyAuth` and `verifyAdmin` middleware.

### `GET /api/admin/stats`
Retrieve server and catalogue metrics.

### `POST /api/admin/songs`
Upload new track audio and album art.
- **Content-Type**: `multipart/form-data`
- **Fields**: `title`, `artistName`, `albumName`, `genre`, `duration`, `coverUrl`, `audio` (file), `cover` (file).

### `PATCH /api/admin/songs/:id`
Update song metadata.

### `DELETE /api/admin/songs/:id`
Permanently remove song and media objects from Cloud Storage and Firestore.
