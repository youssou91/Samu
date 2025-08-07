module.exports = {
  apps: [
    {
      name: 'presence-management-api',
      script: 'dist/server.js',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        NODE_OPTIONS: '--max-http-header-size=16384',
      },
      env_production: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-http-header-size=16384',
        PORT: 5000,
      },
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true,
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'votre-serveur.com',
      ref: 'origin/main',
      repo: 'git@github.com:votre-utilisateur/presence-management.git',
      path: '/var/www/presence-management',
      'post-deploy':
        'npm install --production && \
         npm run build && \
         pm2 reload ecosystem.config.js --env production && \
         pm2 save',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};

// Pour déployer en production :
// 1. Configurer l'accès SSH au serveur
// 2. Initialiser le déploiement : pm2 deploy ecosystem.config.js production setup
// 3. Déployer : pm2 deploy ecosystem.config.js production
