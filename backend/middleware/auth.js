// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  try {
    // Vérifier l'en-tête d'autorisation
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      console.error('Tentative d\'accès non autorisée: token manquant');
      return res.status(401).json({ 
        success: false,
        message: 'Accès refusé: authentification requise' 
      });
    }

    // Vérifier et décoder le token
    jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt', (err, decoded) => {
      if (err) {
        console.error('Erreur de vérification du token:', err.name);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false,
            message: 'Session expirée. Veuillez vous reconnecter.'
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            success: false,
            message: 'Token invalide. Veuillez vous reconnecter.'
          });
        }
        
        return res.status(401).json({ 
          success: false,
          message: 'Échec de l\'authentification.'
        });
      }
      
      // Ajouter les informations de l'utilisateur à la requête
      req.user = decoded;
      
      // Ajouter des en-têtes de débogage
      res.setHeader('X-Authenticated-User', decoded.email || 'inconnu');
      res.setHeader('X-User-Role', decoded.role || 'non défini');
      
      console.log('Utilisateur authentifié:', { 
        id: decoded.id, 
        email: decoded.email, 
        role: decoded.role 
      });
      
      next();
    });
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'authentification' 
    });
  }
};
