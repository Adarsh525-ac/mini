terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.38.0, < 7.0.0"
    }
  }

  # To persist state in a Cloud Storage bucket, uncomment and configure:
  # backend "gcs" {
  #   bucket = "YOUR_TERRAFORM_STATE_BUCKET_NAME"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
