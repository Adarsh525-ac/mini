resource "google_artifact_registry_repository" "app_repo" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = "Docker container repository for ${var.service_name}"
  format        = "DOCKER"

  depends_on = [
    google_project_service.enabled_apis
  ]
}
