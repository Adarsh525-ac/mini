locals {
  placeholder_image = "us-docker.pkg.dev/cloudrun/container/hello"
  built_image_url   = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app_repo.repository_id}/${var.service_name}:${var.image_tag}"
  resolved_image    = var.container_image != "" ? var.container_image : (var.deploy_placeholder ? local.placeholder_image : local.built_image_url)
}

resource "google_cloud_run_v2_service" "app" {
  name                = var.service_name
  location            = var.region
  project             = var.project_id
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = var.deletion_protection

  template {
    service_account = google_service_account.cloud_run_sa.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = local.resolved_image

      ports {
        container_port = var.container_port
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = tostring(var.container_port)
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "GCP_REGION"
        value = var.region
      }

      env {
        name  = "GCP_STORAGE_BUCKET_NAME"
        value = google_storage_bucket.media_bucket.name
      }

      env {
        name  = "ENABLE_GCS_UPLOAD"
        value = "true"
      }

      dynamic "env" {
        for_each = var.api_base_url != "" ? [var.api_base_url] : []
        content {
          name  = "NEXT_PUBLIC_API_BASE_URL"
          value = env.value
        }
      }

      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 3
        period_seconds        = 5
        failure_threshold     = 5
        tcp_socket {
          port = var.container_port
        }
      }

      liveness_probe {
        initial_delay_seconds = 10
        timeout_seconds       = 3
        period_seconds        = 15
        failure_threshold     = 3
        http_get {
          path = "/"
          port = var.container_port
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_project_service.enabled_apis,
    google_artifact_registry_repository.app_repo,
    google_service_account.cloud_run_sa,
    google_storage_bucket.media_bucket
  ]
}
