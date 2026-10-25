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

```
finalrepo/
├── Makefile                         # Cloud Shell automation & build commands
├── cloudbuild.yaml                  # Google Cloud Build pipeline
├── Dockerfile                       # Multi-stage standalone Next.js container
├── docker-compose.yml               # Local multi-service orchestration
├── terraform/                       # Infrastructure as Code (GCP Cloud Run & Artifact Registry)
├── app/                             # Next.js App Router pages and routes
├── components/                      # Modular UI components & music player
├── lib/                             # API clients and utilities
└── public/                          # Media assets and icons
```

---

## ⚖️ Legal & Audio Attribution
- This project is an academic demonstration developed for educational purposes.
- Audio tracks bundled for demonstration are legally usable royalty-free music sourced from SoundHelix (Creative Commons Attribution).
- Photography and cover images are sourced via Unsplash under the Unsplash Open License.
