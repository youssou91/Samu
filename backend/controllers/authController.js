const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Connexion utilisateur
exports.login = async (req, res) => {
  try {
    console.log('Tentative de connexion avec:', req.body.email);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Email ou mot de passe manquant');
      return res.status(400).json({ 
        success: false, 
        message: 'Veuillez fournir un email et un mot de passe' 
      });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('Utilisateur non trouvé:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Vérifier si le compte est actif
    if (!user.actif) {
      console.log('Compte désactivé:', email);
      return res.status(401).json({
        success: false,
        message: 'Ce compte a été désactivé. Veuillez contacter un administrateur.'
      });
    }
    
    // Vérifier le mot de passe
    console.log('Vérification du mot de passe pour:', email);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Mot de passe incorrect pour:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Créer et renvoyer un token JWT avec plus d'informations
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        prenom: user.prenom,
        nom: user.nom,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12 heures
      }, 
      process.env.JWT_SECRET || 'votre_secret_jwt',
      { 
        algorithm: 'HS256',
        expiresIn: '12h'
      }
    );
    
    // Ne pas renvoyer le mot de passe dans la réponse
    const userData = user.toObject();
    delete userData.password;
    
    console.log('Connexion réussie pour:', email, 'Rôle:', user.role);
    console.log('Token généré avec les informations:', {
      id: user._id,
      role: user.role,
      email: user.email
    });
    
    res.json({
      success: true,
      token,
      user: userData,
      expiresIn: 12 * 60 * 60 // 12 heures en secondes
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la connexion' 
    });
  }
};

// Déconnexion (gérée côté client en supprimant le token)
exports.logout = (req, res) => {
  res.json({ success: true, message: 'Déconnexion réussie' });
};
