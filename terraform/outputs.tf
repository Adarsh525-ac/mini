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

output "artifact_registry_repo" {
  description = "The full Artifact Registry Docker image prefix."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.name}"
}

output "storage_bucket_name" {
  description = "Cloud Storage bucket name for audio tracks and covers."
  value       = google_storage_bucket.media_bucket.name
}

output "storage_bucket_url" {
  description = "Cloud Storage bucket gs:// URI."
  value       = "gs://${google_storage_bucket.media_bucket.name}"
}

output "firestore_database_name" {
  description = "The Firestore database name."
  value       = var.create_firestore_database ? google_firestore_database.database[0].name : "(default - external)"
}

output "service_account_email" {
  description = "Cloud Run runtime service account email."
  value       = google_service_account.cloudtune_sa.email
}

output "backend_service_url" {
  description = "Public HTTPS URL for CloudTune Backend on Cloud Run."
  value       = var.deploy_cloud_run ? google_cloud_run_v2_service.backend[0].uri : "Not deployed"
}

output "backend_health_check_url" {
  description = "Aggregated microservices health check endpoint URL."
  value       = var.deploy_cloud_run ? "${google_cloud_run_v2_service.backend[0].uri}/api/health" : "Not deployed"
}

output "frontend_env_snippet" {
  description = "Ready-to-copy snippet for frontend/.env configuration."
  value       = <<-EOT
    # Add to frontend/.env:
    VITE_API_URL=${var.deploy_cloud_run ? "${google_cloud_run_v2_service.backend[0].uri}/api" : "https://YOUR_BACKEND_URL/api"}
    VITE_FIREBASE_PROJECT_ID=${var.project_id}
    VITE_FIREBASE_STORAGE_BUCKET=${google_storage_bucket.media_bucket.name}
  EOT
}
