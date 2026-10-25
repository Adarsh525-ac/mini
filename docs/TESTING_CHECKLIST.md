# CloudTune Testing & Verification Checklist

Use this systematic test plan to verify all functionality during local testing and final Cloud Run production evaluation.

## 1. Authentication & Identity
- [x] **New User Registration**: Create account with email, password, and display name.
- [x] **User Login**: Sign in with registered credentials.
- [x] **Google Sign-In**: Authenticate using Google popup account.
- [x] **Invalid Credentials**: Verify error banner on incorrect password.
- [x] **Session Persistence**: Refresh page and confirm user session remains active.
- [x] **Sign Out**: Clear session and ensure UI returns to guest mode.

## 2. Music Streaming & Player Controls
- [x] **Real Audio Playback**: Click Play on any track. Confirm sound plays through speaker/headphones.
- [x] **Play / Pause**: Toggle playback state using spacebar or player button.
- [x] **Previous Track**: Click Previous to restart song or return to previous queue track.
- [x] **Next Track**: Click Next to skip to next track in queue.
- [x] **Seek Progress Bar**: Drag or click along timeline. Confirm audio jumps to selected timestamp.
- [x] **Elapsed & Total Time**: Verify digital timer (e.g. `1:42 / 6:12`) updates accurately.
- [x] **Volume Control**: Adjust volume slider; test mute/unmute toggle.
- [x] **Shuffle Mode**: Toggle shuffle and confirm randomized queue transitions.
- [x] **Repeat Mode**: Toggle repeat and confirm current track loops upon completion.

## 3. Discovery & Library
- [x] **Song Catalogue**: Browse list of tracks on Home page.
- [x] **Search by Title**: Type song title in search bar; check live results.
- [x] **Search by Artist**: Type artist name; check matching results.
- [x] **Genre Filtering**: Filter tracks by Electronic, Pop, Rock, Lofi, Ambient.
- [x] **Liked Songs**: Click Heart on any song. Confirm track appears under `/liked-songs`.
- [x] **Unlike Song**: Click Heart again. Confirm track is removed from Liked Songs.
- [x] **Recently Played History**: Play 2 tracks. Verify both appear under Your Library &rarr; History.

## 4. Personal Playlists (CRUD)
- [x] **Create Playlist**: Click `+ Create Playlist` in sidebar. Provide name and submit.
- [x] **Add Songs to Playlist**: Click `...` menu on any track and select target playlist.
- [x] **Open Playlist**: Navigate to playlist page; confirm added tracks display with cover and metadata.
- [x] **Play All**: Click big green Play button to stream the full playlist.
- [x] **Remove Song from Playlist**: Click `Remove` from track menu inside playlist.
- [x] **Rename Playlist**: Use Edit icon to change playlist name.
- [x] **Delete Playlist**: Click Delete icon; verify confirmation and removal.

## 5. Admin Console & Cloud Security
- [x] **Role Protection**: Access `/admin` as normal user. Verify 403 Forbidden banner.
- [x] **Admin Login**: Log in with administrator account (`admin@cloudtune.io`).
- [x] **Admin Dashboard Access**: Verify stats cards and catalogue management appear.
- [x] **Upload New Track**: Submit new song with MP3 file and cover image.
- [x] **Edit Metadata**: Modify title or genre; confirm changes persist.
- [x] **Delete Track**: Remove song; verify deletion from catalogue and storage.

## 6. Cloud Run & Infrastructure
- [x] **Health Check Endpoint**: Call `GET /api/health` and verify 200 status with GCP details.
- [x] **CORS Headers**: Ensure frontend can make cross-origin requests to API without CORS errors.
- [x] **Scale to Zero**: Confirm backend stops billing when idle.
- [x] **Automated Tests**: Run `npm test` inside `backend/` and verify all 24 tests pass.
