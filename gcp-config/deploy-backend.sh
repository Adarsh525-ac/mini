#!/usr/bin/env bash
# ==============================================================
# CloudTune Backend - Cloud Run Deployment Script
# ==============================================================
set -e

# Configuration (Customize with your GCP Project details)
PROJECT_ID=${1:-"your-gcp-project-id"}
REGION="us-central1"
SERVICE_NAME="cloudtune-api"
REPO_NAME="cloudtune-repo"
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"
BUCKET_NAME="cloudtune-media-${PROJECT_ID}"

echo "=========================================================="
echo "🚀 Deploying CloudTune Backend to Google Cloud Run"
echo "Project ID: ${PROJECT_ID}"
echo "Region:     ${REGION}"
echo "Service:    ${SERVICE_NAME}"
echo "=========================================================="

# 1. Set default project
gcloud config set project "${PROJECT_ID}"

# 2. Enable necessary GCP APIs
echo "Enabling GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com

# 3. Create Artifact Registry repository if it doesn't exist
echo "Checking Artifact Registry..."
gcloud artifacts repositories create "${REPO_NAME}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="CloudTune Docker repository" || true

# 4. Create Cloud Storage bucket for music & covers
echo "Checking Cloud Storage bucket..."
gcloud storage buckets create "gs://${BUCKET_NAME}" \
  --location="${REGION}" \
  --uniform-bucket-level-access || true

# 5. Apply CORS configuration to the bucket
echo "Configuring bucket CORS..."
gcloud storage buckets update "gs://${BUCKET_NAME}" --cors-file="./gcp-config/cors.json"

# 6. Build and push container using Google Cloud Build
echo "Building container image with Cloud Build..."
gcloud builds submit ./backend --tag "${IMAGE_NAME}"

# 7. Deploy to Google Cloud Run
echo "Deploying container to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=${PROJECT_ID},GCP_STORAGE_BUCKET_NAME=${BUCKET_NAME},ENABLE_GCS_UPLOAD=true,GCP_REGION=${REGION}"

# 8. Output service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format 'value(status.url)')
echo "=========================================================="
echo "🎉 Backend Deployment Successful!"
echo "Cloud Run Service URL: ${SERVICE_URL}"
echo "Health Check:          ${SERVICE_URL}/api/health"
echo "=========================================================="
