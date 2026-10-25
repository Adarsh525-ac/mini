# ==============================================================================
# Google Cloud Firestore — Managed NoSQL Database (Native Mode)
# ==============================================================================

locals {
  firestore_location = var.firestore_location_id != "" ? var.firestore_location_id : var.region
}

resource "google_firestore_database" "database" {
  count                       = var.create_firestore_database ? 1 : 0
  project                     = var.project_id
  name                        = "(default)"
  location_id                 = local.firestore_location
  type                        = "FIRESTORE_NATIVE"
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"
  deletion_policy             = "DELETE"
  delete_protection_state     = "DELETE_PROTECTION_DISABLED"

  depends_on = [google_project_service.enabled_apis]
}
