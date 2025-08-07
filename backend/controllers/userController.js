const User = require('../models/User');

// Créer un utilisateur
exports.createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ status: 'success', data: user });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ status: 'success', results: users.length, data: users });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Obtenir un utilisateur par ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Utilisateur non trouvé' });
    }
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
