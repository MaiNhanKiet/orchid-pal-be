#!/usr/bin/env bash
# Build + push 3 OrchidPal images lên Docker Hub.
#
# Usage:
#   ./scripts/docker-hub-release.sh
#   DOCKER_USERNAME=myuser IMAGE_TAG=v1.0.0 ./scripts/docker-hub-release.sh
#   ./scripts/docker-hub-release.sh --push-only   # chỉ push (đã build sẵn)
#   ./scripts/docker-hub-release.sh --build-only  # chỉ build
#
# Yêu cầu: đã `docker login` Docker Hub.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DOCKER_USERNAME="${DOCKER_USERNAME:-kietmn}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
MODE="${1:-all}" # all | --push-only | --build-only

APPS=(api-gateway identity-service plant-service)

echo "==> DOCKER_USERNAME=${DOCKER_USERNAME}"
echo "==> IMAGE_TAG=${IMAGE_TAG}"
echo "==> MODE=${MODE}"
echo

build_one() {
  local app="$1"
  local image="${DOCKER_USERNAME}/orchidpal-${app}:${IMAGE_TAG}"
  echo "---- build ${image}"
  docker build \
    --build-arg "APP_NAME=${app}" \
    -t "${image}" \
    -t "${DOCKER_USERNAME}/orchidpal-${app}:latest" \
    .
}

push_one() {
  local app="$1"
  local image="${DOCKER_USERNAME}/orchidpal-${app}:${IMAGE_TAG}"
  echo "---- push ${image}"
  docker push "${image}"
  if [[ "${IMAGE_TAG}" != "latest" ]]; then
    docker push "${DOCKER_USERNAME}/orchidpal-${app}:latest"
  fi
}

case "${MODE}" in
  --push-only)
    for app in "${APPS[@]}"; do push_one "${app}"; done
    ;;
  --build-only)
    for app in "${APPS[@]}"; do build_one "${app}"; done
    ;;
  all|"")
    for app in "${APPS[@]}"; do
      build_one "${app}"
      push_one "${app}"
    done
    ;;
  *)
    echo "Unknown option: ${MODE}" >&2
    echo "Usage: $0 [--push-only|--build-only]" >&2
    exit 1
    ;;
esac

echo
echo "==> Done. Images:"
for app in "${APPS[@]}"; do
  echo "  - ${DOCKER_USERNAME}/orchidpal-${app}:${IMAGE_TAG}"
done
echo
echo "Arcane .env cần:"
echo "  DOCKER_USERNAME=${DOCKER_USERNAME}"
echo "  IMAGE_TAG=${IMAGE_TAG}"
echo "  (compose: pull_policy always)"
