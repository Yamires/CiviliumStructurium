#!/usr/bin/env bash
# Prépare une copie assainie. Ne modifie ni les branches locales ni le dépôt distant.
set -euo pipefail
cd "$(dirname "$0")/.."
source_repo="$(pwd)"
release_dir="$source_repo/private-release/public"
command -v git-filter-repo >/dev/null || { echo 'Installez git-filter-repo avant de préparer la copie publique.'; exit 1; }
[[ "$(git branch --show-current)" == 'feature/local-open-source' ]] || { echo 'Utilisez la branche feature/local-open-source.'; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'Enregistrez les changements avant de préparer la copie publique.'; exit 1; }
[[ ! -e "$release_dir" ]] || { echo 'La copie private-release/public existe déjà. Conservez-la ou déplacez-la avant de recommencer.'; exit 1; }
git clone --no-local --single-branch --branch feature/local-open-source "$source_repo" "$release_dir"
cd "$release_dir"
git filter-repo --force --invert-paths \
    --path-glob '*.xlsx' --path-glob '*.csv' --path-glob '*.pdf' \
    --path-glob '*.pyc' --path-glob '*.pyo' \
    --path .env --path-glob '*/.env' --path-glob '.env.*' --path-glob '*/.env.*' \
    --path .DS_Store --path-glob '*/.DS_Store' \
    --path .venv/ --path venv/ --path node_modules/ \
    --path-glob '*/.venv/*' --path-glob '*/venv/*' --path-glob '*/node_modules/*'
git branch -m main
python3 "$source_repo/scripts/check-public.py" "$release_dir"
echo "Copie préparée : $release_dir"
echo 'Aucun dépôt distant configuré. Vérifiez les résultats avant de publier cette copie uniquement.'
