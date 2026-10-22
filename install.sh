#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
for command in python3 node npm; do
    command -v "$command" >/dev/null || { echo "Prérequis manquant : $command"; exit 1; }
done
python3 -c 'import sys; assert sys.version_info >= (3, 10), "Python 3.10+ requis"'
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm --prefix frontend install
npm --prefix frontend run build
.venv/bin/python backend/db.py
echo 'Installation terminée. Lancez ./start.sh puis ouvrez http://127.0.0.1:5050'
