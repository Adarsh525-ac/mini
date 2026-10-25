output "project_id" {
  description = "The Google Cloud Project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region where resources are deployed"
  value       = var.region
}

output "cloud_run_service_name" {
  description = "The name of the Cloud Run service"
  value       = google_cloud_run_v2_service.app.name
}

output "cloud_run_url" {
  description = "Public URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.app.uri
}

output "artifact_registry_id" {
  description = "The Artifact Registry repository ID"
  value       = google_artifact_registry_repository.app_repo.repository_id
}

output "artifact_registry_url" {
  description = "Full URL of the Artifact Registry repository"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}"
}

output "target_docker_image" {
  description = "Full Docker image tag target for builds"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}/${var.service_name}:${var.image_tag}"
}

output "service_account_email" {
  description = "Email of the Cloud Run runtime service account"
  value       = google_service_account.cloud_run_sa.email
}
