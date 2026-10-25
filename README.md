# 🎵 CloudTune — Spotify Clone on Google Cloud Platform

**CloudTune** is a complete, cloud-native music streaming platform built for an **MCA Cloud Computing** academic project. It features a responsive Spotify-inspired dark UI, real HTML5 audio playback, personal playlists, likes, listening history, and a protected Administrator Console.

The application is architected to run seamlessly **locally during development** and be deployable to **Google Cloud Platform (GCP)** leveraging **Cloud Run**, **Cloud Firestore**, **Cloud Storage**, and **Firebase Authentication**.

---

## 🚀 Quick Start (Run Locally in 2 Minutes)

CloudTune includes a **Local Hybrid Mode** with bundled legally usable royalty-free demonstration tracks and seed metadata. You can test and demonstrate the entire application without needing any cloud credentials.

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Step 1: Start the Backend Microservices Mesh
In a terminal:
```bash
cd backend
npm install
npm run dev
```
Initializes the **CloudTune Microservices Mesh**:
- **API Gateway**: `http://localhost:5000` (Reverse Proxy & Health Aggregation)
- **Catalog Microservice**: `http://localhost:5001` (Isolated Catalog DB)
- **Playlist Microservice**: `http://localhost:5002` (Isolated Playlist DB)
- **User Microservice**: `http://localhost:5003` (Isolated User DB)
- **Admin Microservice**: `http://localhost:5004` (Isolated Admin DB)

Or run individual services: `npm run start:catalog`, `npm run start:playlist`, etc.
Or using Docker Compose: `docker compose up --build`

### Step 2: Start the Frontend Application
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your web browser.

### Step 3: Run Automated Verification Tests
In a terminal:
```bash
cd backend
npm run test:microservices  # Validates microservices health, database isolation & inter-service calls (29 tests)
npm test                   # Validates end-to-end integration flows through API Gateway (24 tests)
```

---

## 🌟 Key Application Features

### 1. Spotify-Inspired User Experience
- **Sleek Dark Interface**: Spotify dark theme with `#1DB954` green accents and glassmorphic panels.
- **Real Audio Streaming**: Streams real royalty-free audio tracks with seeking, progress bar, elapsed/total time, volume slider, mute toggle, shuffle, and repeat modes.
- **Dynamic Equalizer**: Animated soundwave indicator on active playing tracks.
- **Global Search**: Instant live debounced search across song titles, artists, albums, and genres.
- **Browse Genres**: Vibrant category tiles for Electronic, Pop, Rock, Lofi, Hip Hop, Classical, Ambient, and Jazz.

### 2. User Personalization
- **Authentication**: Email/Password registration, Login, and Google Sign-In via Firebase Auth.
- **Personal Playlists**: Create, rename, delete personal playlists, and add/remove tracks.
- **Liked Songs**: Dedicated purple-gradient collection page with toggle heart actions.
- **Listening History**: Automatically logs played tracks to Firestore `listeningHistory`.
- **User Profile**: Displays user details, profile avatar, and GCP cloud architecture specifications.

### 3. Protected Administrator Console (`/admin`)
- **Server-Side Authorization**: Verified via Firebase token claims and Firestore user roles.
- **Upload New Tracks**: Upload MP3/FLAC audio and cover artwork directly to Google Cloud Storage.
- **Catalogue Management**: View, edit metadata, or delete songs and associated media objects.
- **Cloud Diagnostics**: Displays Cloud Run service status, Firestore health, and storage mode.

---

## ☁️ Google Cloud Platform Microservices Architecture

```
Web Browser (React 18 + Vite SPA on Firebase Hosting)
       │
       ▼ HTTPS REST API (Port 5000 / Cloud Run)
CloudTune API Gateway (Edge Routing, Rate Limiting & Health Aggregator)
       ├── Catalog Microservice (:5001) <──> Catalog DB (Isolated)
       │       └── Google Cloud Storage (Audio Objects & Cover Art)
       ├── Playlist Microservice (:5002) <──> Playlist DB (Isolated)
       ├── User Microservice (:5003) <──> User DB (Isolated)
       └── Admin Microservice (:5004) <──> Admin DB (Isolated)
```

For complete architectural diagrams and data flows, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## ⚡ Running in Google Cloud Shell (With `make`)

Google Cloud Shell comes pre-configured with `gcloud`, `terraform`, `docker`, and `node`. You can manage the entire application lifecycle using the bundled [Makefile](file:///c:/Users/adars/OneDrive/Desktop/MINCLOUD/Makefile):

```bash
# 1. Open Google Cloud Shell in your browser and clone the repository
git clone https://github.com/Adarsh525-ac/mini.git cloudtune && cd cloudtune

# 2. View all available Cloud Shell targets
make help

# 3. Check environment prerequisites and connect to your GCP project
make check-env
make config PROJECT_ID="<your-gcp-project-id>"

# 4. Install backend and frontend dependencies
make install

# 5. Run the complete application for Cloud Shell Web Preview (Port 8080)
make dev-cloudshell
# Then click "Web Preview" -> "Preview on port 8080" in the Cloud Shell header!

# 6. Run automated test suites
make test
```

---

## 🏗️ Google Cloud Platform IaC with Terraform

CloudTune includes declarative Terraform configuration in [`terraform/`](file:///c:/Users/adars/OneDrive/Desktop/MINCLOUD/terraform) to provision all cloud infrastructure:

### Resources Managed by Terraform:
- **Google Cloud APIs**: Enables `run`, `artifactregistry`, `firestore`, `storage`, `cloudbuild`, `iam`, `identitytoolkit`
- **Artifact Registry Repository**: `cloudtune-repo` for container images
- **Google Cloud Storage Bucket**: `cloudtune-media-<project-id>` with CORS streaming configuration
- **Cloud Firestore Database**: Managed native document database
- **IAM Service Account & Roles**: Least-privilege `cloudtune-runner` service account
- **Google Cloud Run Service**: Serverless microservices API with auto-scaling (0 to 5 instances)

### One-Command Provisioning:
```bash
# Provision all cloud resources in minutes
make tf-apply PROJECT_ID="<your-gcp-project-id>"

# View service URLs and bucket names
make tf-output

# Full end-to-end cloud deployment: Terraform + Cloud Build + Cloud Run + Firestore Seeding
make deploy-all PROJECT_ID="<your-gcp-project-id>"

# Teardown cloud resources when demonstration is finished
make tf-destroy PROJECT_ID="<your-gcp-project-id>"
```

---

## 🛠️ Step-by-Step Google Cloud Deployment (Manual CLI)

### 1. Prerequisites
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed and authenticated (`gcloud auth login`).
- A GCP project with billing enabled (eligible for Google's $300 Free Trial).

### 2. Configure Environment Variables
Copy the templates:
```bash
# In backend/
cp .env.example .env

# In frontend/
cp .env.example .env
```
Update `backend/.env` with your GCP Project ID and storage bucket name.

### 3. Deploy Backend to Google Cloud Run
Run the deployment script or Makefile target:
```bash
# Using Makefile (Linux / Cloud Shell / macOS):
make deploy-backend PROJECT_ID="<YOUR-GCP-PROJECT-ID>"

# Using script directly (Bash):
chmod +x ./gcp-config/deploy-backend.sh
./gcp-config/deploy-backend.sh <YOUR-GCP-PROJECT-ID>

# On Windows PowerShell:
.\gcp-config\deploy-backend.ps1 -ProjectId "<YOUR-GCP-PROJECT-ID>"
```

### 4. Deploy Frontend to Firebase Hosting
Update `frontend/.env` with your newly deployed Cloud Run URL:
```env
VITE_API_URL=https://cloudtune-api-xxxxx-uc.a.run.app/api
```
Deploy the frontend:
```bash
make deploy-frontend
# or manually:
cd frontend && npm run build && cd .. && npx firebase-tools deploy --only hosting
```


## 📂 Project Repository Structure

```
MINCLOUD/
├── backend/                         # Express.js REST API & Cloud Run service
│   ├── src/
│   │   ├── config/                  # Firebase Admin & Cloud Storage configuration
│   │   ├── controllers/             # Song, Playlist, User, and Admin handlers
│   │   ├── middleware/              # Auth, Admin guards, and Error handlers
│   │   ├── routes/                  # Express route definitions
│   │   ├── utils/                   # Seed data and mock stores
│   │   └── server.js                # Server entry point with health checks
│   ├── tests/
│   │   └── api.test.js              # 24 automated integration test cases
│   ├── uploads/                     # Local media storage fallback
│   ├── Dockerfile                   # Cloud Run container definition
│   └── package.json
├── frontend/                        # React 18 + Vite frontend
│   ├── public/                      # Static assets & legal demonstration audio
│   ├── src/
│   │   ├── components/              # Sidebar, Topbar, Player, SongCards, Modals
│   │   ├── context/                 # AuthContext & PlayerContext (HTML5 Audio)
│   │   ├── pages/                   # Home, Search, Library, Playlist, Admin, etc.
│   │   ├── services/                # API client and Firebase initialization
│   │   ├── App.jsx                  # React Router configuration
│   │   └── index.css                # Tailwind CSS & Spotify design tokens
│   └── vite.config.js
├── gcp-config/                      # GCP deployment scripts & security rules
│   ├── cors.json                    # Cloud Storage CORS specification
│   ├── firestore.rules              # Firestore security rules
│   ├── deploy-backend.sh            # Bash Cloud Run deployment script
│   ├── deploy-backend.ps1           # PowerShell Cloud Run deployment script
│   └── seed-firestore.js            # Firestore catalogue seeding script
├── docs/                            # MCA academic documentation
│   ├── ARCHITECTURE.md              # Detailed GCP architecture & Mermaid diagram
│   ├── API_DOCUMENTATION.md         # Full REST API specification
│   ├── TESTING_CHECKLIST.md         # Manual & automated verification checklist
│   ├── GCP_COST_ESTIMATION.md       # Student Free Tier & budget safety guide
│   └── MCA_PROJECT_REPORT_GUIDE.md  # Viva Voce questions, answers, and report theory
├── firebase.json                    # Firebase Hosting & Firestore rules configuration
└── README.md
```

---

## 📚 Academic Documentation & MCA Project Deliverables

For your project submission and viva defense:
- [Google Cloud Architecture & Data Flows](docs/ARCHITECTURE.md)
- [REST API Specification](docs/API_DOCUMENTATION.md)
- [Testing & Verification Checklist](docs/TESTING_CHECKLIST.md)
- [GCP Cost Analysis & Free Tier Guide](docs/GCP_COST_ESTIMATION.md)
- [MCA Project Report Theory & Viva Questions](docs/MCA_PROJECT_REPORT_GUIDE.md)

---

## ⚖️ Legal & Audio Attribution
- This project is an academic demonstration developed for educational purposes.
- Audio tracks bundled for demonstration are legally usable royalty-free music sourced from SoundHelix (Creative Commons Attribution).
- Photography and cover images are sourced via Unsplash under the Unsplash Open License.
