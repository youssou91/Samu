const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    console.log('Tentative de création d\'utilisateur:', req.body.email);
    
    const { prenom, nom, email, telephone, role = 'patient', actif = true, password, specialite = '', status = 'actif' } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Échec de la création: email déjà utilisé', email);
      return res.status(400).json({ 
        success: false,
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le nouvel utilisateur
    const user = new User({
      prenom,
      nom,
      email,
      telephone,
      role,
      actif,
      password: hashedPassword,
      specialite,
      status
    });
    
    await user.save();
    
    // Ne pas renvoyer le mot de passe dans la réponse
    const userResponse = user.toObject();
    delete userResponse.password;
    
    console.log('Utilisateur créé avec succès:', user.email);
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: userResponse
    });
    
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur:', err);
    res.status(400).json({ 
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Obtenir tous les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    console.log('Début de la récupération des utilisateurs');
    const users = await User.find().select('-password');
    console.log(`Nombre d'utilisateurs récupérés: ${users.length}`);
    
    // Formater la réponse pour inclure success: true
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    console.log('Tentative de mise à jour de l\'utilisateur:', req.params.id);
    
    const { 
      prenom, 
      nom, 
      email, 
      telephone, 
      role, 
      actif, 
      password, 
      specialite, 
      status 
    } = req.body;
    
    // Vérifier si l'utilisateur existe
    let user = await User.findById(req.params.id);
    if (!user) {
      console.log('Échec de la mise à jour: utilisateur non trouvé', req.params.id);
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        console.log('Échec de la mise à jour: email déjà utilisé', email);
        return res.status(400).json({ 
          success: false,
          message: 'Un autre utilisateur utilise déjà cet email' 
        });
      }
    }
    
    // Préparer les données de mise à jour
    const updateData = {};
    if (prenom !== undefined) updateData.prenom = prenom;
    if (nom !== undefined) updateData.nom = nom;
    if (email !== undefined) updateData.email = email;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (role !== undefined) updateData.role = role;
    if (actif !== undefined) updateData.actif = actif;
    if (specialite !== undefined) updateData.specialite = specialite;
    if (status !== undefined) updateData.status = status;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    
    // Mettre à jour l'utilisateur
    user = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // Ne pas renvoyer le mot de passe dans la réponse
    const userResponse = user.toObject();
    delete userResponse.password;
    
    console.log('Utilisateur mis à jour avec succès:', user.email);
    
    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: userResponse
    });
    
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
    res.status(400).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
