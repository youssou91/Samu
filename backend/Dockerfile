# Étape de construction
FROM node:16-alpine AS builder

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY yarn.lock ./

# Installer les dépendances
RUN yarn install --frozen-lockfile --network-timeout 1000000

# Copier les fichiers sources
COPY . .

# Construire l'application
RUN yarn build

# Supprimer les dépendances de développement
RUN rm -rf node_modules && \
    yarn install --production --frozen-lockfile --network-timeout 1000000

# Étape d'exécution
FROM node:16-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache tini

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de l'étape de construction
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env* ./ || true

# Exposer le port de l'application
EXPOSE 5000

# Utiliser tini comme point d'entrée pour gérer correctement les signaux
ENTRYPOINT ["/sbin/tini", "--"]

# Commande pour démarrer l'application
CMD ["node", "dist/server.js"]
