# ==============================================================================
# CloudTune GCP Infrastructure — Input Variables
# ==============================================================================

variable "project_id" {
  description = "The Google Cloud Platform (GCP) Project ID where resources will be provisioned."
  type        = string
}

variable "region" {
  description = "The primary GCP region for deploying resources (e.g., us-central1, europe-west1)."
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "The name of the Google Cloud Run service."
  type        = string
  default     = "cloudtune-api"
}

variable "repository_id" {
  description = "Artifact Registry Docker repository ID for storing container images."
  type        = string
  default     = "cloudtune-repo"
}

variable "image_tag" {
  description = "The container image tag to deploy."
  type        = string
  default     = "latest"
}

variable "container_image" {
  description = "Direct container image URI. If provided, overrides placeholder/built_image_url."
  type        = string
  default     = ""
}

variable "deploy_placeholder" {
  description = "Whether to use Google's starter container initially so Terraform applies before building custom image."
  type        = bool
  default     = true
}

variable "container_port" {
  description = "Port exposed by the container (default: 8080)."
  type        = number
  default     = 8080
}

variable "min_instances" {
  description = "Minimum number of Cloud Run container instances (0 enables scale-to-zero)."
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run container instances."
  type        = number
  default     = 5
}

variable "cpu" {
  description = "CPU allocation for Cloud Run instance (e.g. '1', '2')."
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory allocation for Cloud Run instance (e.g. '512Mi', '1Gi')."
  type        = string
  default     = "512Mi"
}

variable "allow_unauthenticated" {
  description = "Whether to allow unauthenticated public HTTP access to the Cloud Run service."
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Whether to protect the Cloud Run service from accidental deletion."
  type        = bool
  default     = false
}

variable "api_base_url" {
  description = "Base API URL injected into frontend environment if needed."
  type        = string
  default     = ""
}

variable "bucket_name" {
  description = "Cloud Storage bucket name for audio tracks and cover artwork. Defaults to 'cloudtune-media-<project_id>'."
  type        = string
  default     = ""
}

variable "bucket_force_destroy" {
  description = "Delete all bucket objects when destroying the bucket."
  type        = bool
  default     = false
}

variable "create_firestore_database" {
  description = "Whether to create the default Firestore native database. Set to false if already initialized via Firebase Console."
  type        = bool
  default     = true
}

variable "firestore_location_id" {
  description = "Location ID for Firestore (defaults to var.region or 'nam5' for US multi-region)."
  type        = string
  default     = ""
}
