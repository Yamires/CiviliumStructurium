#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -x .venv/bin/python || ! -f frontend/dist/index.html ]]; then
    echo 'Lancez ./install.sh avant de démarrer.'
    exit 1
fi
exec .venv/bin/python backend/app.py
