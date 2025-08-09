// middleware/roleAuth.js
module.exports = function roleAuth(roles = []) {
  // roles: tableau de rôles autorisés (ex: ['admin', 'medecin'])
  if (typeof roles === 'string') roles = [roles];
  
  return (req, res, next) => {
    try {
      // Vérifier si l'utilisateur est authentifié
      if (!req.user) {
        console.error('Accès refusé : utilisateur non authentifié');
        return res.status(401).json({ 
          success: false,
          message: 'Accès refusé : authentification requise' 
        });
      }

      // Vérifier si l'utilisateur a un rôle valide
      if (!req.user.role) {
        console.error('Accès refusé : rôle utilisateur manquant', { userId: req.user.id });
        return res.status(403).json({ 
          success: false,
          message: 'Accès refusé : rôle utilisateur non défini' 
        });
      }

      // Vérifier si le rôle de l'utilisateur est autorisé
      if (!roles.includes(req.user.role)) {
        console.warn('Accès refusé : rôle insuffisant', { 
          userId: req.user.id, 
          userRole: req.user.role, 
          requiredRoles: roles 
        });
        return res.status(403).json({ 
          success: false,
          message: 'Accès refusé : privilèges insuffisants' 
        });
      }

      // Si tout est bon, passer à la suite
      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des rôles:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la vérification des autorisations' 
      });
    }
  };
};
