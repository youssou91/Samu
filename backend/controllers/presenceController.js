const Presence = require('../models/Presence');

// Créer une présence
exports.createPresence = async (req, res) => {
  try {
    const presence = new Presence(req.body);
    await presence.save();
    res.status(201).json(presence);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtenir toutes les présences
exports.getPresences = async (req, res) => {
  try {
    const presences = await Presence.find();
    res.json(presences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir une présence par ID
exports.getPresenceById = async (req, res) => {
  try {
    const presence = await Presence.findById(req.params.id);
    if (!presence) return res.status(404).json({ error: 'Présence non trouvée' });
    res.json(presence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour une présence
exports.updatePresence = async (req, res) => {
  try {
    const presence = await Presence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!presence) return res.status(404).json({ error: 'Présence non trouvée' });
    res.json(presence);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Supprimer une présence
exports.deletePresence = async (req, res) => {
  try {
    const presence = await Presence.findByIdAndDelete(req.params.id);
    if (!presence) return res.status(404).json({ error: 'Présence non trouvée' });
    res.json({ message: 'Présence supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
