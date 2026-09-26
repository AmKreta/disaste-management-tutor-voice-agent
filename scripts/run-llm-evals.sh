#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"

RUN_LLM_EVALS=1 uv run --group dev pytest -q -m eval tests/evals
