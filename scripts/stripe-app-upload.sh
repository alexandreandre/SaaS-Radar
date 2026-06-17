#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${ROOT}/.bin:${PATH}"
cd "${ROOT}/stripe-app"

if [[ ! -d node_modules ]]; then
  npm install
fi

stripe apps set distribution public
yes | stripe apps upload
