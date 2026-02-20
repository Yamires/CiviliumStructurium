# Outil d'aide au calcul en génie structurel - CIVILIUM_STRUCTURIUM
Ce projet propose une solution logicielle open-source pour automatiser le calcul des contraintes mécaniques et la sélection de profilés en acier selon la norme CSA S16. Il se distingue par l'utilisation d'un langage dédié (DSL) permettant de modifier la logique de calcul sans toucher au code source Python.

## Architecture du Système
L'application est conçue comme une Progressive Web App (PWA), permettant une installation locale tout en conservant la légèreté d'une interface web.

**Frontend** : Développé avec React et MUI, offrant une interface intuitive pour la saisie des paramètres (portée, charges tributaires, etc.).

**Backend** : Une API Flask gérant les calculs symboliques et le filtrage.

**Base de données** : PostgreSQL (sur Render) pour la persistance des projets, utilisateurs et historiques.

**Sécurité** : Authentification gérée par Auth0 avec jetons JWT.

## Moteur de Calcul (DSL Engine)
Le cœur du système (solver.py) utilise SymPy pour évaluer les équations définies dans des fichiers YAML.

Fonctionnement de solver.py :

  1- **Chargement** : Extraction des formules depuis templates.yaml et des constantes depuis config.yaml.

  2- **Analyse de dépendances** : Construction d'un graphe pour identifier l'ordre de calcul des variables.

  3- **Tri Topologique** : Détermination de la séquence optimale pour résoudre les équations sans erreurs de définition.

  4- **Évaluation** : Substitution des valeurs et résolution symbolique pour produire les résultats finaux.

## Installation et Configuration technique
Prérequis

- Python 3.9+

- Node.js & npm

- PostgreSQL

## Installation du Backend

- Naviguer vers le dossier /backend.

- Installer les dépendances : pip install -r requirements.txt.

- Configurer les variables d'environnement (.env) pour la base de données et Auth0.

- Lancer le serveur : python app.py.

## Installation du Frontend

- Naviguer vers le dossier /frontend.

- Installer les packages : npm install.

- Lancer l'application en mode développement : npm run dev.

## Tests

Pour valider le moteur de calcul et le filtrage :

- Exécuter pytest à la racine du backend.

- Le système inclut 15 tests automatisés couvrant les cycles de dépendances et la précision des résultats.

## Filtrage des Profilés

- Le module filtrage.py applique les résultats du moteur aux propriétés physiques des profilés (SST12):

- Moment résistant (Mr) : Calculé selon la classe du profilé.

- Effort tranchant (Vr) : Vérification de la capacité de cisaillement.

## Tri 

Les résultats sont triés par hauteur nominale et poids linéique pour suggérer l'option la plus économique.


# Licence et Restrictions
Code : Distribué à des fins éducatives.

**Données SST12 : Le fichier profils.csv est issu du CISC. Sa licence interdit toute diffusion publique ou usage commercial sans autorisation.** 

Ce projet a été réalisé par Yamir Alejandro Poldo Silva sous la supervision de Pascal Archambault (Université de Montréal).
