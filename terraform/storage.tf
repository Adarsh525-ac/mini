# ==============================================================================
# Google Cloud Storage — Audio Streaming & Cover Artwork Bucket
# ==============================================================================

locals {
  storage_bucket_name = var.bucket_name != "" ? var.bucket_name : "cloudtune-media-${var.project_id}"
}

resource "google_storage_bucket" "media_bucket" {
  name                        = local.storage_bucket_name
  location                    = var.region
  project                     = var.project_id
  uniform_bucket_level_access = true
  force_destroy               = var.bucket_force_destroy

  # Enable streaming and seek support across web origins
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = [
      "Content-Type",
      "Content-Range",
      "Content-Length",
      "Range",
      "Accept-Ranges",
      "Access-Control-Allow-Origin"
    ]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.enabled_apis]
}

# Public read access so HTML5 audio and cover images can be streamed by client browsers
resource "google_storage_bucket_iam_member" "public_media_read" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
