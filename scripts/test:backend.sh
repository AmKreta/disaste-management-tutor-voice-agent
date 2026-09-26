#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
uv run --group dev pytest -q tests
