# ==============================================================================
# CloudTune GCP Infrastructure — Outputs
# ==============================================================================

output "project_id" {
  description = "The Google Cloud Project ID."
  value       = var.project_id
}

output "region" {
  description = "The deployed Google Cloud Region."
  value       = var.region
}

output "service_name" {
  description = "Name of the deployed Cloud Run service."
  value       = google_cloud_run_v2_service.app.name
}

output "service_url" {
  description = "Public HTTPS URL of the Cloud Run service."
  value       = google_cloud_run_v2_service.app.uri
}

output "health_check_url" {
  description = "Aggregated health check endpoint URL."
  value       = "${google_cloud_run_v2_service.app.uri}/api/health"
}

output "repository_name" {
  description = "Name of the Artifact Registry Docker repository."
  value       = google_artifact_registry_repository.app_repo.repository_id
}

output "repository_url" {
  description = "Full URL prefix for container images in Artifact Registry."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}"
}

output "service_account_email" {
  description = "Runtime service account email used by Cloud Run."
  value       = google_service_account.cloud_run_sa.email
}

output "storage_bucket_name" {
  description = "Google Cloud Storage bucket name for audio tracks and artwork."
  value       = google_storage_bucket.media_bucket.name
}

output "storage_bucket_url" {
  description = "Google Cloud Storage bucket gs:// URI."
  value       = "gs://${google_storage_bucket.media_bucket.name}"
}

output "firestore_database_name" {
  description = "Name of the Firestore database."
  value       = var.create_firestore_database ? google_firestore_database.database[0].name : "(default - external)"
}

output "frontend_env_snippet" {
  description = "Ready-to-copy snippet for frontend/.env configuration."
  value       = <<-EOT
    # Add to frontend/.env:
    VITE_API_URL=${google_cloud_run_v2_service.app.uri}/api
    VITE_FIREBASE_PROJECT_ID=${var.project_id}
    VITE_FIREBASE_STORAGE_BUCKET=${google_storage_bucket.media_bucket.name}
  EOT
}
