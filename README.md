# 🎵 CloudTune — Spotify Clone on Google Cloud Platform

**CloudTune** is a complete, cloud-native music streaming platform built for an **MCA Cloud Computing** academic project. It features a responsive Spotify-inspired dark UI, real HTML5 audio playback, personal playlists, likes, listening history, and a protected Administrator Console.

The application is architected to run seamlessly **locally during development** and be deployable to **Google Cloud Platform (GCP)** leveraging **Cloud Run**, **Artifact Registry**, **Terraform**, **Cloud Firestore**, **Cloud Storage**, and **Firebase Authentication**.

---

## 🚀 Quickstart in Google Cloud Shell & Terraform

Google Cloud Shell comes pre-configured with `gcloud`, `docker`, `terraform`, and `make`.

### Step 1: Open Cloud Shell & Clone Repository
In [Google Cloud Shell](https://shell.cloud.google.com/):
```bash
git clone https://github.com/Adarsh525-ac/mini.git finalrepo
cd finalrepo
```

### Step 2: Set Your Active GCP Project
```bash
gcloud config set project <YOUR_GCP_PROJECT_ID>
```

### Step 3: Run Environment Setup & Diagnostics
```bash
make doctor
make setup-gcp
```

### Step 4: Run the Application

#### Option A: 1-Step Deploy to Google Cloud Run
Provisions all cloud infrastructure, builds container with Google Cloud Build, and deploys to Cloud Run:
```bash
make deploy
```
Once completed, it will print the live HTTPS service URL.

#### Option B: Run Locally in Cloud Shell (Web Preview)
To test and preview the app right inside Cloud Shell:
```bash
make dev
```
Then click the **Web Preview** icon at the top right of Cloud Shell and select **Preview on port 3000**.

---

## 🛠️ Makefile Commands Reference

| Command | Category | Description |
|---|---|---|
| `make help` | Help | Displays colored menu of all commands and active GCP project info |
| `make doctor` | Setup | Validates CLI tools (`gcloud`, `terraform`, `docker`, `node`, `pnpm`) and GCP project |
| `make setup-gcp` | Setup | Enables required GCP APIs and configures Docker credential helper |
| `make install-pnpm` | Setup | Enables corepack and installs `pnpm` if running directly |
| `make dev` | Local Run | Starts Next.js development server on `0.0.0.0:3000` for Cloud Shell Web Preview |
| `make docker-build` | Local Run | Builds the container image locally with Docker |
| `make docker-run` | Local Run | Runs the built container locally on port 3000 |
| `make tf-init` | Terraform | Initializes Terraform provider and modules |
| `make tf-plan` | Terraform | Generates an execution plan for infrastructure changes |
| `make tf-apply` | Terraform | Provisions Artifact Registry, Service Account, IAM, and Cloud Run |
| `make tf-output` | Terraform | Displays Terraform outputs (URLs, emails, image paths) |
| `make tf-destroy` | Terraform | Tears down all provisioned GCP resources to eliminate cloud charges |
| `make build` | Deployment | Builds & pushes image to Artifact Registry using **Google Cloud Build** |
| `make build-local` | Deployment | Builds image locally via Docker |
| `make push` | Deployment | Pushes locally built Docker image to Artifact Registry |
| `make deploy` | Deployment | **Full 1-step deploy**: runs `tf-apply` + `build` + `cloud run deploy` + prints URL |
| `make url` | Operations | Displays the live HTTPS Cloud Run URL |
| `make logs` | Operations | Streams live application logs from Cloud Run |
| `make clean` | Cleanup | Cleans `.next`, build caches, and temporary files |

---

## 🏗️ Terraform Infrastructure Architecture

All Terraform configurations are located under the [`terraform/`](./terraform/) directory:

```
terraform/
├── versions.tf               # Terraform & Google Provider (>= 5.38, < 7.0)
├── variables.tf              # Configurable variables (region, CPU, memory, scaling)
├── services.tf               # Google Project Services & API enablement
├── artifact_registry.tf      # Artifact Registry Docker repository (finalrepo)
├── iam.tf                    # Cloud Run service account & public invoker IAM bindings
├── cloud_run.tf              # Cloud Run v2 service definition & health checks
├── outputs.tf                # Outputs: live URL, repository URL, target image
└── terraform.tfvars.example  # Example variable definitions
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
- **Listening History**: Automatically logs played tracks.
- **User Profile**: Displays user details, profile avatar, and GCP cloud architecture specifications.

### 3. Protected Administrator Console (`/admin`)
- **Server-Side Authorization**: Verified via Firebase token claims and Firestore user roles.
- **Upload New Tracks**: Upload MP3/FLAC audio and cover artwork directly to Google Cloud Storage.
- **Catalogue Management**: View, edit metadata, or delete songs and associated media objects.
- **Cloud Diagnostics**: Displays Cloud Run service status, Firestore health, and storage mode.

---

## 📂 Project Structure

### Customizing Configuration
Copy `terraform/terraform.tfvars.example` to `terraform/terraform.tfvars`:
```hcl
project_id            = "my-gcp-project"
region                = "us-central1"
service_name          = "sonora-web"
repository_id         = "finalrepo"
cpu                   = "1"
memory                = "512Mi"
min_instances         = 0
max_instances         = 5
allow_unauthenticated = true
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
make check-env       # (or: make doctor)
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
- **IAM Service Account & Roles**: Least-privilege `cloudtune-api-sa` service account
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

---

## 📂 Project Repository Structure

```
MINCLOUD/
├── Makefile                         # Cloud Shell automation & build lifecycle commands
├── terraform/                       # Infrastructure as Code (GCP Cloud Run, GCS, Firestore)
│   ├── versions.tf                  # Provider versions (~> 5.10)
│   ├── variables.tf                 # Configurable variables
│   ├── services.tf                  # Enabled Google Cloud APIs
│   ├── artifact_registry.tf         # Docker Artifact Registry repo
│   ├── storage.tf                   # Cloud Storage media bucket with CORS
│   ├── firestore.tf                 # Native Firestore NoSQL database
│   ├── iam.tf                       # Service account and least-privilege roles
│   ├── cloud_run.tf                 # Cloud Run serverless container
│   ├── outputs.tf                   # Deployed URLs and frontend .env snippets
│   └── terraform.tfvars.example     # Variables template
├── backend/                         # Express.js REST API & Cloud Run microservices mesh
│   ├── src/                         # Unified server, routes, controllers
│   ├── services/                    # 4 isolated microservices (catalog, playlist, user, admin)
│   ├── shared/                      # Auth middleware and shared utilities
│   ├── tests/                       # 53 automated integration tests
│   ├── Dockerfile                   # Cloud Run container definition
│   └── package.json
├── frontend/                        # React 18 + Vite frontend
│   ├── src/                         # Spotify Dark UI components, context, pages
│   ├── index.css                    # Design system tokens
│   └── vite.config.js
├── gcp-config/                      # Deployment scripts & security rules
├── docs/                            # MCA academic documentation
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
