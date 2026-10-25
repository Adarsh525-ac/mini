locals {
  required_services = [
    "run.googleapis.com",              # Cloud Run Admin API
    "artifactregistry.googleapis.com", # Artifact Registry API
    "cloudbuild.googleapis.com",       # Cloud Build API
    "iam.googleapis.com",              # Identity and Access Management API
    "logging.googleapis.com",          # Cloud Logging API
    "monitoring.googleapis.com",       # Cloud Monitoring API
  ]
}

resource "google_project_service" "enabled_apis" {
  for_each = toset(local.required_services)

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}
