# ==============================================================================
# CloudTune GCP Infrastructure — Main Configuration
# Provisions: APIs, Artifact Registry, GCS Bucket, Firestore, IAM, & Cloud Run
# ==============================================================================

locals {
  bucket_name        = var.bucket_name != "" ? var.bucket_name : "cloudtune-media-${var.project_id}"
  artifact_image_url = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repository_id}/${var.backend_service_name}:latest"
  backend_image      = var.backend_image != "" ? var.backend_image : (var.use_bootstrap_image ? "us-docker.pkg.dev/cloudrun/container/hello" : local.artifact_image_url)
  firestore_location = var.firestore_location_id != "" ? var.firestore_location_id : var.region
}

# ------------------------------------------------------------------------------
# 1. Enable Required Google Cloud Platform APIs
# ------------------------------------------------------------------------------
resource "google_project_service" "apis" {
  for_each                   = toset(var.enable_apis)
  project                    = var.project_id
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}

# ------------------------------------------------------------------------------
# 2. Artifact Registry (Docker Container Repository)
# ------------------------------------------------------------------------------
resource "google_artifact_registry_repository" "repo" {
  provider      = google-beta
  project       = var.project_id
  location      = var.region
  repository_id = var.artifact_repository_id
  description   = "CloudTune Docker repository for backend microservice images"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# ------------------------------------------------------------------------------
# 3. Google Cloud Storage Bucket (Media Tracks & Cover Artwork)
# ------------------------------------------------------------------------------
resource "google_storage_bucket" "media_bucket" {
  name                        = local.bucket_name
  location                    = var.region
  project                     = var.project_id
  uniform_bucket_level_access = true
  force_destroy               = var.bucket_force_destroy

  # Enable streaming and seek support across web origins
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = [
      "Content-Type",
      "Content-Range",
      "Content-Length",
      "Range",
      "Accept-Ranges",
      "Access-Control-Allow-Origin"
    ]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.apis]
}

# Public read access so HTML5 audio and cover images can be streamed by client browsers
resource "google_storage_bucket_iam_member" "public_media_read" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ------------------------------------------------------------------------------
# 4. Cloud Firestore Database (Native Mode)
# ------------------------------------------------------------------------------
resource "google_firestore_database" "database" {
  count                       = var.create_firestore_database ? 1 : 0
  project                     = var.project_id
  name                        = "(default)"
  location_id                 = local.firestore_location
  type                        = "FIRESTORE_NATIVE"
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"
  deletion_policy             = "DELETE"
  delete_protection_state     = "DELETE_PROTECTION_DISABLED"

  depends_on = [google_project_service.apis]
}

# ------------------------------------------------------------------------------
# 5. Service Account & IAM Roles for Cloud Run Backend
# ------------------------------------------------------------------------------
resource "google_service_account" "cloudtune_sa" {
  account_id   = var.service_account_id
  display_name = "CloudTune Microservices Runtime Service Account"
  project      = var.project_id

  depends_on = [google_project_service.apis]
}

# Grant least-privilege roles to Cloud Run service account
resource "google_project_iam_member" "sa_roles" {
  for_each = toset([
    "roles/datastore.user",         # Read/write Firestore
    "roles/storage.objectAdmin",    # Read/write audio/artwork files in Cloud Storage
    "roles/logging.logWriter",      # Cloud Logging
    "roles/monitoring.metricWriter" # Cloud Monitoring
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudtune_sa.email}"
}

# ------------------------------------------------------------------------------
# 6. Google Cloud Run Backend Service
# ------------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "backend" {
  count    = var.deploy_cloud_run ? 1 : 0
  name     = var.backend_service_name
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudtune_sa.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    max_instance_request_concurrency = var.container_concurrency

    containers {
      image = local.backend_image

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
      }

      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "GCP_STORAGE_BUCKET_NAME"
        value = google_storage_bucket.media_bucket.name
      }
      env {
        name  = "ENABLE_GCS_UPLOAD"
        value = "true"
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }
      env {
        name  = "FRONTEND_URL"
        value = var.frontend_url != "" ? var.frontend_url : "*"
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_storage_bucket.media_bucket,
    google_artifact_registry_repository.repo,
    google_project_iam_member.sa_roles
  ]
}

# Allow public unauthenticated invocations for Cloud Run backend
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  count    = var.deploy_cloud_run ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backend[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
