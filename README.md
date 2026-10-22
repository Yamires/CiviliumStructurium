# Outil d'aide au calcul en génie structurel - CIVILIUM_STRUCTURIUM
Ce projet propose un outil éducatif pour calculer les efforts et présélectionner des profilés en acier. Un langage dédié (DSL) permet de modifier les calculs sans modifier le code Python.

## Architecture du Système
**Frontend** : React et MUI.

**Backend** : API Flask et moteur numérique Python.

**Base de données** : SQLite. Aucun compte ni service externe n'est nécessaire.

**Version légère** : Calculateur et éditeur dans le navigateur, sans serveur Python. Les projets et les sélections enregistrées sont disponibles dans la version locale.

## Installation locale
Prérequis : Python 3.10+, Node.js 20.19+ et npm. Les scripts bash fonctionnent sous macOS et Linux.

À la racine du projet :

```bash
./install.sh
./start.sh
```

Ouvrir http://127.0.0.1:5050. L'installation demande une connexion pour télécharger les dépendances. L'application fonctionne ensuite localement.

Le dossier `data/` contient la base SQLite, le CSV importé et les modifications aux calculs. Il est ignoré par Git. Une nouvelle installation conserve ces fichiers. Pour une sauvegarde, arrêter l'application et copier ce dossier.

`CIVILIUM_DATA_DIR` permet de choisir un autre dossier de données.

## Dataset CISC
Aucun dataset CISC ou AISC n'est distribué. L'utilisateur doit disposer de ses propres données et des droits nécessaires.

Dans **Dataset**, choisir un fichier `.xlsx`, puis la feuille contenant les données CISC. Vérifier l'aperçu et cliquer sur **Activer le dataset**. Le classeur est lu dans le navigateur et les lignes validées sont enregistrées localement sous forme de CSV avec séparateur `;`. Le classeur original n'est pas conservé par l'application.

Colonnes requises :

| Colonne | Valeur attendue |
| --- | --- |
| `Ds_m` | Désignation du profilé, par exemple `W310x60` |
| `D`, `W` | Hauteur et épaisseur d'âme, en mm |
| `Sx`, `Zx` | Modules de section, en E3 mm³ |
| `Ix` | Moment d'inertie, en E6 mm⁴ |

L'en-tête doit se trouver parmi les 50 premières lignes. Les désignations doivent être uniques et les propriétés requises positives. Les espaces et virgules décimales sont acceptés. Les propriétés manquantes doivent être corrigées avant l'import. Les colonnes supplémentaires sont conservées.

Limites : 25 Mo par classeur, 100000 lignes et 100 colonnes. Les classeurs AISC avec d'autres colonnes ou unités ne sont pas convertis automatiquement. Un import invalide conserve le dataset actif.

Sans dataset, le calculateur fonctionne, mais ne propose aucun profilé.

## Moteur de Calcul et Éditeur
Dans **Méthodes**, créer, dupliquer, modifier ou supprimer une méthode. Définir ses entrées, ses formules et les résultats à afficher. Les libellés peuvent inclure les unités.

Variables : lettres latines, chiffres et `_`, avec une lettre au début. Les noms sont sensibles aux majuscules. Une entrée, une constante et une formule ne peuvent pas partager le même nom.

Opérations disponibles : `+`, `-`, `*`, `/`, `**`, `Max`, `Min` et `Piecewise`. Les conditions acceptent `<`, `<=`, `>`, `>=`, `==`, `!=` et les opérateurs `&` et `|` entre conditions parenthésées.

Exemple :

```text
Piecewise((x**2, x < 0), (Max(x, 2), True))
```

Utiliser des nombres décimaux (notation scientifique acceptée), sans commentaires ni virgule finale. L’imbrication est limitée à 32 niveaux.

Le moteur trie les dépendances et refuse les cycles, les variables inconnues et les expressions non autorisées. Les calculs utilisent des nombres flottants. Une méthode contient au maximum 100 formules de 2048 caractères chacune.

Le bouton **Tester** permet d'évaluer une méthode avant de l'enregistrer. Les erreurs numériques, dont les divisions par zéro, sont aussi vérifiées à chaque calcul. La validation ne démontre pas la validité d'une formule pour tous les cas physiques.

Les modifications sont enregistrées dans `data/`. Les calculs déjà sauvegardés conservent leurs résultats après modification ou suppression d'une méthode.

## Calculs et Présélection
Les poutres simples proposées utilisent des charges verticales positives. Vérifier les unités et la géométrie : portée et largeur tributaire positives, `0 <= x <= l`, et `a + b + c = l` pour le chargement partiel.

Le calcul d'inertie uniforme tient compte des critères de flèche des charges vive et totale. La méthode de chargement partiel ne calcule pas encore l'inertie et ne propose donc pas de profilés.

La présélection exige les résultats `mf`, `vf` et `i`. Elle vérifie `Mr >= abs(mf)`, `Vr >= abs(vf)` et `Ix >= i`, puis trie par hauteur et poids linéique.

Le moment résistant utilise le module **élastique Sx**. Cette présélection préliminaire suppose des sections en I adaptées au modèle ; elle ne vérifie ni leur classe, ni le déversement, ni les autres états limites de la norme CSA S16. Les résultats ne constituent pas un dimensionnement certifié.

## Version navigateur

```bash
cd frontend
npm install
npm run build:demo
```

Publier le contenu de `frontend/dist-demo/` dans un dossier du site GitHub Pages. Les chemins sont relatifs, ce qui permet un déploiement dans un sous-dossier.

```html
<iframe
  src="/civilium/index.html"
  title="Calculateur Civilium Structurium"
  width="100%"
  height="900"
  style="border: 0"
></iframe>
```

La démo démarre avec des profilés entièrement fictifs. Les datasets importés restent en mémoire et disparaissent à la fermeture ou au rechargement de la page. Les méthodes et constantes sont sauvegardées dans le stockage local du navigateur. Les politiques du navigateur peuvent limiter ce stockage dans un iframe ; dans ce cas, ouvrir le lien directement.

Le navigateur doit prendre en charge les workers JavaScript et le stockage local.

## Licence et Restrictions
Code : licence MIT, voir `LICENSE`.

**Les datasets CISC et leurs exports ne sont pas inclus dans cette licence et ne doivent pas être publiés.** Les images conservent les droits de leurs auteurs.

Ce projet a été réalisé par Yamir Alejandro Poldo Silva sous la supervision de Pascal Archambault (Université de Montréal).
