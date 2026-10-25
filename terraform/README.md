# ☁️ CloudTune — Terraform Infrastructure as Code (IaC)

This directory contains the Terraform configuration files to provision and manage the complete Google Cloud Platform infrastructure for **CloudTune**.

---

## 🏗️ Architecture Provisioned

The Terraform configuration provisions the following GCP resources:

| Resource | Terraform Resource Type | Purpose |
|---|---|---|
| **Google Cloud APIs** | `google_project_service` | Enables Cloud Run, Artifact Registry, Firestore, GCS, Cloud Build, and IAM |
| **Artifact Registry** | `google_artifact_registry_repository` | Stores Docker container images for CloudTune backend microservices |
| **Cloud Storage** | `google_storage_bucket` | Stores MP3/FLAC audio files and album artwork with streaming CORS |
| **Public GCS Read** | `google_storage_bucket_iam_member` | Grants `roles/storage.objectViewer` to `allUsers` for audio streaming |
| **Cloud Firestore** | `google_firestore_database` | Managed NoSQL document database in Native mode |
| **Runtime Service Account** | `google_service_account` | Dedicated least-privilege service account (`cloudtune-runner`) |
| **IAM Role Bindings** | `google_project_iam_member` | Grants Firestore, GCS, Logging, and Monitoring permissions |
| **Google Cloud Run** | `google_cloud_run_v2_service` | Auto-scaling containerized backend API (0 to 5 instances) |
| **Cloud Run Invocations** | `google_cloud_run_v2_service_iam_member` | Grants public HTTP access (`roles/run.invoker`) for frontend traffic |

---

## 🚀 Quick Start Guide

### 1. Authenticate with Google Cloud
Ensure your `gcloud` CLI is logged in and active:
```bash
gcloud auth login
gcloud auth application-default login
```
*(In Google Cloud Shell, authentication is automatic!)*

### 2. Configure Terraform Variables
Copy the example variables file:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```
Edit `terraform.tfvars` and set your `project_id`:
```hcl
project_id = "your-gcp-project-id"
region     = "us-central1"
```

### 3. Initialize & Review Plan
```bash
terraform init
terraform plan
```

### 4. Provision Infrastructure
```bash
terraform apply
```

### 5. Inspect Outputs
View the provisioned service URL, bucket name, and environment variables:
```bash
terraform output
```

---

## 💡 Important Configuration Notes

### Firestore Database Already Exists?
If your GCP project already has a Firestore database created (e.g. from visiting the Firebase Console), set:
```hcl
create_firestore_database = false
```
in `terraform.tfvars` before applying.

### Container Image Bootstrap
On initial run, Terraform uses `use_bootstrap_image = true` (deploying Google's lightweight `hello` starter container) so that infrastructure provisioning succeeds before you build your custom container. 

Once your infrastructure is ready, run:
```bash
# From workspace root
make build-backend
make deploy-backend
```
or use `gcloud builds submit` and `gcloud run deploy` to update the service with the CloudTune backend code.

---

## 🧹 Infrastructure Teardown

To delete all provisioned GCP resources when your project demonstration is finished:
```bash
terraform destroy
```
*(Note: Objects inside the GCS bucket may need to be emptied first unless `bucket_force_destroy = true` is set).*
