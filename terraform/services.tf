locals {
  required_services = [
    "run.googleapis.com",              # Cloud Run Admin API
    "artifactregistry.googleapis.com", # Artifact Registry API
    "firestore.googleapis.com",        # Cloud Firestore API
    "storage.googleapis.com",          # Cloud Storage JSON API
    "cloudbuild.googleapis.com",       # Cloud Build API
    "iam.googleapis.com",              # Identity and Access Management API
    "logging.googleapis.com",          # Cloud Logging API
    "monitoring.googleapis.com",       # Cloud Monitoring API
    "identitytoolkit.googleapis.com"   # Firebase Authentication / Identity Toolkit
  ]
}

resource "google_project_service" "enabled_apis" {
  for_each = toset(local.required_services)

  project                    = var.project_id
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}
