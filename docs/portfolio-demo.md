# Intégrer la démo au portfolio
Le patch `portfolio-demo.patch` correspond au portfolio Astro situé dans `myWebsite`. Il ajoute un iframe dans la page du projet, une URL de démo dans le contenu et l'autorisation des iframes du même site dans la CSP. Les chemins utilisent le helper du portfolio et respectent son éventuel sous-dossier GitHub Pages.

1. Installer les dépendances, générer et enregistrer le lockfile npm, puis exécuter `./scripts/verify.sh` dans Civilium Structurium. Les tests nécessitent Chromium (`cd frontend && npx playwright install chromium`).
2. Dans le dépôt du portfolio, créer une branche dédiée et appliquer le patch :

```bash
git switch -c feature/civilium-demo
git apply --check /chemin/vers/CiviliumStructurium/docs/portfolio-demo.patch
git apply /chemin/vers/CiviliumStructurium/docs/portfolio-demo.patch
```

3. Copier le contenu de `CiviliumStructurium/frontend/dist-demo/` dans `myWebsite/public/civilium/`. Ce dossier reçoit uniquement le build statique ; aucun classeur, CSV ou fichier de `data/`.
4. Vérifier l'import, le calcul et l'édition des règles dans la démo. Le projet reste en brouillon (`draft: true`) tant que la vérification n'est pas terminée. Passer à `draft: false` pour inclure sa page dans le site.
5. Dans le portfolio, exécuter `npm run check`, `npm test` et `npm run build`. Vérifier aussi un build avec `BASE_PATH=/portfolio-test/` : l'iframe doit pointer vers `/portfolio-test/civilium/index.html`.
6. Utiliser ensuite le workflow de déploiement manuel déjà présent dans le portfolio. Vérifier le lien et l'iframe sur l'URL publique avant de considérer le déploiement terminé.

Pour revenir en arrière, annuler le commit d'intégration et relancer le workflow du portfolio. L'ancienne application Render et ses données ne sont pas concernées.
