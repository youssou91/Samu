const Planning = require('../models/Planning');

// Créer un événement de planning
exports.createPlanning = async (req, res) => {
  try {
    const planning = new Planning(req.body);
    await planning.save();
    res.status(201).json(planning);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtenir tous les événements
exports.getPlannings = async (req, res) => {
  try {
    const plannings = await Planning.find();
    res.json(plannings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir un événement par ID
exports.getPlanningById = async (req, res) => {
  try {
    const planning = await Planning.findById(req.params.id);
    if (!planning) return res.status(404).json({ error: 'Événement non trouvé' });
    res.json(planning);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un événement
exports.updatePlanning = async (req, res) => {
  try {
    const planning = await Planning.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!planning) return res.status(404).json({ error: 'Événement non trouvé' });
    res.json(planning);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Supprimer un événement
exports.deletePlanning = async (req, res) => {
  try {
    const planning = await Planning.findByIdAndDelete(req.params.id);
    if (!planning) return res.status(404).json({ error: 'Événement non trouvé' });
    res.json({ message: 'Événement supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
