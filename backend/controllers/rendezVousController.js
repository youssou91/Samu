const RendezVous = require('../models/RendezVous');

// Créer un rendez-vous
exports.createRendezVous = async (req, res) => {
  try {
    const rendezVous = new RendezVous(req.body);
    await rendezVous.save();
    res.status(201).json({ status: 'success', data: rendezVous });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Obtenir tous les rendez-vous
exports.getAllRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.find().populate('patient medecin');
    res.status(200).json({ status: 'success', results: rendezVous.length, data: rendezVous });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Obtenir un rendez-vous par ID
exports.getRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findById(req.params.id).populate('patient medecin');
    if (!rendezVous) {
      return res.status(404).json({ status: 'error', message: 'Rendez-vous non trouvé' });
    }
    res.status(200).json({ status: 'success', data: rendezVous });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Mettre à jour un rendez-vous
exports.updateRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient medecin');
    
    if (!rendezVous) {
      return res.status(404).json({ status: 'error', message: 'Rendez-vous non trouvé' });
    }
    
    res.status(200).json({ status: 'success', data: rendezVous });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

// Supprimer un rendez-vous
exports.deleteRendezVous = async (req, res) => {
  try {
    const rendezVous = await RendezVous.findByIdAndDelete(req.params.id);
    
    if (!rendezVous) {
      return res.status(404).json({ status: 'error', message: 'Rendez-vous non trouvé' });
    }
    
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Obtenir les rendez-vous d'un patient
exports.getRendezVousByPatient = async (req, res) => {
  try {
    const rendezVous = await RendezVous.find({ patient: req.params.patientId })
      .populate('patient medecin');
      
    res.status(200).json({ status: 'success', results: rendezVous.length, data: rendezVous });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Obtenir les rendez-vous d'un médecin
exports.getRendezVousByMedecin = async (req, res) => {
  try {
    const rendezVous = await RendezVous.find({ medecin: req.params.medecinId })
      .populate('patient medecin');
      
    res.status(200).json({ status: 'success', results: rendezVous.length, data: rendezVous });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
