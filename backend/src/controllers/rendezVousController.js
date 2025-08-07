const RendezVous = require('../models/RendezVous');
const Utilisateur = require('../models/Utilisateur');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// Helper pour formater la réponse d'un rendez-vous
const formaterRendezVous = (rendezVous) => ({
  _id: rendezVous._id,
  patient: rendezVous.patient,
  patientNom: rendezVous.patientNom,
  patientTelephone: rendezVous.patientTelephone,
  medecin: rendezVous.medecin,
  medecinNom: rendezVous.medecinNom,
  dateDebut: rendezVous.dateDebut,
  dateFin: rendezVous.dateFin,
  type: rendezVous.type,
  statut: rendezVous.statut,
  motif: rendezVous.motif,
  notes: rendezVous.notes,
  presenceConfirmee: rendezVous.presenceConfirmee,
  heureArrivee: rendezVous.heureArrivee,
  creePar: rendezVous.creeBy,
  dateCreation: rendezVous.dateCreation
});

// Créer un nouveau rendez-vous
exports.creerRendezVous = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      succes: false,
      message: 'Erreur de validation',
      erreurs: errors.array().map(err => ({
        champ: err.param,
        message: err.msg
      }))
    });
  }

  const { 
    patientId, 
    patientNom, 
    patientTelephone, 
    dateDebut, 
    dateFin, 
    type, 
    motif, 
    notes 
  } = req.body;

  // Vérifier que le patient existe
  const patient = await Utilisateur.findById(patientId).select('prenom nom email telephone');
  if (!patient) {
    return res.status(404).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { champ: 'patientId', message: 'Patient non trouvé avec cet ID' }
      ]
    });
  }

  // Vérifier que le médecin existe
  const medecin = await Utilisateur.findOne({ 
    _id: req.body.medecinId,
    role: 'medecin',
    actif: true 
  }).select('prenom nom specialite');

  if (!medecin) {
    return res.status(404).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { champ: 'medecinId', message: 'Médecin non trouvé ou inactif' }
      ]
    });
  }

  // Vérifier la disponibilité du créneau
  const estDisponible = await RendezVous.verifierDisponibilite(
    req.body.medecinId,
    new Date(dateDebut),
    new Date(dateFin)
  );

  if (!estDisponible) {
    return res.status(400).json({ 
      succes: false,
      message: 'Créneau indisponible',
      erreurs: [
        { 
          champ: 'dateDebut', 
          message: 'Le médecin a déjà un rendez-vous à ce créneau horaire' 
        },
        { 
          champ: 'dateFin', 
          message: 'Le médecin a déjà un rendez-vous à ce créneau horaire' 
        }
      ]
    });
  }

  // Créer le rendez-vous
  const rendezVous = await RendezVous.create({
    patient: patientId,
    patientNom: patientNom || `${patient.prenom} ${patient.nom}`.trim(),
    patientTelephone: patientTelephone || patient.telephone,
    medecin: req.body.medecinId,
    medecinNom: req.body.medecinNom || `${medecin.prenom} ${medecin.nom}`.trim(),
    dateDebut,
    dateFin,
    type,
    statut: 'confirme', // Par défaut, le rendez-vous est confirmé
    motif,
    notes,
    creePar: req.user.id
  });

  // Envoyer la réponse avec le rendez-vous formaté
  res.status(201).json({
    succes: true,
    message: 'Rendez-vous créé avec succès',
    donnees: {
      rendezVous: formaterRendezVous(rendezVous)
    }
  });
});

// Récupérer tous les rendez-vous avec filtrage
exports.obtenirRendezVous = asyncHandler(async (req, res) => {
  const { 
    statut, 
    date, 
    medecinId, 
    patientId,
    type,
    page = 1,
    limit = 10
  } = req.query;
  
  // Construire la requête de base
  let query = {};
  
  // Filtrage par rôle utilisateur
  if (req.user.role === 'patient') {
    query.patient = req.user.id;
  } else if (req.user.role === 'medecin') {
    query.medecin = req.user.id;
  } else if (req.user.role === 'secretaire') {
    // Les secrétaires voient les RDV des médecins qu'elles gèrent
    // Implémentez cette logique selon votre modèle de données
  }
  
  // Filtres optionnels
  if (statut) {
    query.statut = { $in: statut.split(',') };
  }
  
  if (date) {
    const dateDebut = new Date(date);
    dateDebut.setHours(0, 0, 0, 0);
    
    const dateFin = new Date(dateDebut);
    dateFin.setDate(dateFin.getDate() + 1);
    
    query.dateDebut = {
      $gte: dateDebut,
      $lt: dateFin
    };
  }
  
  if (medecinId) {
    query.medecin = medecinId;
  }
  
  if (patientId) {
    query.patient = patientId;
  }
  
  if (type) {
    query.type = { $in: type.split(',') };
  }
  
  // Exécuter la requête avec pagination
  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);
  const skip = (pageInt - 1) * limitInt;
  
  const [total, rendezVous] = await Promise.all([
    RendezVous.countDocuments(query),
    RendezVous.find(query)
      .sort({ dateDebut: 1 })
      .skip(skip)
      .limit(limitInt)
      .populate('patient', 'prenom nom telephone')
      .populate('medecin', 'prenom nom specialite')
      .populate('creePar', 'prenom nom role')
      .lean()
  ]);
  
  // Formater la réponse
  const resultats = rendezVous.map(formaterRendezVous);
  
  // Construire la pagination
  const pagination = {};
  const totalPages = Math.ceil(total / limitInt);
  
  if (pageInt < totalPages) {
    pagination.suivant = {
      page: pageInt + 1,
      limit: limitInt
    };
  }
  
  if (pageInt > 1) {
    pagination.precedent = {
      page: pageInt - 1,
      limit: limitInt
    };
  }
  
  res.status(200).json({
    succes: true,
    count: resultats.length,
    pagination: {
      ...pagination,
      total,
      totalPages,
      page: pageInt
    },
    donnees: {
      rendezVous: resultats
    }
  });
});

// Mettre à jour un rendez-vous
exports.mettreAJourRendezVous = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      succes: false,
      message: 'Erreur de validation',
      erreurs: errors.array().map(err => ({
        champ: err.param,
        message: err.msg
      }))
    });
  }

  const { 
    dateDebut, 
    dateFin, 
    statut, 
    notes,
    motif,
    type,
    presenceConfirmee,
    heureArrivee
  } = req.body;
  
  // Trouver le rendez-vous existant
  let rendezVous = await RendezVous.findById(req.params.id);
  
  if (!rendezVous) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun rendez-vous trouvé avec cet ID' }
      ]
    });
  }
  
  // Vérifier les autorisations (propriétaire ou admin)
  const estProprietaire = [
    rendezVous.patient.toString(),
    rendezVous.medecin.toString(),
    rendezVous.creePar.toString()
  ].includes(req.user.id);
  
  const estAdmin = req.user.role === 'admin';
  
  if (!estProprietaire && !estAdmin) {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { champ: 'autorisation', message: 'Vous n\'êtes pas autorisé à modifier ce rendez-vous' }
      ]
    });
  }
  
  // Vérifier les conflits de date si la date est modifiée
  if (dateDebut || dateFin) {
    const dateDebutRdv = dateDebut ? new Date(dateDebut) : rendezVous.dateDebut;
    const dateFinRdv = dateFin ? new Date(dateFin) : rendezVous.dateFin;
    
    const estDisponible = await RendezVous.verifierDisponibilite(
      rendezVous.medecin,
      dateDebutRdv,
      dateFinRdv,
      req.params.id // Exclure le RDV actuel de la vérification
    );
    
    if (!estDisponible) {
      return res.status(400).json({
        succes: false,
        message: 'Créneau indisponible',
        erreurs: [
          { 
            champ: 'dateDebut', 
            message: 'Le médecin a déjà un rendez-vous à ce créneau horaire' 
          },
          { 
            champ: 'dateFin', 
            message: 'Le médecin a déjà un rendez-vous à ce créneau horaire' 
          }
        ]
      });
    }
  }
  
  // Construire l'objet de mise à jour
  const champsMiseAJour = {};
  
  // Champs modifiables
  if (dateDebut) champsMiseAJour.dateDebut = dateDebut;
  if (dateFin) champsMiseAJour.dateFin = dateFin;
  if (statut) champsMiseAJour.statut = statut;
  if (motif !== undefined) champsMiseAJour.motif = motif;
  if (type) champsMiseAJour.type = type;
  if (notes !== undefined) champsMiseAJour.notes = notes;
  
  // Mise à jour de la présence
  if (presenceConfirmee !== undefined) {
    champsMiseAJour.presenceConfirmee = presenceConfirmee;
    if (presenceConfirmee && !rendezVous.heureArrivee) {
      champsMiseAJour.heureArrivee = new Date();
    } else if (!presenceConfirmee) {
      champsMiseAJour.heureArrivee = null;
    }
  }
  
  if (heureArrivee && !champsMiseAJour.heureArrivee) {
    champsMiseAJour.heureArrivee = heureArrivee;
  }
  
  // Mettre à jour le rendez-vous
  rendezVous = await RendezVous.findByIdAndUpdate(
    req.params.id,
    { 
      ...champsMiseAJour,
      modifiePar: req.user.id,
      dateMiseAJour: Date.now()
    },
    { 
      new: true, 
      runValidators: true,
      context: 'query'
    }
  )
  .populate('patient', 'prenom nom telephone')
  .populate('medecin', 'prenom nom specialite')
  .populate('creePar', 'prenom nom role')
  .lean();
  
  // Envoyer la réponse avec le rendez-vous formaté
  res.status(200).json({
    succes: true,
    message: 'Rendez-vous mis à jour avec succès',
    donnees: {
      rendezVous: formaterRendezVous(rendezVous)
    }
  });
});

// Supprimer un rendez-vous
exports.supprimerRendezVous = asyncHandler(async (req, res) => {
  // Trouver le rendez-vous existant
  const rendezVous = await RendezVous.findById(req.params.id);
  
  if (!rendezVous) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun rendez-vous trouvé avec cet ID' }
      ]
    });
  }
  
  // Vérifier les autorisations (propriétaire ou admin)
  const estProprietaire = [
    rendezVous.patient.toString(),
    rendezVous.medecin.toString(),
    rendezVous.creePar.toString()
  ].includes(req.user.id);
  
  const estAdmin = req.user.role === 'admin';
  
  if (!estProprietaire && !estAdmin) {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { champ: 'autorisation', message: 'Vous n\'êtes pas autorisé à supprimer ce rendez-vous' }
      ]
    });
  }
  
  // Vérifier si la suppression est autorisée (par exemple, pas de suppression après la date du RDV)
  const maintenant = new Date();
  const dateDebutRdv = new Date(rendezVous.dateDebut);
  
  if (maintenant > dateDebutRdv && !estAdmin) {
    return res.status(400).json({
      succes: false,
      message: 'Opération non autorisée',
      erreurs: [
        { 
          champ: 'dateDebut', 
          message: 'Impossible de supprimer un rendez-vous déjà passé. Veuillez contacter l\'administration.' 
        }
      ]
    });
  }
  
  // Supprimer le rendez-vous (soft delete)
  rendezVous.supprime = true;
  rendezVous.supprimePar = req.user.id;
  rendezVous.dateSuppression = Date.now();
  
  await rendezVous.save();
  
  res.status(200).json({
    succes: true,
    message: 'Rendez-vous supprimé avec succès',
    donnees: {}
  });
});

// Marquer un rendez-vous comme commencé
exports.commencerRendezVous = asyncHandler(async (req, res) => {
  // Trouver le rendez-vous existant
  const rendezVous = await RendezVous.findById(req.params.id);
  
  if (!rendezVous) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun rendez-vous trouvé avec cet ID' }
      ]
    });
  }
  
  // Vérifier que l'utilisateur est le médecin associé au rendez-vous
  if (rendezVous.medecin.toString() !== req.user.id) {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { 
          champ: 'autorisation', 
          message: 'Seul le médecin associé peut marquer le rendez-vous comme commencé' 
        }
      ]
    });
  }
  
  const maintenant = new Date();
  const dateDebutRdv = new Date(rendezVous.dateDebut);
  const dateFinRdv = new Date(rendezVous.dateFin);
  
  // Vérifier que le rendez-vous est confirmé
  if (rendezVous.statut !== 'confirme' && rendezVous.statut !== 'en_retard') {
    return res.status(400).json({
      succes: false,
      message: 'Opération non autorisée',
      erreurs: [
        { 
          champ: 'statut', 
          message: `Le rendez-vous doit être confirmé pour être marqué comme commencé. Statut actuel: ${rendezVous.statut}`
        }
      ]
    });
  }
  
  // Vérifier que le rendez-vous n'est pas déjà terminé
  if (rendezVous.statut === 'termine') {
    return res.status(400).json({
      succes: false,
      message: 'Opération non autorisée',
      erreurs: [
        { 
          champ: 'statut', 
          message: 'Impossible de démarrer un rendez-vous déjà terminé'
        }
      ]
    });
  }
  
  // Vérifier que le rendez-vous n'est pas dans le futur
  if (maintenant < dateDebutRdv) {
    return res.status(400).json({
      succes: false,
      message: 'Opération non autorisée',
      erreurs: [
        { 
          champ: 'dateDebut', 
          message: 'Impossible de démarrer un rendez-vous avant son heure de début prévue'
        }
      ]
    });
  }
  
  // Mettre à jour le statut et l'heure de début
  rendezVous.statut = 'en_cours';
  rendezVous.heureDebut = maintenant;
  rendezVous.modifiePar = req.user.id;
  rendezVous.dateMiseAJour = maintenant;
  
  // Si le rendez-vous commence en retard, noter le retard
  if (maintenant > dateDebutRdv) {
    const retardEnMinutes = Math.floor((maintenant - dateDebutRdv) / (1000 * 60));
    rendezVous.retardMinutes = retardEnMinutes;
    
    // Envoyer une notification de retard si nécessaire
    // À implémenter : système de notification
  }
  
  await rendezVous.save();
  
  // Peupler les données pour la réponse
  const rendezVousPopule = await RendezVous.findById(rendezVous._id)
    .populate('patient', 'prenom nom telephone')
    .populate('medecin', 'prenom nom specialite')
    .populate('creePar', 'prenom nom role')
    .lean();
  
  res.status(200).json({
    succes: true,
    message: 'Rendez-vous marqué comme commencé avec succès',
    donnees: {
      rendezVous: formaterRendezVous(rendezVousPopule)
    }
  });
});

// Marquer un rendez-vous comme terminé
exports.terminerRendezVous = asyncHandler(async (req, res) => {
  // Trouver le rendez-vous existant
  const rendezVous = await RendezVous.findById(req.params.id);
  
  if (!rendezVous) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun rendez-vous trouvé avec cet ID' }
      ]
    });
  }
  
  // Vérifier que l'utilisateur est le médecin associé au rendez-vous
  if (rendezVous.medecin.toString() !== req.user.id) {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { 
          champ: 'autorisation', 
          message: 'Seul le médecin associé peut marquer le rendez-vous comme terminé' 
        }
      ]
    });
  }
  
  const maintenant = new Date();
  const dateDebutRdv = new Date(rendezVous.dateDebut);
  const dateFinRdv = new Date(rendezVous.dateFin);
  
  // Vérifier que le rendez-vous est en cours
  if (rendezVous.statut !== 'en_cours') {
    return res.status(400).json({
      succes: false,
      message: 'Opération non autorisée',
      erreurs: [
        { 
          champ: 'statut', 
          message: `Le rendez-vous doit être en cours pour être marqué comme terminé. Statut actuel: ${rendezVous.statut}`
        }
      ]
    });
  }
  
  // Vérifier que le rendez-vous a bien commencé
  if (!rendezVous.heureDebut) {
    return res.status(400).json({
      succes: false,
      message: 'Opération non autorisée',
      erreurs: [
        { 
          champ: 'statut', 
          message: 'Impossible de terminer un rendez-vous qui n\'a pas commencé'
        }
      ]
    });
  }
  
  // Calculer la durée réelle en minutes
  const dureeReelleMinutes = Math.floor((maintenant - rendezVous.heureDebut) / (1000 * 60));
  
  // Calculer le dépassement éventuel
  const dureePrevueMinutes = Math.floor((dateFinRdv - dateDebutRdv) / (1000 * 60));
  const depassementMinutes = dureeReelleMinutes - dureePrevueMinutes;
  
  // Mettre à jour le rendez-vous
  rendezVous.statut = 'termine';
  rendezVous.heureFin = maintenant;
  rendezVous.dureeReelleMinutes = dureeReelleMinutes;
  
  if (depassementMinutes > 0) {
    rendezVous.depassementMinutes = depassementMinutes;
    
    // Marquer comme dépassement si significatif (plus de 5 minutes)
    if (depassementMinutes > 5) {
      rendezVous.avecDepassement = true;
      
      // Envoyer une notification pour dépassement si nécessaire
      // À implémenter : système de notification
    }
  }
  
  rendezVous.modifiePar = req.user.id;
  rendezVous.dateMiseAJour = maintenant;
  
  await rendezVous.save();
  
  // Peupler les données pour la réponse
  const rendezVousPopule = await RendezVous.findById(rendezVous._id)
    .populate('patient', 'prenom nom telephone')
    .populate('medecin', 'prenom nom specialite')
    .populate('creePar', 'prenom nom role')
    .lean();
  
  res.status(200).json({
    succes: true,
    message: 'Rendez-vous marqué comme terminé avec succès',
    donnees: {
      rendezVous: formaterRendezVous(rendezVousPopule),
      dureeReelleMinutes,
      depassementMinutes: depassementMinutes > 0 ? depassementMinutes : 0
    }
  });
});
