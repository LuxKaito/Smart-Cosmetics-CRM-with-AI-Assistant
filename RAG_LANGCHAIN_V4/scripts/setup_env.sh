#!/usr/bin/env bash
set -euo pipefail

uv sync --dev
cp -n .env.example .env || true

echo "Environment initialized. Review .env before running docker compose."
