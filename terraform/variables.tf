variable "project_id" {
  description = "The Google Cloud Platform (GCP) project ID"
  type        = string
}

variable "region" {
  description = "The GCP region for resource deployment"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "sonora-web"
}

variable "repository_id" {
  description = "Name/ID of the Artifact Registry Docker repository"
  type        = string
  default     = "finalrepo"
}

variable "image_tag" {
  description = "Image tag to deploy"
  type        = string
  default     = "latest"
}

variable "container_image" {
  description = "Explicit container image URL to deploy. If omitted, uses default placeholder or the built image URL."
  type        = string
  default     = ""
}

variable "deploy_placeholder" {
  description = "If true and container_image is empty, deploys a Google-managed placeholder image to bootstrap Cloud Run before the initial custom build."
  type        = bool
  default     = true
}

variable "container_port" {
  description = "Port exposed by the container (Next.js default is 3000)"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "CPU allocation for the Cloud Run instance (e.g., '1', '2')"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory allocation for the Cloud Run instance (e.g., '512Mi', '1Gi')"
  type        = string
  default     = "512Mi"
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances (0 enables scale-to-zero to save costs)"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 5
}

variable "allow_unauthenticated" {
  description = "Whether to allow public unauthenticated HTTP access to Cloud Run"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection on the Cloud Run service (false allows terraform destroy to remove the service cleanly)"
  type        = bool
  default     = false
}

variable "api_base_url" {
  description = "Base URL for the REST API (sets NEXT_PUBLIC_API_BASE_URL). Leave empty for demo mode."
  type        = string
  default     = ""
}
