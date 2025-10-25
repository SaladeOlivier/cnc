# Explorateur de Financements CNC

https://saladeolivier.github.io/cnc/

Un site web statique pour explorer, filtrer et analyser les décisions de financement du Centre National du Cinéma et de l'Image Animée (CNC), spécifiquement pour le programme "Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)".

C'était l'occasion de tester ce que vaut Claude Code

## Fonctionnalités

- **Parcourir les Commissions** : Visualiser toutes les réunions de commission avec dates, présidents et membres
- **Explorer les Projets** : Voir les projets financés avec détails comme le talent, le bénéficiaire et le montant
- **Suivre les Bénéficiaires** : Découvrir combien de fois les organisations ont reçu des financements
- **Filtrage Avancé** : Rechercher par année, type d'aide, nom ou mot-clé
- **Tableau de Bord Statistique** : Voir les données agrégées et les principaux bénéficiaires
- **Entièrement Statique** : Aucun backend requis - fonctionne entièrement dans le navigateur

## Structure du Projet

```
CNC/
├── index.html              # Fichier HTML principal
├── styles/
│   └── main.css           # Styles CSS
├── js/
│   └── app.js             # Logique de l'application frontend
├── data/
│   └── cnc-data.json      # Données scrapées (générées)
├── scripts/
│   └── scraper.js         # Scraper web pour récupérer les données CNC
├── package.json           # Dépendances Node.js
└── README.md             # Ce fichier
```

## Installation

### 1. Installer les Dépendances

```bash
npm install
```

### 2. Scraper les Données

Le scraper supporte plusieurs modes pour récupérer les données du site du CNC :

#### Par défaut : Scraper uniquement CNC Talent

```bash
npm run scrape
```

Cela scrapera uniquement l'aide "Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)".

#### Mode test : Limiter aux N premières commissions

```bash
npm run scrape:test                    # Test rapide : seulement 2 commissions
node scripts/scraper.js --limit 5      # Limiter à 5 commissions
```

Parfait pour tester sans attendre que toutes les commissions soient scrapées !

#### Lister toutes les aides disponibles

```bash
npm run list-aids
```

Cela affichera tous les types d'aides disponibles et les sauvegardera dans `data/available-aids.json`.

#### Scraper une aide spécifique

Note : Le site du CNC est un foulli avec aucune page qui ne se ressemble, je ne pense pas que j'implémenterai d'autres formes de scrapping.

```bash
npm run scrape:aid "Aide après réalisation aux films de court métrage"
```

Ou avec la commande complète :

```bash
node scripts/scraper.js --aid "Nom de votre aide ici"
```

Avec limite pour les tests :

```bash
node scripts/scraper.js --aid "Aide après réalisation aux films de court métrage" --limit 3
```

#### Scraper plusieurs aides spécifiques

```bash
node scripts/scraper.js --aids "Aide 1,Aide 2,Aide 3"
node scripts/scraper.js --aids "Aide 1,Aide 2" --limit 2   # Avec limite
```

#### Scraper TOUTES les aides disponibles (ATTENTION : Cela prendra beaucoup de temps !)

```bash
npm run scrape:all
node scripts/scraper.js --all --limit 1   # Mode test : 1 commission par aide
```

**Ce que fait le scraper :**
- Récupère toutes les pages de commission avec support de la pagination
- Parse les détails des commissions (date, président, membres)
- Extrait tous les projets financés avec bénéficiaires et montants
- Sauvegarde tout dans `data/cnc-data.json`
- Crée des fichiers sources par aide dans `data/sources/` pour référence

**Note** : Le scraper inclut une limitation du débit (1 seconde entre les requêtes de commission, 2 secondes entre les types d'aide) pour être respectueux des serveurs du CNC.

#### Mises à Jour Partielles (Mettre à jour uniquement des aides spécifiques)

Le scraper supporte maintenant les **mises à jour partielles**, permettant de mettre à jour uniquement des aides spécifiques sans tout re-scraper :

```bash
# Mettre à jour uniquement CNC Talent (conserve toutes les autres données d'aide intactes)
node scripts/scraper.js --aid "Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)"

# Mettre à jour plusieurs aides spécifiques
node scripts/scraper.js --aids "Aide 1,Aide 2"
```

**Comment fonctionnent les mises à jour partielles :**
1. Le scraper charge les données existantes depuis `data/cnc-data.json`
2. Il préserve tous les bénéficiaires et talents (pour la déduplication)
3. Il conserve les commissions et projets des AUTRES aides
4. Il scrape des données fraîches pour la/les aide(s) spécifiée(s)
5. Il fusionne tout ensemble et sauvegarde :
   - Fichier principal : `data/cnc-data.json` (données fusionnées)
   - Fichiers sources : `data/sources/[nom-aide].json` (données par aide)

**Avantages :**
- **Mises à jour plus rapides** : Scraper uniquement ce qui a changé
- **Aucune perte de données** : Les données d'aide existantes sont préservées
- **Pas de conflits d'ID** : Les ID continuent là où ils s'étaient arrêtés
- **Pas de doublons** : Les bénéficiaires et talents sont dédupliqués entre toutes les aides

**Exemple de workflow :**
```bash
# Scrape complet initial
node scripts/scraper.js --all

# Plus tard, mettre à jour uniquement CNC Talent (préserve toutes les 94 autres aides)
node scripts/scraper.js --aid "Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)"

# Les données finales contiennent toutes les 95 aides, mais seul CNC Talent a été re-scrapé
```

### 3. Lancer le Site Localement

```bash
npm run dev
```

Puis ouvrez votre navigateur sur `http://localhost:8000`

## Déploiement sur GitHub Pages

### Option 1 : Déploiement Manuel

1. Créer un nouveau dépôt sur GitHub
2. Initialiser git et pousser votre code :

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/VOTRE_DEPOT.git
git push -u origin main
```

3. Activer GitHub Pages :
   - Aller dans les paramètres de votre dépôt
   - Naviguer vers la section "Pages"
   - Sélectionner la branche "main" comme source
   - Sauvegarder

Votre site sera disponible sur : `https://VOTRE_NOM_UTILISATEUR.github.io/VOTRE_DEPOT/`

### Option 2 : Automatisé avec GitHub Actions

Créer `.github/workflows/scrape.yml` :

```yaml
name: Mise à jour des données CNC

on:
  schedule:
    - cron: '0 0 * * 0'  # Exécution hebdomadaire le dimanche à minuit
  workflow_dispatch:      # Permettre le déclenchement manuel

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run scrape
      - name: Commit et push si changé
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/cnc-data.json
          git diff --quiet && git diff --staged --quiet || (git commit -m "Mise à jour des données CNC" && git push)
```

## Structure des Données

Les données utilisent une **structure normalisée** avec des relations basées sur les ID et des **ID déterministes** qui restent stables entre les exécutions du scraper.

### Système d'ID Déterministes

Pour éviter les liens morts sur le frontend, les ID sont générés de manière déterministe basée sur le contenu :

- **Commissions** : `com_<aide-slug>_<date>`
  - Exemple : `com_fonds-daide-aux-createurs-video-sur-internet-cnc-talent_2025-07-03`

- **Projets** : `pro_<aide-slug>_<nom-projet-slug>_<date>`
  - Exemple : `pro_cnc-talent_a-musee-vous-a-musee-moi_2025-07-03`
  - Date incluse pour gérer les cas où le même nom de projet apparaît dans différentes commissions

- **Bénéficiaires** : `ben_<nom-slug>`
  - Exemple : `ben_dada-media`

- **Talents** : `tal_<nom-slug>`
  - Exemple : `tal_fouzia-kechkech`

Cela signifie :
- ✅ Mêmes données = même ID (URLs stables)
- ✅ Pas de conflits d'ID entre les aides
- ✅ Les mises à jour partielles préservent les ID
- ✅ Les liens du frontend ne cassent jamais

### Commission

```json
{
  "id": "com_cnc-talent_2025-07-03",
  "url": "https://www.cnc.fr/...",
  "date": "2025-07-03",
  "aidName": "Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)",
  "presidentId": "tal_benjamin-bonnet",
  "memberIds": ["tal_marie-camille-soyer", "tal_victor-habchy", ...],
  "projectIds": ["pro_cnc-talent_a-musee-vous_2025-07-03", ...]
}
```

### Projet

```json
{
  "id": "pro_cnc-talent_a-musee-vous_2025-07-03",
  "name": "A MUSEE VOUS, A MUSEE MOI",
  "description": "Série – Documentaire - Arts / Histoire de l'Art",
  "beneficiaryId": "ben_dada-media",
  "talentIds": ["tal_fouzia-kechkech"],
  "amount": 30000,
  "category": "À LA CRÉATION",
  "commissionId": "com_cnc-talent_2025-07-03"
}
```

### Bénéficiaire

```json
{
  "id": "ben_dada-media",
  "slug": "dada-media",
  "name": "DADA MEDIA",
  "projectIds": ["pro_cnc-talent_a-musee-vous_2025-07-03", ...],
  "commissionIds": ["com_cnc-talent_2025-07-03", ...]
}
```

### Talent

```json
{
  "id": "tal_fouzia-kechkech",
  "slug": "fouzia-kechkech",
  "name": "Fouzia KECHKECH",
  "projectIds": ["pro_cnc-talent_a-musee-vous_2025-07-03", ...],
  "commissionIds": ["com_cnc-talent_2025-07-03", ...]
}
```

## Utilisation

### Recherche et Filtrage

- **Barre de Recherche** : Tapez n'importe quel mot-clé pour rechercher dans tous les champs
- **Filtre Année** : Sélectionnez une année spécifique pour voir les commissions de cette période
- **Filtre Aide** : Filtrer par type d'aide (actuellement uniquement CNC Talent)
- **Tri** : Choisissez comment ordonner les résultats (par date, montant ou nom)

### Vues

- **Commissions** : Parcourir toutes les réunions de commission chronologiquement
- **Projets** : Voir tous les projets financés avec détails
- **Bénéficiaires** : Voir toutes les organisations qui ont reçu des financements
- **Statistiques** : Vue agrégée avec totaux et principaux bénéficiaires

### Analyser les Données

Cliquez sur n'importe quelle carte pour voir les informations détaillées dans une modale :
- Les détails de commission montrent tous les projets financés dans cette session
- Les détails de projet montrent les informations complètes sur le financement
- Les détails de bénéficiaire montrent tous leurs projets financés et apparitions en commission

## Personnalisation

### Scraper d'Autres Types d'Aide

Éditez `scripts/scraper.js` et modifiez la variable `targetAid` :

```javascript
const targetAid = "Nom de Votre Programme d'Aide Ici";
```

### Styles

Personnalisez les couleurs et l'apparence dans `styles/main.css` :

```css
:root {
  --primary-color: #0047ab;     /* Couleur de marque principale */
  --secondary-color: #ff6b6b;   /* Couleur d'accent */
  --background: #f8f9fa;        /* Arrière-plan de page */
  /* ... */
}
```

## Détails Techniques

- **Frontend** : JavaScript Vanilla (ES6+), aucune dépendance de framework
- **Scraper** : Node.js avec Cheerio pour le parsing HTML
- **Format de Données** : JSON pour un requêtage facile dans le navigateur
- **Déploiement** : Fichiers statiques compatibles avec n'importe quel serveur web ou GitHub Pages

## Licence

MIT

## Remerciements

Source des données : [Centre National du Cinéma et de l'Image Animée (CNC)](https://www.cnc.fr)
