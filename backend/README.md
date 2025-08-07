# 🏥 API de Gestion de Présence Médicale

API RESTful sécurisée pour la gestion des rendez-vous et du suivi de présence du personnel médical. Cette API permet de gérer l'ensemble du processus de prise de rendez-vous, du suivi des présences jusqu'à la facturation.

## ✨ Fonctionnalités principales

- **Authentification sécurisée** avec JWT et refresh tokens
- **Gestion des rôles** (patients, médecins, secrétaires, administrateurs)
- **Prise de rendez-vous en ligne** avec vérification des disponibilités
- **Gestion des présences** avec suivi des retards et durées de consultation
- **Tableau de bord** avec statistiques et indicateurs clés
- **Notifications** par email et in-app
- **API documentée** avec OpenAPI/Swagger
- **Sécurité renforcée** avec protection contre les attaques courantes (XSS, injection NoSQL, etc.)

## 🚀 Démarrage rapide

### Prérequis

- Node.js v16 ou supérieur
- MongoDB v5.0 ou supérieur
- npm v8 ou supérieur ou yarn

### Installation

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/votre-utilisateur/presence-management.git
   cd presence-management/backend
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   # ou
   yarn
   ```

3. **Configurer l'environnement** :
   ```bash
   cp .env.example .env
   # Éditer le fichier .env avec vos paramètres
   ```

4. **Démarrer le serveur** :
   ```bash
   # Mode développement avec rechargement automatique
   npm run dev
   
   # Mode production
   npm start
   
   # Mode développement avec débogage
   DEBUG=app:* npm run dev
   ```

5. **Accéder à l'API** :
   - API : http://localhost:5000/api
   - Documentation : http://localhost:5000/api-docs (si configuré)
   - Health check : http://localhost:5000/healthcheck

## 🔧 Configuration

Créez un fichier `.env` à la racine du projet en vous basant sur `.env.example` :

```env
# Configuration du serveur
NODE_ENV=development
PORT=5000

# Base de données
MONGODB_URI=mongodb://localhost:27017/presence-management
TEST_MONGODB_URI=mongodb://localhost:27017/presence-management-test

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Client
CLIENT_URL=http://localhost:3000

# Email (configuration pour Nodemailer)
SMTP_HOST=smtp.monserveur.com
SMTP_PORT=587
SMTP_EMAIL=contact@monsite.com
SMTP_PASSWORD=mon_mot_de_passe
EMAIL_FROM=Ne pas répondre <contact@monsite.com>

# Limite de taux (rate limiting)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100

# Sécurité
XSS_PROTECTION=true
NO_CACHE=true
STRICT_TRANSPORT_SECURITY=true
X_FRAME_OPTIONS=DENY
X_CONTENT_TYPE_OPTIONS=nosniff
CONTENT_SECURITY_POLICY=default-src 'self'
X_XSS_PROTECTION=1; mode=block
```

## 🏗 Structure du projet

```
src/
├── config/           # Configuration de l'application
├── controllers/      # Contrôleurs (logique métier)
│   ├── authController.js
│   ├── rendezVousController.js
│   └── ...
├── middleware/       # Middleware personnalisés
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── ...
├── models/           # Modèles Mongoose
│   ├── RendezVous.js
│   ├── Utilisateur.js
│   └── ...
├── routes/           # Définition des routes
│   ├── authRoutes.js
│   ├── rendezVousRoutes.js
│   └── ...
├── utils/            # Utilitaires et helpers
│   ├── logger.js
│   ├── sendEmail.js
│   └── ...
├── validators/       # Validation des données
├── server.js         # Point d'entrée
└── app.js            # Configuration d'Express
```

## 🔍 Points d'API principaux

### 🔐 Authentification

- `POST /api/auth/inscription` - Inscription d'un nouvel utilisateur
- `POST /api/auth/connexion` - Connexion et obtention du token JWT
- `GET /api/auth/profil` - Profil de l'utilisateur connecté
- `POST /api/auth/rafraichir-token` - Rafraîchir le token d'accès
- `POST /api/auth/mot-de-passe-oublie` - Demande de réinitialisation de mot de passe
- `PATCH /api/auth/reinitialiser-mot-de-passe/:token` - Réinitialiser le mot de passe

### 📅 Rendez-vous

- `GET /api/rendez-vous` - Lister les rendez-vous (avec filtres)
- `POST /api/rendez-vous` - Créer un nouveau rendez-vous
- `GET /api/rendez-vous/:id` - Détails d'un rendez-vous
- `PUT /api/rendez-vous/:id` - Mettre à jour un rendez-vous
- `DELETE /api/rendez-vous/:id` - Supprimer un rendez-vous (soft delete)
- `PUT /api/rendez-vous/:id/commencer` - Marquer un rendez-vous comme commencé
- `PUT /api/rendez-vous/:id/terminer` - Marquer un rendez-vous comme terminé
- `PUT /api/rendez-vous/:id/annuler` - Annuler un rendez-vous
- `PUT /api/rendez-vous/:id/reporter` - Reporter un rendez-vous

## 🛡 Sécurité

L'API intègre plusieurs couches de sécurité :

- Authentification par JWT avec refresh tokens
- Protection contre les attaques par force brute
- Protection contre les injections NoSQL
- Protection contre les attaques XSS
- Headers de sécurité HTTP
- Validation stricte des entrées
- Rate limiting
- Logging des activités sensibles

## 📊 Tests

Pour exécuter les tests :

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests avec couverture de code
npm run test:coverage

# Exécuter les tests en mode watch
npm run test:watch
```

## 🚀 Déploiement

### Préparation pour la production

1. Mettre à jour les variables d'environnement pour la production
2. Construire l'application : `npm run build`
3. Tester en environnement de pré-production

### Options de déploiement

- **Docker** : Un fichier `Dockerfile` est fourni pour un déploiement en conteneur
- **PM2** : Recommandé pour la gestion des processus en production
- **Nginx** : Configuration recommandée comme reverse proxy

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment procéder :

1. Fork le projet
2. Créez votre branche : `git checkout -b feature/ma-nouvelle-fonctionnalite`
3. Committez vos modifications : `git commit -m 'Ajouter une fonctionnalité'`
4. Poussez vers la branche : `git push origin feature/ma-nouvelle-fonctionnalite`
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.

### Rendez-vous

- `GET /api/rendez-vous` - Récupérer la liste des rendez-vous
- `POST /api/rendez-vous` - Créer un nouveau rendez-vous
- `GET /api/rendez-vous/:id` - Récupérer un rendez-vous par ID
- `PUT /api/rendez-vous/:id` - Mettre à jour un rendez-vous
- `DELETE /api/rendez-vous/:id` - Supprimer un rendez-vous
- `PUT /api/rendez-vous/:id/commencer` - Marquer un rendez-vous comme commencé
- `PUT /api/rendez-vous/:id/terminer` - Marquer un rendez-vous comme terminé

## Sécurité

- Authentification par JWT (JSON Web Tokens)
- Protection contre les attaques XSS
- Protection contre l'injection de requêtes NoSQL
- Limitation du taux de requêtes
- En-têtes de sécurité HTTP
- Nettoyage des données

## Tests

Pour exécuter les tests :

```bash
npm test
```

## Déploiement

### Préparation pour la production

1. Mettez à jour les variables d'environnement pour la production
2. Installez les dépendances de production uniquement :
   ```bash
   npm install --production
   ```
3. Construisez les assets si nécessaire
4. Démarrez le serveur :
   ```bash
   npm start
   ```

### Avec PM2 (recommandé pour la production)

```bash
# Installation globale de PM2
npm install -g pm2

# Démarrer l'application
pm2 start src/server.js --name "api-gestion-presence"

# Activer le démarrage automatique au redémarrage du serveur
pm2 startup
pm2 save

# Afficher les logs
pm2 logs
```

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Auteur

Votre Nom - [@votre-compte](https://github.com/votre-compte)

## Remerciements

- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
