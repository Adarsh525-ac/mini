# ==============================================================
# CloudTune Backend - Cloud Run Deployment Script (PowerShell)
# ==============================================================
param(
  [string]$ProjectId = "your-gcp-project-id"
)

$Region = "us-central1"
$ServiceName = "cloudtune-api"
$RepoName = "cloudtune-repo"
$ImageName = "${Region}-docker.pkg.dev/${ProjectId}/${RepoName}/${ServiceName}:latest"
$BucketName = "cloudtune-media-${ProjectId}"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying CloudTune Backend to Google Cloud Run" -ForegroundColor Green
Write-Host "Project ID: $ProjectId"
Write-Host "Region:     $Region"
Write-Host "Service:    $ServiceName"
Write-Host "=========================================================="

# 1. Set default project
gcloud config set project $ProjectId

# 2. Enable necessary GCP APIs
Write-Host "Enabling GCP APIs..." -ForegroundColor Yellow
gcloud services enable `
  run.googleapis.com `
  artifactregistry.googleapis.com `
  firestore.googleapis.com `
  storage.googleapis.com `
  cloudbuild.googleapis.com

# 3. Create Artifact Registry repository
Write-Host "Creating Artifact Registry repository..." -ForegroundColor Yellow
gcloud artifacts repositories create $RepoName `
  --repository-format=docker `
  --location=$Region `
  --description="CloudTune Docker repository"

# 4. Create Cloud Storage bucket
Write-Host "Creating Cloud Storage bucket..." -ForegroundColor Yellow
gcloud storage buckets create "gs://$BucketName" `
  --location=$Region `
  --uniform-bucket-level-access

# 5. Configure Bucket CORS
Write-Host "Applying CORS policy..." -ForegroundColor Yellow
gcloud storage buckets update "gs://$BucketName" --cors-file="./gcp-config/cors.json"

# 6. Build and push image
Write-Host "Building Docker image with Google Cloud Build..." -ForegroundColor Yellow
gcloud builds submit ./backend --tag $ImageName

# 7. Deploy to Cloud Run
Write-Host "Deploying container to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
  --image $ImageName `
  --region $Region `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 5 `
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=$ProjectId,GCP_STORAGE_BUCKET_NAME=$BucketName,ENABLE_GCS_UPLOAD=true,GCP_REGION=$Region"

# 8. Output service URL
$ServiceUrl = gcloud run services describe $ServiceName --platform managed --region $Region --format 'value(status.url)'
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 Backend Deployment Successful!" -ForegroundColor Green
Write-Host "Service URL:  $ServiceUrl" -ForegroundColor Cyan
Write-Host "Health Check: $ServiceUrl/api/health" -ForegroundColor Cyan
Write-Host "=========================================================="
