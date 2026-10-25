# ==============================================================================
# Makefile - SONORA Next.js on Google Cloud Platform (Cloud Shell Ready)
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ------------------------------------------------------------------------------
# Configuration Variables (override via CLI: e.g., make deploy PROJECT_ID=my-id)
# ------------------------------------------------------------------------------
PROJECT_ID   ?= $(shell gcloud config get-value project 2>/dev/null)
REGION       ?= us-central1
SERVICE_NAME ?= sonora-web
REPO_NAME    ?= finalrepo
IMAGE_TAG    ?= latest
PORT         ?= 3000

# Derived constants
REGISTRY_HOST = $(REGION)-docker.pkg.dev
IMAGE_URL     = $(REGISTRY_HOST)/$(PROJECT_ID)/$(REPO_NAME)/$(SERVICE_NAME):$(IMAGE_TAG)
TF_DIR        = terraform

# Terminal styling
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
BOLD   := \033[1m
RESET  := \033[0m

# ------------------------------------------------------------------------------
# Helper validation
# ------------------------------------------------------------------------------
.PHONY: check-project
check-project:
	@if [ -z "$(PROJECT_ID)" ] || [ "$(PROJECT_ID)" = "(unset)" ]; then \
		echo -e "$(RED)$(BOLD)Error: GCP Project ID is not set.$(RESET)"; \
		echo -e "$(YELLOW)Please set your active project with:$(RESET)"; \
		echo -e "  gcloud config set project <YOUR_PROJECT_ID>"; \
		echo -e "$(YELLOW)Or pass it directly to make:$(RESET)"; \
		echo -e "  make <target> PROJECT_ID=<YOUR_PROJECT_ID>\n"; \
		exit 1; \
	fi

# ------------------------------------------------------------------------------
# Help Menu
# ------------------------------------------------------------------------------
.PHONY: help
help:
	@echo -e "\n$(BOLD)$(CYAN)================================================================$(RESET)"
	@echo -e "$(BOLD)$(CYAN)   SONORA Next.js - Google Cloud Shell & Terraform Automation   $(RESET)"
	@echo -e "$(BOLD)$(CYAN)================================================================$(RESET)"
	@echo -e "Current GCP Project: $(GREEN)$(if $(PROJECT_ID),$(PROJECT_ID),NOT SET)$(RESET) | Region: $(GREEN)$(REGION)$(RESET)"
	@echo -e "Service: $(GREEN)$(SERVICE_NAME)$(RESET) | Repo: $(GREEN)$(REPO_NAME)$(RESET) | Tag: $(GREEN)$(IMAGE_TAG)$(RESET)\n"
	@echo -e "$(BOLD)Available Commands:$(RESET)\n"
	@echo -e "  $(BOLD)$(YELLOW)Setup & Verification$(RESET)"
	@echo -e "    $(CYAN)make doctor$(RESET)          Verify installed tools, gcloud auth, and settings"
	@echo -e "    $(CYAN)make setup-gcp$(RESET)       Enable required GCP APIs and configure Docker auth"
	@echo -e "    $(CYAN)make install-pnpm$(RESET)    Enable corepack and install pnpm for Cloud Shell"
	@echo -e ""
	@echo -e "  $(BOLD)$(YELLOW)Local Development (Cloud Shell)$(RESET)"
	@echo -e "    $(CYAN)make dev$(RESET)              Run Next.js dev server on 0.0.0.0:$(PORT) for Web Preview"
	@echo -e "    $(CYAN)make docker-build$(RESET)     Build Docker container image locally"
	@echo -e "    $(CYAN)make docker-run$(RESET)       Run container locally on port $(PORT)"
	@echo -e ""
	@echo -e "  $(BOLD)$(YELLOW)Terraform Infrastructure$(RESET)"
	@echo -e "    $(CYAN)make tf-init$(RESET)         Initialize Terraform working directory"
	@echo -e "    $(CYAN)make tf-plan$(RESET)         Generate and view Terraform execution plan"
	@echo -e "    $(CYAN)make tf-apply$(RESET)        Provision GCP resources (Artifact Registry, Cloud Run)"
	@echo -e "    $(CYAN)make tf-output$(RESET)       Show Terraform outputs (URLs, emails, repos)"
	@echo -e "    $(CYAN)make tf-destroy$(RESET)      Tear down all provisioned GCP resources to stop costs"
	@echo -e ""
	@echo -e "  $(BOLD)$(YELLOW)Build & Deployment$(RESET)"
	@echo -e "    $(CYAN)make build$(RESET)            Build & push image using Google Cloud Build (recommended)"
	@echo -e "    $(CYAN)make build-local$(RESET)      Build image locally using Docker"
	@echo -e "    $(CYAN)make push$(RESET)             Push locally built Docker image to Artifact Registry"
	@echo -e "    $(CYAN)make deploy$(RESET)           Full 1-step deploy: infra -> build -> deploy -> live URL"
	@echo -e "    $(CYAN)make url$(RESET)              Print live Cloud Run service URL"
	@echo -e "    $(CYAN)make logs$(RESET)             Stream live Cloud Run application logs"
	@echo -e ""
	@echo -e "  $(BOLD)$(YELLOW)Cleanup$(RESET)"
	@echo -e "    $(CYAN)make clean$(RESET)            Clean local build caches and temporary files"
	@echo -e "\n$(CYAN)================================================================$(RESET)\n"

# ------------------------------------------------------------------------------
# Diagnostics and Setup
# ------------------------------------------------------------------------------
.PHONY: doctor
doctor:
	@echo -e "\n$(BOLD)Checking Environment & Prerequisites...$(RESET)"
	@echo -n "  • gcloud CLI:   " && (which gcloud >/dev/null 2>&1 && gcloud --version | head -n 1) || echo -e "$(RED)NOT FOUND$(RESET)"
	@echo -n "  • Terraform:    " && (which terraform >/dev/null 2>&1 && terraform version | head -n 1) || echo -e "$(RED)NOT FOUND$(RESET)"
	@echo -n "  • Docker:       " && (which docker >/dev/null 2>&1 && docker --version) || echo -e "$(RED)NOT FOUND$(RESET)"
	@echo -n "  • Node.js:      " && (which node >/dev/null 2>&1 && node --version) || echo -e "$(RED)NOT FOUND$(RESET)"
	@echo -n "  • pnpm:         " && (which pnpm >/dev/null 2>&1 && pnpm --version) || echo -e "$(YELLOW)NOT FOUND (run 'make install-pnpm')$(RESET)"
	@echo -e "\n$(BOLD)GCP Configuration:$(RESET)"
	@echo -e "  • Project ID:   $(GREEN)$(if $(PROJECT_ID),$(PROJECT_ID),$(RED)NOT SET$(RESET))"
	@echo -e "  • Region:       $(GREEN)$(REGION)$(RESET)"
	@echo -e "  • Target Image: $(GREEN)$(IMAGE_URL)$(RESET)\n"

.PHONY: setup-gcp
setup-gcp: check-project
	@echo -e "\n$(BOLD)$(CYAN)Enabling required GCP APIs for project: $(PROJECT_ID)...$(RESET)"
	gcloud services enable \
		run.googleapis.com \
		artifactregistry.googleapis.com \
		cloudbuild.googleapis.com \
		iam.googleapis.com \
		logging.googleapis.com \
		monitoring.googleapis.com \
		--project=$(PROJECT_ID)
	@echo -e "\n$(BOLD)$(CYAN)Configuring Docker credentials for Artifact Registry ($(REGISTRY_HOST))...$(RESET)"
	gcloud auth configure-docker $(REGISTRY_HOST) --quiet
	@echo -e "$(GREEN)$(BOLD)✓ GCP setup complete!$(RESET)\n"

.PHONY: install-pnpm
install-pnpm:
	@echo -e "$(CYAN)Activating pnpm via corepack...$(RESET)"
	corepack enable && corepack prepare pnpm@latest --activate
	@echo -e "$(GREEN)$(BOLD)✓ pnpm activated!$(RESET) Version: $$(pnpm --version)"

# ------------------------------------------------------------------------------
# Local Development in Cloud Shell
# ------------------------------------------------------------------------------
.PHONY: dev
dev:
	@echo -e "$(GREEN)$(BOLD)Starting Next.js development server on 0.0.0.0:$(PORT)...$(RESET)"
	@echo -e "$(YELLOW)Tip: In Cloud Shell, click 'Web Preview' -> 'Preview on port $(PORT)'$(RESET)"
	@if which pnpm >/dev/null 2>&1; then \
		pnpm dev -p $(PORT) -H 0.0.0.0; \
	else \
		npm run dev -- -p $(PORT) -H 0.0.0.0; \
	fi

.PHONY: docker-build
docker-build:
	@echo -e "$(CYAN)$(BOLD)Building Docker container locally ($(SERVICE_NAME):$(IMAGE_TAG))...$(RESET)"
	docker build -t $(SERVICE_NAME):$(IMAGE_TAG) .
	@echo -e "$(GREEN)$(BOLD)✓ Local Docker image built!$(RESET)"

.PHONY: docker-run
docker-run:
	@echo -e "$(GREEN)$(BOLD)Running container on http://0.0.0.0:$(PORT)...$(RESET)"
	@echo -e "$(YELLOW)Use Cloud Shell Web Preview on port $(PORT) to view.$(RESET)"
	docker run --rm -it -p $(PORT):3000 $(SERVICE_NAME):$(IMAGE_TAG)

# ------------------------------------------------------------------------------
# Terraform Infrastructure Management
# ------------------------------------------------------------------------------
.PHONY: tf-init
tf-init:
	@echo -e "$(CYAN)$(BOLD)Initializing Terraform...$(RESET)"
	terraform -chdir=$(TF_DIR) init

.PHONY: tf-plan
tf-plan: check-project
	@echo -e "$(CYAN)$(BOLD)Planning Terraform infrastructure for project $(PROJECT_ID)...$(RESET)"
	terraform -chdir=$(TF_DIR) plan \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)" \
		-var="service_name=$(SERVICE_NAME)" \
		-var="repository_id=$(REPO_NAME)" \
		-var="image_tag=$(IMAGE_TAG)"

.PHONY: tf-apply
tf-apply: check-project
	@echo -e "$(CYAN)$(BOLD)Applying Terraform infrastructure...$(RESET)"
	terraform -chdir=$(TF_DIR) apply -auto-approve \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)" \
		-var="service_name=$(SERVICE_NAME)" \
		-var="repository_id=$(REPO_NAME)" \
		-var="image_tag=$(IMAGE_TAG)"
	@echo -e "$(GREEN)$(BOLD)✓ Terraform apply completed successfully!$(RESET)"

.PHONY: tf-output
tf-output:
	@terraform -chdir=$(TF_DIR) output

.PHONY: tf-destroy
tf-destroy: check-project
	@echo -e "$(RED)$(BOLD)WARNING: This will destroy all provisioned resources for $(PROJECT_ID)!$(RESET)"
	@read -p "Are you sure you want to proceed? [y/N] " ans && [ "$${ans:-N}" = "y" ] || [ "$${ans:-N}" = "Y" ]
	@echo -e "$(YELLOW)Purging container images from Artifact Registry (if any) to allow repository cleanup...$(RESET)"
	-gcloud artifacts docker images list "$(REGISTRY_HOST)/$(PROJECT_ID)/$(REPO_NAME)" --format="value(package)" 2>/dev/null | xargs -r -I {} gcloud artifacts packages delete {} --repository=$(REPO_NAME) --location=$(REGION) --project=$(PROJECT_ID) --quiet 2>/dev/null || true
	terraform -chdir=$(TF_DIR) destroy -auto-approve \
		-var="project_id=$(PROJECT_ID)" \
		-var="region=$(REGION)" \
		-var="service_name=$(SERVICE_NAME)" \
		-var="repository_id=$(REPO_NAME)" \
		-var="image_tag=$(IMAGE_TAG)"
	@echo -e "$(GREEN)$(BOLD)✓ Terraform resources destroyed.$(RESET)"

# ------------------------------------------------------------------------------
# Build and Push Container Images
# ------------------------------------------------------------------------------
.PHONY: build
build: check-project
	@echo -e "$(CYAN)$(BOLD)Building and pushing image via Google Cloud Build...$(RESET)"
	@echo -e "Target: $(GREEN)$(IMAGE_URL)$(RESET)"
	gcloud builds submit \
		--project=$(PROJECT_ID) \
		--config=cloudbuild.yaml \
		--substitutions=_REGION=$(REGION),_REPO_NAME=$(REPO_NAME),_SERVICE_NAME=$(SERVICE_NAME),_IMAGE_TAG=$(IMAGE_TAG) \
		.
	@echo -e "$(GREEN)$(BOLD)✓ Cloud Build completed and pushed to Artifact Registry!$(RESET)"

.PHONY: build-local
build-local: check-project
	@echo -e "$(CYAN)$(BOLD)Building Docker image locally: $(IMAGE_URL)...$(RESET)"
	docker build -t $(IMAGE_URL) .
	@echo -e "$(GREEN)$(BOLD)✓ Local build complete!$(RESET)"

.PHONY: push
push: check-project
	@echo -e "$(CYAN)$(BOLD)Configuring Docker authentication...$(RESET)"
	gcloud auth configure-docker $(REGISTRY_HOST) --quiet
	@echo -e "$(CYAN)$(BOLD)Pushing $(IMAGE_URL)...$(RESET)"
	docker push $(IMAGE_URL)
	@echo -e "$(GREEN)$(BOLD)✓ Container pushed to Artifact Registry!$(RESET)"

# ------------------------------------------------------------------------------
# Deployment & Operations
# ------------------------------------------------------------------------------
.PHONY: deploy
deploy: check-project
	@echo -e "\n$(BOLD)$(CYAN)================================================================$(RESET)"
	@echo -e "$(BOLD)$(CYAN)   Starting 1-Step Deployment to Google Cloud Run               $(RESET)"
	@echo -e "$(BOLD)$(CYAN)================================================================$(RESET)\n"
	@echo -e "$(YELLOW)Step 1/3: Ensuring GCP Infrastructure is Provisioned via Terraform...$(RESET)"
	@$(MAKE) tf-init
	@$(MAKE) tf-apply
	@echo -e "\n$(YELLOW)Step 2/3: Building and Pushing Container Image via Cloud Build...$(RESET)"
	@$(MAKE) build
	@echo -e "\n$(YELLOW)Step 3/3: Updating Cloud Run Service with New Container...$(RESET)"
	gcloud run deploy $(SERVICE_NAME) \
		--image=$(IMAGE_URL) \
		--region=$(REGION) \
		--project=$(PROJECT_ID) \
		--quiet
	@echo -e "\n$(GREEN)$(BOLD)================================================================$(RESET)"
	@echo -e "$(GREEN)$(BOLD)✓ DEPLOYMENT SUCCEEDED!$(RESET)"
	@echo -e "$(GREEN)$(BOLD)================================================================$(RESET)"
	@$(MAKE) url

.PHONY: url
url: check-project
	@echo -ne "\n$(BOLD)Cloud Run Service URL: $(GREEN)"
	@gcloud run services describe $(SERVICE_NAME) \
		--region=$(REGION) \
		--project=$(PROJECT_ID) \
		--format='value(status.url)' 2>/dev/null || echo -e "$(YELLOW)Service not yet deployed or not found.$(RESET)"
	@echo -e "$(RESET)\n"

.PHONY: logs
logs: check-project
	@echo -e "$(CYAN)$(BOLD)Streaming logs for service: $(SERVICE_NAME) in $(REGION)...$(RESET)"
	gcloud run services logs tail $(SERVICE_NAME) \
		--region=$(REGION) \
		--project=$(PROJECT_ID)

# ------------------------------------------------------------------------------
# Cleanup
# ------------------------------------------------------------------------------
.PHONY: clean
clean:
	@echo -e "$(CYAN)Cleaning build artifacts, caches, and temporary files...$(RESET)"
	rm -rf .next
	rm -rf out
	rm -rf $(TF_DIR)/.terraform
	rm -rf $(TF_DIR)/.terraform.lock.hcl
	rm -rf $(TF_DIR)/*.tfstate*
	rm -rf $(TF_DIR)/crash.log
	@echo -e "$(GREEN)$(BOLD)✓ Clean complete.$(RESET)"
