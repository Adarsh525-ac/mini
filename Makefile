# ==============================================================================
# 🎵 CloudTune — Google Cloud Platform & Cloud Shell Makefile
# ==============================================================================
# Complete lifecycle automation for MCA Academic Demonstration:
# Local Development, Docker Mesh, Terraform IaC, Cloud Build & Cloud Run Deploy
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ------------------------------------------------------------------------------
# Configuration Variables (override via CLI: e.g. make tf-apply PROJECT_ID=my-id)
# ------------------------------------------------------------------------------
PROJECT_ID   ?= $(shell gcloud config get-value project 2>/dev/null)
REGION       ?= us-central1
REPO_NAME    ?= cloudtune-repo
SERVICE_NAME ?= cloudtune-api
IMAGE_TAG    ?= latest
PORT         ?= 8080
TF_DIR       ?= terraform

# Derived constants
REGISTRY_HOST = $(REGION)-docker.pkg.dev
IMAGE_NAME    = $(REGISTRY_HOST)/$(PROJECT_ID)/$(REPO_NAME)/$(SERVICE_NAME):$(IMAGE_TAG)
IMAGE_URL     = $(IMAGE_NAME)
BUCKET_NAME   = cloudtune-media-$(PROJECT_ID)

# Automatic Cloud Shell Terraform Authentication Token
TF_AUTH = GOOGLE_OAUTH_ACCESS_TOKEN=$$(gcloud auth print-access-token 2>/dev/null)

# Terminal ANSI Color Palette
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
BLUE   := \033[34m
MAGENTA:= \033[35m
BOLD   := \033[1m
RESET  := \033[0m

.PHONY: help check-auth check-project check-env doctor config setup-gcp install install-pnpm \
        dev dev-backend dev-frontend dev-cloudshell \
        test test-unit test-microservices docker-build docker-up docker-down docker-logs docker-run \
        tf-init tf-plan tf-apply tf-destroy tf-output \
        build build-backend build-local push deploy deploy-backend deploy-frontend deploy-all \
        seed-firestore build-frontend url status logs clean

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
	@echo -e "  ${CYAN}make check-env${RESET}       Verify gcloud, node, docker, and terraform tools (alias: doctor)"
	@echo -e "  ${CYAN}make config${RESET}          Set active gcloud project and region"
	@echo -e "  ${CYAN}make setup-gcp${RESET}       Enable required GCP APIs and configure Docker auth"
	@echo -e "  ${CYAN}make install${RESET}         Install npm dependencies for both backend and frontend"
	@echo -e "  ${CYAN}make install-pnpm${RESET}    Activate pnpm via corepack and install root packages"
	@echo ""
	@echo -e "${BOLD}${BLUE}💻 Cloud Shell & Local Development:${RESET}"
	@echo -e "  ${CYAN}make dev${RESET}             Run backend (5000) and frontend concurrently"
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
	@echo -e "  ${CYAN}make docker-run${RESET}      Run standalone backend container on port 8080"
	@echo ""
	@echo -e "${BOLD}${BLUE}☁️ Terraform Infrastructure as Code (IaC):${RESET}"
	@echo -e "  ${CYAN}make tf-init${RESET}         Initialize Terraform workspace and providers"
	@echo -e "  ${CYAN}make tf-plan${RESET}         Generate execution plan for GCP resources"
	@echo -e "  ${CYAN}make tf-apply${RESET}        Provision APIs, Artifact Registry, GCS Bucket, Firestore & IAM"
	@echo -e "  ${CYAN}make tf-destroy${RESET}      Teardown and destroy provisioned cloud infrastructure"
	@echo -e "  ${CYAN}make tf-output${RESET}       Display provisioned resource endpoints and URLs"
	@echo ""
	@echo -e "${BOLD}${BLUE}🚀 Cloud Build & Cloud Run Deployment:${RESET}"
	@echo -e "  ${CYAN}make build-backend${RESET}   Build & push backend container using Google Cloud Build (alias: build)"
	@echo -e "  ${CYAN}make deploy-backend${RESET}  Deploy backend to Google Cloud Run (Serverless) (alias: deploy)"
	@echo -e "  ${CYAN}make seed-firestore${RESET}  Seed sample artists, albums, and tracks into Firestore"
	@echo -e "  ${CYAN}make build-frontend${RESET}  Build production React 18 / Vite bundle (frontend/dist)"
	@echo -e "  ${CYAN}make deploy-frontend${RESET} Deploy frontend SPA to Firebase Hosting"
	@echo -e "  ${CYAN}make deploy-all${RESET}      Execute full automated end-to-end deployment"
	@echo ""
	@echo -e "${BOLD}${BLUE}📊 Observability & Utilities:${RESET}"
	@echo -e "  ${CYAN}make status${RESET}          Check Cloud Run and GCP resource operational status"
	@echo -e "  ${CYAN}make url${RESET}             Print active Cloud Run service URL"
	@echo -e "  ${CYAN}make logs${RESET}            Stream live Google Cloud Run backend logs"
	@echo -e "  ${CYAN}make clean${RESET}           Clean local node_modules, build outputs, and test caches"
	@echo ""

# ------------------------------------------------------------------------------
# 2. Helper Validation & Automatic Cloud Shell Authentication
# ------------------------------------------------------------------------------
check-auth:
	@CURRENT_ACC=$$(gcloud config get-value account 2>/dev/null); \
	if [ -z "$$CURRENT_ACC" ] || [ "$$CURRENT_ACC" = "(unset)" ] || [ "$$CURRENT_ACC" = "YOUR_GOOGLE_EMAIL" ] || [ "$$CURRENT_ACC" = "ACCOUNT" ]; then \
		DETECTED_ACC=$$(gcloud auth list --format="value(account)" 2>/dev/null | grep -E "@" | grep -v "YOUR_GOOGLE_EMAIL" | head -n 1); \
		if [ -n "$$DETECTED_ACC" ]; then \
			echo -e "$(CYAN)Automatically activating real Cloud Shell account: $$DETECTED_ACC$(RESET)"; \
			gcloud config set account "$$DETECTED_ACC" --quiet 2>/dev/null; \
		else \
			gcloud config unset account --quiet 2>/dev/null; \
		fi \
	fi

check-project: check-auth
	@if [ -z "$(PROJECT_ID)" ] || [ "$(PROJECT_ID)" = "(unset)" ] || [ "$(PROJECT_ID)" = "YOUR_PROJECT_ID" ]; then \
		echo -e "\n$(RED)$(BOLD)ERROR: Google Cloud Project ID is not configured!$(RESET)"; \
		echo -e "Run: $(CYAN)make config PROJECT_ID=<your-gcp-project-id>$(RESET) or set via $(CYAN)PROJECT_ID=...$(RESET)\n"; \
		exit 1; \
	fi

# ------------------------------------------------------------------------------
# 3. Environment Verification & Configuration
# ------------------------------------------------------------------------------
check-env doctor:
	@echo -e "${BLUE}🔍 Checking Cloud Shell environment and prerequisites...${RESET}"
	@which gcloud >/dev/null 2>&1 && echo -e "  ✅ gcloud CLI:   $$(gcloud version | head -n1)" || echo -e "  ❌ gcloud CLI:   Not found"
	@which node >/dev/null 2>&1 && echo -e "  ✅ Node.js:      $$(node -v)" || echo -e "  ❌ Node.js:      Not found"
	@which npm >/dev/null 2>&1 && echo -e "  ✅ npm:          v$$(npm -v)" || echo -e "  ❌ npm:          Not found"
	@which docker >/dev/null 2>&1 && echo -e "  ✅ Docker:       $$(docker --version)" || echo -e "  ⚠️ Docker:       Not running"
	@which terraform >/dev/null 2>&1 && echo -e "  ✅ Terraform:    $$(terraform version | head -n1)" || echo -e "  ⚠️ Terraform:    Not found (Install via 'sudo apt-get install terraform')"
	@which pnpm >/dev/null 2>&1 && echo -e "  ✅ pnpm:         v$$(pnpm -v)" || echo -e "  ℹ️ pnpm:         Not installed (Optional: run 'make install-pnpm')"
	@echo ""
	@if [ -z "$(PROJECT_ID)" ] || [ "$(PROJECT_ID)" = "(unset)" ]; then \
		echo -e "${RED}⚠️ No active GCP Project configured! Run: make config PROJECT_ID=<your-project-id>${RESET}"; \
	else \
		echo -e "${GREEN}✅ Active GCP Project: ${BOLD}$(PROJECT_ID)${RESET} in ${BOLD}$(REGION)${RESET}"; \
		echo -e "${GREEN}✅ Active Account:     $$(gcloud config get-value account 2>/dev/null)${RESET}"; \
	fi

config:
	@if [ -z "$(PROJECT_ID)" ]; then \
		echo -e "${RED}Usage: make config PROJECT_ID=<your-gcp-project-id>${RESET}"; exit 1; \
	fi
	@echo -e "${BLUE}⚙️ Configuring gcloud defaults for project: $(PROJECT_ID)...${RESET}"
	gcloud config set project $(PROJECT_ID)
	gcloud config set run/region $(REGION)
	@echo -e "${GREEN}✅ gcloud configured successfully.${RESET}"

setup-gcp: check-project
	@echo -e "\n${BOLD}${CYAN}Enabling required GCP APIs for project: $(PROJECT_ID)...${RESET}"
	gcloud services enable \
		run.googleapis.com \
		artifactregistry.googleapis.com \
		firestore.googleapis.com \
		storage.googleapis.com \
		cloudbuild.googleapis.com \
		iam.googleapis.com \
		logging.googleapis.com \
		monitoring.googleapis.com \
		--project=$(PROJECT_ID)
	@echo -e "\n${BOLD}${CYAN}Configuring Docker credentials for Artifact Registry ($(REGISTRY_HOST))...${RESET}"
	gcloud auth configure-docker $(REGISTRY_HOST) --quiet
	@echo -e "${GREEN}${BOLD}✓ GCP setup complete!${RESET}\n"

install:
	@echo -e "${BLUE}📦 Installing Backend dependencies...${RESET}"
	@if [ -d "backend" ]; then cd backend && npm install; fi
	@echo -e "${BLUE}📦 Installing Frontend dependencies...${RESET}"
	@if [ -d "frontend" ]; then cd frontend && npm install; fi
	@if [ -f "package.json" ]; then \
		echo -e "${BLUE}📦 Installing root dependencies...${RESET}"; \
		npm install || true; \
	fi
	@echo -e "${GREEN}✅ All dependencies installed successfully!${RESET}"

install-pnpm:
	@echo -e "${CYAN}Activating pnpm via corepack...${RESET}"
	corepack enable && corepack prepare pnpm@latest --activate
	@echo -e "${GREEN}${BOLD}✓ pnpm activated!${RESET} Version: $$(pnpm --version)"
	pnpm install

# ------------------------------------------------------------------------------
# 4. Development Workflows
# ------------------------------------------------------------------------------
dev:
	@echo -e "${GREEN}🚀 Starting CloudTune Microservices Mesh & Frontend concurrently...${RESET}"
	@if [ -d "backend" ] && [ -d "frontend" ]; then \
		(trap 'kill 0' SIGINT SIGTERM EXIT; \
		  (cd backend && npm run dev) & \
		  (cd frontend && npm run dev) & \
		  wait); \
	elif which pnpm >/dev/null 2>&1 && [ -f "pnpm-workspace.yaml" ]; then \
		pnpm dev -p $(PORT) -H 0.0.0.0; \
	else \
		npm run dev; \
	fi

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
# 5. Testing & Verification
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
# 6. Docker Compose Workflows
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

docker-run:
	@echo -e "${GREEN}${BOLD}Running container on http://0.0.0.0:$(PORT)...${RESET}"
	@echo -e "${YELLOW}Use Cloud Shell Web Preview on port $(PORT) to view.${RESET}"
	docker run --rm -it -p $(PORT):8080 $(SERVICE_NAME):$(IMAGE_TAG)

# ------------------------------------------------------------------------------
# 7. Terraform Infrastructure as Code (IaC)
# ------------------------------------------------------------------------------
tf-init:
	@echo -e "${BLUE}☁️ Initializing Terraform in $(TF_DIR)/ ...${RESET}"
	terraform -chdir=$(TF_DIR) init

tf-plan: check-project
	@echo -e "${BLUE}☁️ Planning Terraform infrastructure for $(PROJECT_ID)...${RESET}"
	$(TF_AUTH) terraform -chdir=$(TF_DIR) plan \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)" \
		-var="service_name=$(SERVICE_NAME)" \
		-var="repository_id=$(REPO_NAME)" \
		-var="image_tag=$(IMAGE_TAG)"

tf-apply: check-project
	@echo -e "${GREEN}☁️ Provisioning GCP infrastructure via Terraform for $(PROJECT_ID)...${RESET}"
	$(TF_AUTH) terraform -chdir=$(TF_DIR) apply -auto-approve \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)" \
		-var="service_name=$(SERVICE_NAME)" \
		-var="repository_id=$(REPO_NAME)" \
		-var="image_tag=$(IMAGE_TAG)"
	@echo ""
	@$(MAKE) tf-output

tf-destroy: check-project
	@echo -e "${RED}${BOLD}WARNING: This will destroy all provisioned resources for $(PROJECT_ID)!${RESET}"
	@read -p "Are you sure you want to proceed? [y/N] " ans && [ "$${ans:-N}" = "y" ] || [ "$${ans:-N}" = "Y" ]
	@echo -e "${YELLOW}Purging container images from Artifact Registry (if any) to allow repository cleanup...${RESET}"
	-gcloud artifacts docker images list "$(REGISTRY_HOST)/$(PROJECT_ID)/$(REPO_NAME)" --format="value(package)" 2>/dev/null | xargs -r -I {} gcloud artifacts packages delete {} --repository=$(REPO_NAME) --location=$(REGION) --project=$(PROJECT_ID) --quiet 2>/dev/null || true
	$(TF_AUTH) terraform -chdir=$(TF_DIR) destroy -auto-approve \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)" \
		-var="service_name=$(SERVICE_NAME)" \
		-var="repository_id=$(REPO_NAME)" \
		-var="image_tag=$(IMAGE_TAG)"
	@echo -e "${GREEN}${BOLD}✓ Terraform resources destroyed.${RESET}"

tf-output:
	@terraform -chdir=$(TF_DIR) output

# ------------------------------------------------------------------------------
# 8. Google Cloud Build & Cloud Run Deployment
# ------------------------------------------------------------------------------
build build-backend: check-project
	@echo -e "${BLUE}🏗️ Building Backend container with Cloud Build: ${BOLD}$(IMAGE_NAME)${RESET}..."
	gcloud builds submit ./backend \
		--tag "$(IMAGE_NAME)" \
		--project="$(PROJECT_ID)"
	@echo -e "${GREEN}✅ Backend container image built and pushed to Artifact Registry!${RESET}"

build-local: check-project
	@echo -e "${CYAN}${BOLD}Building Docker image locally: $(IMAGE_NAME)...${RESET}"
	docker build -t $(IMAGE_NAME) ./backend
	@echo -e "${GREEN}${BOLD}✓ Local build complete!${RESET}"

push: check-project
	@echo -e "${CYAN}${BOLD}Configuring Docker authentication...${RESET}"
	gcloud auth configure-docker $(REGISTRY_HOST) --quiet
	@echo -e "${CYAN}${BOLD}Pushing $(IMAGE_NAME)...${RESET}"
	docker push $(IMAGE_NAME)
	@echo -e "${GREEN}${BOLD}✓ Container pushed to Artifact Registry!${RESET}"

deploy deploy-backend: check-project
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
	@$(MAKE) url

seed-firestore: check-project
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

deploy-all: check-project
	@echo -e "${GREEN}${BOLD}🚀 Starting Complete CloudTune Deployment Pipeline...${RESET}"
	@$(MAKE) tf-init
	@$(MAKE) tf-apply
	@$(MAKE) build-backend
	@$(MAKE) deploy-backend
	@$(MAKE) seed-firestore
	@$(MAKE) build-frontend
	@echo -e "${GREEN}${BOLD}🎉 Full pipeline executed successfully!${RESET}"

# ------------------------------------------------------------------------------
# 9. Observability & Maintenance
# ------------------------------------------------------------------------------
url: check-project
	@echo -ne "\n${BOLD}Cloud Run Service URL: ${GREEN}"
	@gcloud run services describe "$(SERVICE_NAME)" \
		--region="$(REGION)" \
		--project="$(PROJECT_ID)" \
		--format='value(status.url)' 2>/dev/null || echo -e "${YELLOW}Service not yet deployed or not found.${RESET}"
	@echo -e "${RESET}\n"

status: check-project
	@echo -e "${BLUE}📊 Checking GCP Cloud Run and Resource Status for $(PROJECT_ID)...${RESET}"
	@echo -e "${BOLD}Cloud Run Services:${RESET}"
	@gcloud run services list --project="$(PROJECT_ID)" --region="$(REGION)" 2>/dev/null || true
	@echo ""
	@echo -e "${BOLD}Artifact Registry Repositories:${RESET}"
	@gcloud artifacts repositories list --project="$(PROJECT_ID)" --location="$(REGION)" 2>/dev/null || true
	@echo ""
	@echo -e "${BOLD}Cloud Storage Buckets:${RESET}"
	@gcloud storage buckets list --project="$(PROJECT_ID)" 2>/dev/null || true

logs: check-project
	@echo -e "${BLUE}📋 Streaming live logs for Cloud Run service ${SERVICE_NAME}...${RESET}"
	gcloud run services logs tail "$(SERVICE_NAME)" --project="$(PROJECT_ID)" --region="$(REGION)"

clean:
	@echo -e "${YELLOW}🧹 Cleaning build artifacts and cache directories...${RESET}"
	rm -rf frontend/dist
	rm -rf .next out
	rm -rf backend/services/catalog-service/data/*.db.json
	rm -rf backend/services/playlist-service/data/*.db.json
	rm -rf backend/services/user-service/data/*.db.json
	rm -rf backend/services/admin-service/data/*.db.json
	rm -rf $(TF_DIR)/.terraform
	rm -f $(TF_DIR)/.terraform.lock.hcl
	rm -f $(TF_DIR)/*.tfstate*
	rm -f $(TF_DIR)/crash.log
	@echo -e "${GREEN}✅ Workspace cleaned!${RESET}"
