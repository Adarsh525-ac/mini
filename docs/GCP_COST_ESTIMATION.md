# CloudTune — Google Cloud Platform Cost Estimation & Budget Control Guide

> **Important Note for Students & Evaluators:**  
> New Google Cloud accounts are eligible for a **$300 credit / 90-day Free Trial**, subject to Google's verification and eligibility terms. Even without trial credits, this architecture is intentionally optimized around the **Google Cloud Always Free Tier** and **Scale-to-Zero Serverless Services**. However, cloud costs are never unconditionally zero — network egress, excessive audio downloads, or forgotten resources can incur charges. Always monitor your GCP Billing Console.

---

## 1. Service-by-Service Free Tier & Cost Breakdown

| Google Cloud Service | Applicable Free Tier Allowance (Per Month) | CloudTune Usage Profile | Estimated Monthly Cost |
|---|---|---|---|
| **Google Cloud Run** | 2,000,000 requests<br/>360,000 GB-seconds memory<br/>180,000 vCPU-seconds | ~500 to 5,000 requests during viva and testing.<br/>Scale-to-Zero enabled (`min-instances = 0`). | **$0.00** (Within Free Tier) |
| **Cloud Firestore** | 1 GB storage<br/>50,000 document reads / day<br/>20,000 document writes / day | ~50 documents, &lt; 500 reads/day. | **$0.00** (Within Free Tier) |
| **Google Cloud Storage** | 5 GB Standard Storage<br/>5,000 Class A operations (uploads)<br/>50,000 Class B operations (reads) | ~5 to 10 demo songs (~40 MB total). | **$0.00** (Within Free Tier) |
| **Firebase Authentication** | Free unlimited email/password accounts<br/>50,000 monthly active users for SMS/Phone | &lt; 50 test accounts. | **$0.00** (Free Tier) |
| **Artifact Registry** | 0.5 GB storage free | 1 Docker container image (~120 MB compressed). | **$0.00 - $0.05** |
| **Cloud Build** | 120 build-minutes / day free | ~3 to 5 builds during development (~15 min total). | **$0.00** (Within Free Tier) |
| **Network Egress** | 100 GB egress to all destinations / month (excluding China/Australia) | Audio streaming for testing (~200 MB total). | **$0.00** (Within Free Tier) |
| **Firebase Hosting** | 10 GB storage, 360 MB/day data transfer | Single-page application bundle (~500 KB). | **$0.00** (Within Spark Plan) |

**Total Estimated Running Cost for Project Evaluation:** **$0.00 to $0.10 / month**.

---

## 2. Why CloudTune Costs Far Less Than Traditional Cloud Deployments

1. **No Virtual Machines (Compute Engine)**: Standard VMs (e.g. `e2-standard-2`) cost $48+/month even when sitting completely idle. CloudTune uses **Cloud Run**, meaning zero cost when no requests are arriving.
2. **No Managed Kubernetes (GKE)**: Avoids cluster management fees ($73+/month).
3. **No External HTTP(S) Load Balancer**: Uses Cloud Run's native HTTPS ingress and TLS certificates, saving $18+/month.
4. **No Cloud NAT Gateway**: Avoids $32+/month static gateway fees.
5. **Signed URLs for Media Delivery**: High-bandwidth audio is served directly via Cloud Storage edges rather than burdening the application container.

---

## 3. How to Set Up a GCP Budget Alert (Crucial Step)

Budget alerts will notify you via email if your spending approaches a threshold.  
*(Note: Budget alerts send notifications; they do not automatically shut down resources by default.)*

1. Open the [Google Cloud Billing Console](https://console.cloud.google.com/billing).
2. Select your Billing Account &rarr; Click **Budgets &amp; alerts**.
3. Click **Create budget**:
   - **Name**: `CloudTune-Student-Safety-Budget`
   - **Target amount**: `$1.00` or `$5.00`.
   - **Threshold rules**: Set alerts at **50%**, **90%**, and **100%**.
4. Check **Email alerts to billing admins**.
5. Click **Finish**.

---

## 4. Decommissioning Resources (Clean Up After Viva)

When your MCA project evaluation and semester are completed, delete the cloud resources to ensure zero recurring charges:

```bash
# 1. Delete the Cloud Run service
gcloud run services delete cloudtune-api --region us-central1 --quiet

# 2. Empty and delete the Cloud Storage media bucket
gcloud storage rm --recursive gs://cloudtune-media-<YOUR-PROJECT-ID>

# 3. Delete the Artifact Registry repository
gcloud artifacts repositories delete cloudtune-repo --location us-central1 --quiet

# 4. (Optional) Shut down the entire GCP Project
gcloud projects delete <YOUR-PROJECT-ID>
```
