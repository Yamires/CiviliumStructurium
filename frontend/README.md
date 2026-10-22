# Interface Civilium Structurium
React et MUI. Voir le README à la racine pour l'installation, le dataset et les calculs.

- `npm run dev` : interface locale avec API sur le port 5050.
- `npm run dev:demo` : calculateur dans le navigateur.
- `npm run build` : version locale dans `dist/`.
- `npm run build:demo` : version statique dans `dist-demo/`.
- `npm test` : tests du moteur JavaScript et du filtrage.
- `npm run lint` : vérification du code.
- `npm run test:e2e` : parcours navigateur sur les deux builds (Chromium requis).

Le script `../scripts/verify.sh`, lancé depuis la racine, exécute tous les contrôles dans l'ordre. Les tests navigateur utilisent une base et un dataset fictif isolés.
