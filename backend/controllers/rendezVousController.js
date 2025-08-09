const RendezVous = require('../models/RendezVous');

// Créer un rendez-vous
exports.createRendezVous = async (req, res) => {
  try {
    const rendezVous = new RendezVous(req.body);
    await rendezVous.save();
    res.status(201).json(rendezVous);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtenir tous les rendez-vous
exports.getRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.find();
    res.json(rendezVous);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir un rendez-vous par ID
exports.getRendezVousById = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findById(req.params.id);
    if (!rendezVous) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    res.json(rendezVous);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un rendez-vous
exports.updateRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rendezVous) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    res.json(rendezVous);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Supprimer un rendez-vous
exports.deleteRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findByIdAndDelete(req.params.id);
    if (!rendezVous) return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    res.json({ message: 'Rendez-vous supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
