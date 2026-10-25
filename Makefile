# ==============================================================================
# 🎵 CloudTune — Google Cloud Platform & Cloud Shell Makefile
# ==============================================================================
# Complete lifecycle automation for MCA Academic Demonstration:
# Local Development, Docker Mesh, Terraform IaC, Cloud Build & Cloud Run Deploy
# ==============================================================================

SHELL := /bin/bash

# Auto-detect current active Google Cloud Project in Cloud Shell
PROJECT_ID   ?= $(shell gcloud config get-value project 2>/dev/null)
REGION       ?= us-central1
REPO_NAME    ?= cloudtune-repo
SERVICE_NAME ?= cloudtune-api
IMAGE_NAME   ?= $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(REPO_NAME)/$(SERVICE_NAME):latest
BUCKET_NAME  ?= cloudtune-media-$(PROJECT_ID)

# Terminal ANSI Color Palette
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
BLUE   := \033[34m
MAGENTA:= \033[35m
BOLD   := \033[1m
RESET  := \033[0m

.PHONY: help check-env config install dev dev-backend dev-frontend dev-cloudshell \
        test test-unit test-microservices docker-build docker-up docker-down docker-logs \
        tf-init tf-plan tf-apply tf-destroy tf-output build-backend deploy-backend \
        seed-firestore build-frontend deploy-frontend deploy-all status logs clean

# ------------------------------------------------------------------------------
# 1. Help Menu
# ------------------------------------------------------------------------------
help:
	@echo -e "${GREEN}${BOLD}"
	@echo "  ================================================================"
	@echo "    🎵  CLOUDTUNE — GOOGLE CLOUD SHELL WORKFLOW AUTOMATION        "
	@echo "  ================================================================"
	@echo -e "${RESET}"
	@echo -e "${YELLOW}Active GCP Project:${RESET} ${CYAN}$(if $(PROJECT_ID),$(PROJECT_ID),${RED}Not Set (Run 'make config PROJECT_ID=<id>')${CYAN})${RESET}"
	@echo -e "${YELLOW}Target Region:${RESET}      ${CYAN}$(REGION)${RESET}"
	@echo ""
	@echo -e "${BOLD}${BLUE}📦 Setup & Environment:${RESET}"
	@echo -e "  ${CYAN}make check-env${RESET}       Verify gcloud, node, docker, and terraform tools"
	@echo -e "  ${CYAN}make config${RESET}          Set active gcloud project and region"
	@echo -e "  ${CYAN}make install${RESET}         Install npm dependencies for both backend and frontend"
	@echo ""
	@echo -e "${BOLD}${BLUE}💻 Cloud Shell & Local Development:${RESET}"
	@echo -e "  ${CYAN}make dev${RESET}             Run backend (5000) and frontend (5173) concurrently"
	@echo -e "  ${CYAN}make dev-cloudshell${RESET}  Run backend + frontend on Port 8080 for Cloud Shell Web Preview"
	@echo -e "  ${CYAN}make dev-backend${RESET}     Run backend microservices mesh standalone"
	@echo -e "  ${CYAN}make dev-frontend${RESET}    Run Vite frontend development server standalone"
	@echo ""
	@echo -e "${BOLD}${BLUE}🧪 Automated Verification Tests:${RESET}"
	@echo -e "  ${CYAN}make test${RESET}            Run all 53 automated test cases (microservices + e2e)"
	@echo -e "  ${CYAN}make test-microservices${RESET}  Verify database isolation & inter-service REST endpoints"
	@echo -e "  ${CYAN}make test-unit${RESET}       Run API gateway integration test suite"
	@echo ""
	@echo -e "${BOLD}${BLUE}🐳 Docker Microservices Mesh:${RESET}"
	@echo -e "  ${CYAN}make docker-build${RESET}    Build Docker container images locally"
	@echo -e "  ${CYAN}make docker-up${RESET}       Start multi-container mesh with Docker Compose (Ports 5000-5004)"
	@echo -e "  ${CYAN}make docker-down${RESET}     Stop running Docker Compose containers"
	@echo -e "  ${CYAN}make docker-logs${RESET}     Follow live Docker Compose logs"
	@echo ""
	@echo -e "${BOLD}${BLUE}☁️ Terraform Infrastructure as Code (IaC):${RESET}"
	@echo -e "  ${CYAN}make tf-init${RESET}         Initialize Terraform workspace and providers"
	@echo -e "  ${CYAN}make tf-plan${RESET}         Generate execution plan for GCP resources"
	@echo -e "  ${CYAN}make tf-apply${RESET}        Provision APIs, Artifact Registry, GCS Bucket, Firestore & IAM"
	@echo -e "  ${CYAN}make tf-destroy${RESET}      Teardown and destroy provisioned cloud infrastructure"
	@echo -e "  ${CYAN}make tf-output${RESET}       Display provisioned resource endpoints and URLs"
	@echo ""
	@echo -e "${BOLD}${BLUE}🚀 Cloud Build & Cloud Run Deployment:${RESET}"
	@echo -e "  ${CYAN}make build-backend${RESET}   Build & push backend container using Google Cloud Build"
	@echo -e "  ${CYAN}make deploy-backend${RESET}  Deploy backend to Google Cloud Run (Serverless)"
	@echo -e "  ${CYAN}make seed-firestore${RESET}  Seed sample artists, albums, and tracks into Firestore"
	@echo -e "  ${CYAN}make build-frontend${RESET}  Build production React 18 / Vite bundle (frontend/dist)"
	@echo -e "  ${CYAN}make deploy-frontend${RESET} Deploy frontend SPA to Firebase Hosting"
	@echo -e "  ${CYAN}make deploy-all${RESET}      Execute full automated end-to-end deployment"
	@echo ""
	@echo -e "${BOLD}${BLUE}📊 Observability & Utilities:${RESET}"
	@echo -e "  ${CYAN}make status${RESET}          Check Cloud Run and GCP resource operational status"
	@echo -e "  ${CYAN}make logs${RESET}            Stream live Google Cloud Run backend logs"
	@echo -e "  ${CYAN}make clean${RESET}           Clean local node_modules, build outputs, and test caches"
	@echo ""

# ------------------------------------------------------------------------------
# 2. Environment Verification & Configuration
# ------------------------------------------------------------------------------
check-env:
	@echo -e "${BLUE}🔍 Checking Cloud Shell environment and prerequisites...${RESET}"
	@which gcloud >/dev/null 2>&1 && echo -e "  ✅ gcloud CLI:   $$(gcloud version | head -n1)" || echo -e "  ❌ gcloud CLI:   Not found"
	@which node >/dev/null 2>&1 && echo -e "  ✅ Node.js:      $$(node -v)" || echo -e "  ❌ Node.js:      Not found"
	@which npm >/dev/null 2>&1 && echo -e "  ✅ npm:          v$$(npm -v)" || echo -e "  ❌ npm:          Not found"
	@which docker >/dev/null 2>&1 && echo -e "  ✅ Docker:       $$(docker --version)" || echo -e "  ⚠️ Docker:       Not running"
	@which terraform >/dev/null 2>&1 && echo -e "  ✅ Terraform:    $$(terraform version | head -n1)" || echo -e "  ⚠️ Terraform:    Not found (Install via 'sudo apt-get install terraform')"
	@echo ""
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}⚠️ No active GCP Project configured! Run: make config PROJECT_ID=<your-project-id>${RESET}"; \
	else \
		echo -e "${GREEN}✅ Active GCP Project: ${BOLD}$(PROJECT_ID)${RESET} in ${BOLD}$(REGION)${RESET}"; \
	fi

config:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Usage: make config PROJECT_ID=<your-gcp-project-id>${RESET}"; exit 1; \
	fi
	@echo -e "${BLUE}⚙️ Configuring gcloud defaults for project: $(PROJECT_ID)...${RESET}"
	gcloud config set project $(PROJECT_ID)
	gcloud config set run/region $(REGION)
	@echo -e "${GREEN}✅ gcloud configured successfully.${RESET}"

install:
	@echo -e "${BLUE}📦 Installing Backend dependencies...${RESET}"
	cd backend && npm install
	@echo -e "${BLUE}📦 Installing Frontend dependencies...${RESET}"
	cd frontend && npm install
	@echo -e "${GREEN}✅ All dependencies installed successfully!${RESET}"

# ------------------------------------------------------------------------------
# 3. Development Workflows
# ------------------------------------------------------------------------------
dev:
	@echo -e "${GREEN}🚀 Starting CloudTune Microservices Mesh & Frontend concurrently...${RESET}"
	@(trap 'kill 0' SIGINT SIGTERM EXIT; \
	  (cd backend && npm run dev) & \
	  (cd frontend && npm run dev) & \
	  wait)

dev-backend:
	@echo -e "${GREEN}🎵 Starting Backend Microservices Mesh (Port 5000)...${RESET}"
	cd backend && npm run dev

dev-frontend:
	@echo -e "${GREEN}🌐 Starting React Frontend (Port 5173)...${RESET}"
	cd frontend && npm run dev

dev-cloudshell:
	@echo -e "${GREEN}🚀 Booting CloudTune for Google Cloud Shell Web Preview...${RESET}"
	@echo -e "${YELLOW}  - Backend Mesh: Port 5000${RESET}"
	@echo -e "${YELLOW}  - Frontend UI:   Port 8080 (Matches Cloud Shell Web Preview button)${RESET}"
	@(trap 'kill 0' SIGINT SIGTERM EXIT; \
	  (cd backend && npm run start) & \
	  (cd frontend && npx vite --host 0.0.0.0 --port 8080) & \
	  wait)

# ------------------------------------------------------------------------------
# 4. Testing & Verification
# ------------------------------------------------------------------------------
test: test-microservices test-unit
	@echo -e "${GREEN}🎉 All test suites passed successfully!${RESET}"

test-microservices:
	@echo -e "${BLUE}🧪 Running Microservices Isolation & REST Mesh Tests (29 tests)...${RESET}"
	cd backend && npm run test:microservices

test-unit:
	@echo -e "${BLUE}🧪 Running Gateway Integration & Controller Tests (24 tests)...${RESET}"
	cd backend && npm run test

# ------------------------------------------------------------------------------
# 5. Docker Compose Workflows
# ------------------------------------------------------------------------------
docker-build:
	@echo -e "${BLUE}🐳 Building Docker Compose microservice containers...${RESET}"
	docker compose build

docker-up:
	@echo -e "${GREEN}🐳 Starting CloudTune Microservices Mesh with Docker Compose...${RESET}"
	docker compose up -d --build
	@echo -e "${GREEN}✅ Containers running! API Gateway accessible at http://localhost:5000${RESET}"
	@echo -e "   Run '${CYAN}make docker-logs${RESET}' to view output or '${CYAN}make docker-down${RESET}' to stop."

docker-down:
	@echo -e "${YELLOW}🛑 Stopping Docker Compose microservices containers...${RESET}"
	docker compose down

docker-logs:
	docker compose logs -f

# ------------------------------------------------------------------------------
# 6. Terraform Infrastructure as Code (IaC)
# ------------------------------------------------------------------------------
tf-init:
	@echo -e "${BLUE}☁️ Initializing Terraform in terraform/ ...${RESET}"
	terraform -chdir=terraform init

tf-plan:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Error: PROJECT_ID is required. Run: make tf-plan PROJECT_ID=<id>${RESET}"; exit 1; \
	fi
	@echo -e "${BLUE}☁️ Planning Terraform infrastructure for $(PROJECT_ID)...${RESET}"
	terraform -chdir=terraform plan \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)"

tf-apply:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Error: PROJECT_ID is required. Run: make tf-apply PROJECT_ID=<id>${RESET}"; exit 1; \
	fi
	@echo -e "${GREEN}☁️ Provisioning GCP infrastructure via Terraform for $(PROJECT_ID)...${RESET}"
	terraform -chdir=terraform apply -auto-approve \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)"
	@echo ""
	@$(MAKE) tf-output

tf-destroy:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Error: PROJECT_ID is required. Run: make tf-destroy PROJECT_ID=<id>${RESET}"; exit 1; \
	fi
	@echo -e "${RED}⚠️ Destroying Terraform provisioned infrastructure for $(PROJECT_ID)...${RESET}"
	terraform -chdir=terraform destroy -auto-approve \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)"

tf-output:
	@terraform -chdir=terraform output

# ------------------------------------------------------------------------------
# 7. Google Cloud Build & Cloud Run Deployment
# ------------------------------------------------------------------------------
build-backend:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Error: PROJECT_ID is required. Run: make build-backend PROJECT_ID=<id>${RESET}"; exit 1; \
	fi
	@echo -e "${BLUE}🏗️ Building Backend container with Cloud Build: ${BOLD}$(IMAGE_NAME)${RESET}..."
	gcloud builds submit ./backend \
		--tag "$(IMAGE_NAME)" \
		--project="$(PROJECT_ID)"
	@echo -e "${GREEN}✅ Backend container image built and pushed to Artifact Registry!${RESET}"

deploy-backend:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Error: PROJECT_ID is required. Run: make deploy-backend PROJECT_ID=<id>${RESET}"; exit 1; \
	fi
	@echo -e "${GREEN}🚀 Deploying ${SERVICE_NAME} to Google Cloud Run...${RESET}"
	gcloud run deploy "$(SERVICE_NAME)" \
		--image "$(IMAGE_NAME)" \
		--region "$(REGION)" \
		--project "$(PROJECT_ID)" \
		--platform managed \
		--allow-unauthenticated \
		--port 8080 \
		--memory 512Mi \
		--cpu 1 \
		--min-instances 0 \
		--max-instances 5 \
		--set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=$(PROJECT_ID),GCP_STORAGE_BUCKET_NAME=$(BUCKET_NAME),ENABLE_GCS_UPLOAD=true,GCP_REGION=$(REGION)"
	@echo ""
	@SERVICE_URL=$$(gcloud run services describe "$(SERVICE_NAME)" --platform managed --region "$(REGION)" --project "$(PROJECT_ID)" --format 'value(status.url)'); \
	echo -e "${GREEN}🎉 Cloud Run URL: $${SERVICE_URL}${RESET}"; \
	echo -e "${GREEN}🔍 Health Check:  $${SERVICE_URL}/api/health${RESET}"

seed-firestore:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Error: PROJECT_ID is required. Run: make seed-firestore PROJECT_ID=<id>${RESET}"; exit 1; \
	fi
	@echo -e "${BLUE}🌱 Seeding demonstration catalogue into Firestore...${RESET}"
	GCP_PROJECT_ID="$(PROJECT_ID)" node gcp-config/seed-firestore.js

build-frontend:
	@echo -e "${BLUE}🏗️ Building production React Vite frontend bundle...${RESET}"
	cd frontend && npm run build
	@echo -e "${GREEN}✅ Frontend bundle created in frontend/dist${RESET}"

deploy-frontend: build-frontend
	@echo -e "${GREEN}🌐 Deploying Frontend to Firebase Hosting...${RESET}"
	npx -y firebase-tools deploy --only hosting
	@echo -e "${GREEN}🎉 Frontend successfully deployed!${RESET}"

deploy-all:
	@echo -e "${GREEN}${BOLD}🚀 Starting Complete CloudTune Deployment Pipeline...${RESET}"
	@$(MAKE) tf-apply
	@$(MAKE) build-backend
	@$(MAKE) deploy-backend
	@$(MAKE) seed-firestore
	@$(MAKE) build-frontend
	@echo -e "${GREEN}${BOLD}🎉 Full pipeline executed successfully!${RESET}"

# ------------------------------------------------------------------------------
# 8. Observability & Maintenance
# ------------------------------------------------------------------------------
status:
	@echo -e "${BLUE}📊 Checking GCP Cloud Run and Resource Status for $(PROJECT_ID)...${RESET}"
	@echo -e "${BOLD}Cloud Run Services:${RESET}"
	@gcloud run services list --project="$(PROJECT_ID)" --region="$(REGION)" 2>/dev/null || true
	@echo ""
	@echo -e "${BOLD}Artifact Registry Repositories:${RESET}"
	@gcloud artifacts repositories list --project="$(PROJECT_ID)" --location="$(REGION)" 2>/dev/null || true
	@echo ""
	@echo -e "${BOLD}Cloud Storage Buckets:${RESET}"
	@gcloud storage buckets list --project="$(PROJECT_ID)" 2>/dev/null || true

logs:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Error: PROJECT_ID is required. Run: make logs PROJECT_ID=<id>${RESET}"; exit 1; \
	fi
	@echo -e "${BLUE}📋 Streaming live logs for Cloud Run service ${SERVICE_NAME}...${RESET}"
	gcloud run services logs tail "$(SERVICE_NAME)" --project="$(PROJECT_ID)" --region="$(REGION)"

clean:
	@echo -e "${YELLOW}🧹 Cleaning build artifacts and cache directories...${RESET}"
	rm -rf frontend/dist
	rm -rf backend/services/catalog-service/data/*.db.json
	rm -rf backend/services/playlist-service/data/*.db.json
	rm -rf backend/services/user-service/data/*.db.json
	rm -rf backend/services/admin-service/data/*.db.json
	rm -rf terraform/.terraform
	rm -f terraform/.terraform.lock.hcl
	rm -f terraform/terraform.tfstate*
	@echo -e "${GREEN}✅ Workspace cleaned!${RESET}"
