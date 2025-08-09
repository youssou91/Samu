# Presence Management Backend

Backend Express + MongoDB pour la gestion des présences.

## Installation

1. Installe les dépendances :
   ```bash
   npm install
   ```
2. Copie `.env.example` en `.env` et adapte les valeurs si besoin.
3. Lance le serveur :
   ```bash
   npm run dev
   ```

## Endpoints principaux

- `POST   /api/users`      : Créer un utilisateur
- `GET    /api/users`      : Lister tous les utilisateurs
- `GET    /api/users/:id`  : Obtenir un utilisateur par ID
- `PUT    /api/users/:id`  : Modifier un utilisateur
- `DELETE /api/users/:id`  : Supprimer un utilisateur

## Modèle User (Mongoose)
- prenom, nom, email, telephone, role, actif, password, specialite, status

---
Niveau débutant, code simple et commenté. Pour toute question ou ajout de fonctionnalité, demande-moi !
