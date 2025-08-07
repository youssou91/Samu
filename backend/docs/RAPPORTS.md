# Module de Rapports et Statistiques

Ce module fournit des fonctionnalités avancées de génération de rapports et d'analyse des données pour le système de gestion des présences médicales.

## Table des matières

1. [Aperçu](#aperçu)
2. [Points de terminaison](#points-de-terminaison)
   - [Performance des médecins](#performance-des-médecins)
   - [Satisfaction des patients](#satisfaction-des-patients)
   - [Rapport personnalisé](#rapport-personnalisé)
   - [Exportation de rapports](#exportation-de-rapports)
3. [Paramètres de requête](#paramètres-de-requête)
4. [Exemples d'utilisation](#exemples-dutilisation)
5. [Codes de statut](#codes-de-statut)
6. [Gestion des erreurs](#gestion-des-erreurs)

## Aperçu

Le module de rapports permet d'analyser les données du système sous différents angles :

- **Performance des médecins** : Évalue l'efficacité et la ponctualité des médecins
- **Satisfaction des patients** : Analyse les retours des patients sur les consultations
- **Rapports personnalisés** : Génère des analyses sur mesure selon des critères spécifiques
- **Exportation** : Permet d'exporter les données dans différents formats (CSV, Excel, JSON)

## Points de terminaison

### Performance des médecins

`GET /api/rapports/performance-medecins`

Récupère les statistiques de performance des médecins sur une période donnée.

**Paramètres de requête :**
- `dateDebut` (optionnel) : Date de début au format YYYY-MM-DD (par défaut : il y a 3 mois)
- `dateFin` (optionnel) : Date de fin au format YYYY-MM-DD (par défaut : aujourd'hui)

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Statistiques de performance des médecins récupérées avec succès",
  "donnees": {
    "dateDebut": "2025-05-06T00:00:00.000Z",
    "dateFin": "2025-08-06T00:00:00.000Z",
    "resultats": [
      {
        "medecin": {
          "id": "60d0fe4f5311236168a109ca",
          "nom": "Dupont",
          "prenom": "Jean",
          "specialite": "Cardiologie"
        },
        "statistiques": {
          "totalRdv": 42,
          "rdvTermines": 38,
          "rdvConfirmes": 2,
          "rdvAnnules": 2,
          "nombrePatientsUniques": 35,
          "dureeTotaleMinutes": 2850,
          "dureeMoyenneMinutes": 71.3,
          "retards": {
            "total": 5,
            "dureeMoyenneMinutes": 12.4,
            "pourcentage": 13.2
          },
          "tauxFrequentation": 95.2
        }
      }
    ]
  }
}
```

### Satisfaction des patients

`GET /api/rapports/satisfaction`

Récupère les statistiques de satisfaction des patients.

**Paramètres de requête :**
- `dateDebut` (optionnel) : Date de début au format YYYY-MM-DD (par défaut : il y a 6 mois)
- `dateFin` (optionnel) : Date de fin au format YYYY-MM-DD (par défaut : aujourd'hui)
- `medecinId` (optionnel) : ID du médecin pour filtrer les résultats

**Exemple de réponse :**
```json
{
  "success": true,
  "message": "Statistiques de satisfaction des patients récupérées avec succès",
  "donnees": {
    "dateDebut": "2025-02-06T00:00:00.000Z",
    "dateFin": "2025-08-06T00:00:00.000Z",
    "resultats": [
      {
        "medecin": {
          "id": "60d0fe4f5311236168a109ca",
          "nom": "Dupont",
          "prenom": "Jean"
        },
        "statistiques": {
          "totalAvis": 28,
          "noteMoyenne": 4.6,
          "repartitionNotes": [
            {
              "note": 5,
              "count": 20,
              "pourcentage": 71.4
            },
            {
              "note": 4,
              "count": 6,
              "pourcentage": 21.4
            },
            {
              "note": 3,
              "count": 2,
              "pourcentage": 7.1
            },
            {
              "note": 2,
              "count": 0,
              "pourcentage": 0
            },
            {
              "note": 1,
              "count": 0,
              "pourcentage": 0
            }
          ],
          "commentaires": [
            "Très bon accueil et professionnalisme",
            "Médecin à l'écoute et compétent"
          ]
        }
      }
    ]
  }
}
```

### Rapport personnalisé

`POST /api/rapports/personnalise`

Génère un rapport personnalisé selon les critères spécifiés.

**Corps de la requête :**
```json
{
  "typeRapport": "rendez-vous",
  "dateDebut": "2025-01-01",
  "dateFin": "2025-12-31",
  "groupBy": "month",
  "filtres": {
    "statut": "termine"
  },
  "colonnes": ["nbRendezVous", "dureeMoyenne", "tauxRetard"]
}
```

**Paramètres :**
- `typeRapport` (obligatoire) : Type de rapport (`rendez-vous`, `patients`, `medecins`, `financier`, `satisfaction`, `performance`)
- `dateDebut` (optionnel) : Date de début au format YYYY-MM-DD
- `dateFin` (optionnel) : Date de fin au format YYYY-MM-DD
- `groupBy` (optionnel) : Regroupement des résultats (`day`, `week`, `month`, `year`, `medecin`, `patient`, `type`)
- `filtres` (optionnel) : Filtres à appliquer
- `colonnes` (optionnel) : Colonnes à inclure dans le résultat

### Exportation de rapports

`POST /api/rapports/export`

Exporte un rapport dans le format spécifié (CSV, Excel, JSON).

**Corps de la requête :**
```json
{
  "format": "excel",
  "typeRapport": "rendez-vous",
  "dateDebut": "2025-01-01",
  "dateFin": "2025-12-31"
}
```

**Paramètres :**
- `format` (optionnel) : Format d'export (`csv`, `excel`, `json`)
- Autres paramètres identiques à la génération de rapport personnalisé

## Paramètres de requête

### Filtres disponibles

Les filtres suivants peuvent être utilisés dans les requêtes de rapport :

- `statut` : Filtre par statut de rendez-vous (`planifie`, `confirme`, `en_cours`, `termine`, `annule`)
- `type` : Type de rendez-vous
- `medecin` : ID du médecin
- `patient` : ID du patient
- `specialite` : Spécialité médicale
- `retard` : Filtre les rendez-vous en retard (`true`/`false`)
- `statutPaiement` : Statut de paiement (`paye`, `en_attente`, `annule`)

### Options de regroupement

- `day` : Grouper par jour
- `week` : Grouper par semaine
- `month` : Grouper par mois (par défaut)
- `year` : Grouper par année
- `medecin` : Grouper par médecin
- `patient` : Grouper par patient
- `type` : Grouper par type de rendez-vous

## Exemples d'utilisation

### Exemple 1 : Obtenir les statistiques mensuelles des rendez-vous

**Requête :**
```http
GET /api/rapports/personnalise
Content-Type: application/json

{
  "typeRapport": "rendez-vous",
  "dateDebut": "2025-01-01",
  "dateFin": "2025-12-31",
  "groupBy": "month",
  "colonnes": ["periode", "nbRendezVous", "dureeMoyenne"]
}
```

### Exemple 2 : Exporter les statistiques des médecins en Excel

**Requête :**
```http
POST /api/rapports/export
Content-Type: application/json

{
  "format": "excel",
  "typeRapport": "medecins",
  "dateDebut": "2025-01-01",
  "dateFin": "2025-12-31",
  "colonnes": ["medecin.nom", "medecin.prenom", "totalRdv", "tauxFrequentation"]
}
```

## Codes de statut

- `200 OK` : Requête réussie
- `400 Bad Request` : Données de requête invalides
- `401 Unauthorized` : Authentification requise
- `403 Forbidden` : Droits insuffisants
- `500 Internal Server Error` : Erreur serveur

## Gestion des erreurs

En cas d'erreur, la réponse contiendra un objet avec les propriétés suivantes :

- `success` : `false`
- `message` : Description de l'erreur
- `erreurs` : Tableau d'erreurs détaillées (optionnel)
- `stack` : Pile d'appels (en environnement de développement uniquement)

**Exemple d'erreur :**
```json
{
  "success": false,
  "message": "Validation des données échouée",
  "erreurs": [
    {
      "champ": "dateDebut",
      "message": "Format de date invalide (utilisez YYYY-MM-DD)"
    }
  ]
}
```
## Sécurité

Tous les points de terminaison de l'API de rapports nécessitent une authentification et des droits d'administrateur. Assurez-vous d'inclure un jeton JWT valide dans l'en-tête `Authorization` de vos requêtes.

```
Authorization: Bearer votre-jeton-ici
```

## Performance

Pour les jeux de données volumineux, il est recommandé de :
1. Limiter la plage de dates
2. Utiliser le paramètre `groupBy` pour agréger les données
3. Ne demander que les colonnes nécessaires avec le paramètre `colonnes`
4. Utiliser l'exportation asynchrone pour les rapports volumineux

## Développement

### Tests

Pour exécuter les tests unitaires des rapports :

```bash
npm test test/rapports.test.js
```

### Journalisation

Les activités de génération de rapports sont enregistrées dans les journaux d'application avec le niveau `info` ou `error`.
