# ==============================================================================
# Identity & Access Management (IAM) for Cloud Run
# ==============================================================================

resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.service_name}-sa"
  display_name = "Cloud Run Service Account for ${var.service_name}"
  description  = "Dedicated runtime service account for ${var.service_name} Cloud Run service"
  project      = var.project_id
}

# Grant Cloud Run service account permission to pull images from Artifact Registry
resource "google_artifact_registry_repository_iam_member" "sa_registry_reader" {
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.app_repo.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Cloud Run service account scoped project roles
resource "google_project_iam_member" "sa_roles" {
  for_each = toset([
    "roles/logging.logWriter",      # Cloud Logging
    "roles/monitoring.metricWriter",# Cloud Monitoring
    "roles/datastore.user",         # Cloud Firestore NoSQL DB read/write
    "roles/storage.objectAdmin"     # Cloud Storage audio/cover artwork management
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Allow unauthenticated (public) access to Cloud Run if enabled
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  count    = var.allow_unauthenticated ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
