# ==============================================================================
# CloudTune GCP Infrastructure — Input Variables
# ==============================================================================

variable "project_id" {
  description = "The Google Cloud Platform (GCP) Project ID where resources will be provisioned."
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources (e.g. us-central1, europe-west1)."
  type        = string
  default     = "us-central1"
}

variable "firestore_location_id" {
  description = "The location for Cloud Firestore. Defaults to var.region or 'nam5' for multi-region US."
  type        = string
  default     = ""
}

variable "artifact_repository_id" {
  description = "Artifact Registry Docker repository ID for storing backend microservice images."
  type        = string
  default     = "cloudtune-repo"
}

variable "bucket_name" {
  description = "Name of the Google Cloud Storage bucket for audio tracks and cover artwork. If blank, defaults to 'cloudtune-media-<project_id>'."
  type        = string
  default     = ""
}

variable "bucket_force_destroy" {
  description = "When deleting the bucket, delete all contained objects without error (useful for student/dev tear-down)."
  type        = bool
  default     = false
}

variable "service_account_id" {
  description = "ID for the dedicated Cloud Run runtime service account."
  type        = string
  default     = "cloudtune-runner"
}

variable "create_firestore_database" {
  description = "Whether to provision the default Firestore Database in Native mode. Set to false if Firestore was already created via the Firebase Console."
  type        = bool
  default     = true
}

variable "deploy_cloud_run" {
  description = "Whether to deploy the Cloud Run backend service via Terraform."
  type        = bool
  default     = true
}

variable "backend_service_name" {
  description = "Name of the Google Cloud Run service for the CloudTune API."
  type        = string
  default     = "cloudtune-api"
}

variable "backend_image" {
  description = "Custom container image URL to deploy. If left empty, defaults to Artifact Registry image or bootstrap starter image."
  type        = string
  default     = ""
}

variable "use_bootstrap_image" {
  description = "If true and backend_image is not specified, uses Google's public hello-world image initially so Terraform succeeds before your first image build."
  type        = bool
  default     = true
}

variable "frontend_url" {
  description = "The frontend URL allowed for CORS headers (e.g. Firebase Hosting URL or http://localhost:5173). Leave empty to allow any origin."
  type        = string
  default     = ""
}

variable "min_instances" {
  description = "Minimum number of Cloud Run container instances (0 allows scale-to-zero for cost savings)."
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run container instances."
  type        = number
  default     = 5
}

variable "container_concurrency" {
  description = "Maximum number of concurrent requests per Cloud Run container instance."
  type        = number
  default     = 80
}

variable "cpu_limit" {
  description = "CPU limit per Cloud Run container instance (e.g. '1', '2')."
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit per Cloud Run container instance (e.g. '512Mi', '1Gi')."
  type        = string
  default     = "512Mi"
}

variable "enable_apis" {
  description = "List of Google Cloud API services required by CloudTune."
  type        = list(string)
  default = [
    "run.googleapis.com",              # Cloud Run Admin API
    "artifactregistry.googleapis.com", # Artifact Registry API
    "firestore.googleapis.com",        # Cloud Firestore API
    "storage.googleapis.com",          # Cloud Storage JSON API
    "cloudbuild.googleapis.com",       # Cloud Build API
    "iam.googleapis.com",              # Identity and Access Management (IAM) API
    "identitytoolkit.googleapis.com"   # Firebase Authentication / Identity Toolkit API
  ]
}
