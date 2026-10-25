# CloudTune — MCA Cloud Computing Project Report & Viva Voce Guide

This document is prepared specifically for your **Master of Computer Applications (MCA)** project report, technical documentation, and external viva voce examination.

---

## 1. Cloud Service Model Mapping

In Cloud Computing, services are classified into hierarchical abstraction tiers:

```
+--------------------------------------------------------------------------+
| SaaS (Software as a Service)                                              |
| - Firebase Authentication (Turnkey identity provider)                    |
+--------------------------------------------------------------------------+
| Serverless / CaaS / FaaS (Containers / Functions as a Service)            |
| - Google Cloud Run (Fully managed container orchestration)                |
| - Cloud Storage (Managed object storage service)                         |
| - Cloud Firestore (Managed serverless NoSQL document database)           |
+--------------------------------------------------------------------------+
| PaaS (Platform as a Service)                                              |
| - Firebase Hosting (Application delivery & CDN infrastructure)           |
+--------------------------------------------------------------------------+
| IaaS (Infrastructure as a Service)                                        |
| - Underlying Google Andromeda SDN & Borg Container Infrastructure        |
+--------------------------------------------------------------------------+
```

### Why CloudTune Chose Serverless Over Traditional IaaS (VMs):
1. **Zero Idle Billing (Scale-to-Zero)**: Traditional VMs (EC2 / Compute Engine) bill continuously 24/7 even with zero users. Cloud Run scales down to 0 instances when no requests are active.
2. **Operational Overhead**: No OS patching, security kernel updates, or hypervisor configurations are required.
3. **Rapid Horizontal Elasticity**: Requests automatically trigger new container instances within milliseconds.

---

## 2. Cloud Deployment Model

- **Deployment Model**: **Public Cloud (Google Cloud Platform)** with a **Hybrid Local Development Topology**.
- **Rationale**:
  - Development and academic testing can occur locally using zero-cost in-memory mock providers.
  - Production deployment targets Google's worldwide public cloud multi-region infrastructure for elastic scaling and high availability (99.95% SLA).

---

## 3. Database Architecture: Why NoSQL Firestore?

| Characteristic | Relational Database (e.g. MySQL / PostgreSQL) | Cloud Firestore (CloudTune Implementation) |
|---|---|---|
| **Data Schema** | Rigid table structures requiring schema migrations | Flexible schema documents allowing rapid feature addition |
| **Scaling** | Vertical scaling (bigger VM) with read replicas | Native automatic horizontal sharding across Google datacenters |
| **Hierarchical Data** | Requires heavy `JOIN` operations (e.g. playlists to tracks) | Document subcollections and array containment (`songIds`) |
| **Realtime Sync** | Requires manual WebSocket server setup | Native real-time listeners through Firebase SDK |

---

## 4. Key Viva Voce Questions & Answers

### Q1: What is Google Cloud Run, and how does it differ from Google App Engine or Kubernetes (GKE)?
> **Answer**: Google Cloud Run is a managed serverless container execution platform built on the open-source **Knative** standard. Unlike App Engine (which restricts the runtime environment), Cloud Run allows any language or binary packaged inside a Docker container. Unlike GKE (which requires maintaining node pools and control planes), Cloud Run completely abstracts the underlying cluster and charges purely per 100ms of CPU/RAM utilized during request processing.

### Q2: Why does CloudTune use Signed URLs for music streaming instead of streaming through Express?
> **Answer**: If every user streamed multi-megabyte audio files directly through the Express.js server, the Node.js event loop would face high bandwidth consumption and memory pressure, creating an I/O bottleneck. By issuing a **cryptographically signed V4 URL** valid for 60 minutes, the client establishes a direct connection with Google Cloud Storage's global edge network. This enables **HTTP 206 Partial Content range requests** for seeking while keeping our API container lightweight and responsive.

### Q3: How is authentication security enforced in CloudTune?
> **Answer**: Identity is managed by Firebase Authentication using JSON Web Tokens (JWT). When a client calls a protected API endpoint, it passes `Authorization: Bearer <ID_TOKEN>`. The Express backend verifies the token using the `firebase-admin` SDK, decoding the cryptographically validated `uid`. Roles (such as `admin`) are verified against server-side Firestore records to prevent privilege escalation attacks.

### Q4: How does the application handle horizontal autoscaling?
> **Answer**: In Google Cloud Run, autoscaling is driven by concurrent HTTP requests. We configured container concurrency to 80 requests per instance. When traffic exceeds this threshold, Cloud Run automatically provisions additional container replicas up to our configured `max-instances=5`. When traffic subsides, it scales back down to zero.

### Q5: What security measures prevent unauthorized users from uploading or deleting songs?
> **Answer**: CloudTune implements **defense-in-depth**:
> 1. In the backend, the `verifyAdmin` middleware validates that the authenticated user possesses the administrator role before processing any catalogue mutation.
> 2. In Firestore, declarative security rules (`firestore.rules`) reject any client-side write operations to the `songs`, `artists`, and `albums` collections unless the user token proves administrator privileges.
> 3. Users cannot self-assign the `admin` role because profile creation rules restrict user-editable fields.
