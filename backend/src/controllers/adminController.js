const Utilisateur = require('../models/Utilisateur');
const RendezVous = require('../models/RendezVous');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');

/**
 * Obtenir la liste des utilisateurs avec pagination et filtres
 * GET /api/admin/utilisateurs
 * Accès: Admin uniquement
 */
exports.obtenirUtilisateurs = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    role, 
    statut, 
    recherche, 
    tri = 'nom', 
    ordre = 'asc' 
  } = req.query;
  
  // Construire la requête
  const query = {};
  
  // Filtres
  if (role) {
    query.role = role;
  }
  
  if (statut) {
    query.statut = statut;
  }
  
  // Recherche par nom, prénom, email
  if (recherche) {
    const regex = new RegExp(recherche, 'i');
    query.$or = [
      { nom: regex },
      { prenom: regex },
      { email: regex }
    ];
  }
  
  // Options de tri
  const sort = {};
  sort[tri] = ordre === 'desc' ? -1 : 1;
  
  // Pagination
  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);
  const skip = (pageInt - 1) * limitInt;
  
  // Exécuter les requêtes en parallèle
  const [total, utilisateurs] = await Promise.all([
    Utilisateur.countDocuments(query),
    Utilisateur.find(query)
      .select('-motDePasse')
      .sort(sort)
      .skip(skip)
      .limit(limitInt)
      .lean()
  ]);
  
  // Formater la réponse
  const resultats = utilisateurs.map(user => ({
    id: user._id,
    civilite: user.civilite,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    telephone: user.telephone,
    role: user.role,
    specialite: user.specialite,
    statut: user.statut,
    dateCreation: user.dateCreation,
    dateDerniereConnexion: user.dateDerniereConnexion
  }));
  
  // Pagination
  const pagination = {
    total,
    totalPages: Math.ceil(total / limitInt),
    page: pageInt,
    limit: limitInt
  };
  
  if (pageInt < pagination.totalPages) {
    pagination.suivant = pageInt + 1;
  }
  
  if (pageInt > 1) {
    pagination.precedent = pageInt - 1;
  }
  
  res.status(200).json({
    succes: true,
    message: 'Liste des utilisateurs récupérée avec succès',
    donnees: {
      utilisateurs: resultats,
      pagination
    }
  });
});

/**
 * Créer un nouvel utilisateur (admin seulement)
 * POST /api/admin/utilisateurs
 * Accès: Admin uniquement
 */
exports.creerUtilisateur = asyncHandler(async (req, res) => {
  // Valider les données
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
    civilite,
    nom,
    prenom,
    email,
    telephone,
    role,
    specialite,
    motDePasse = 'MotDePasseParDefaut123!', // Mot de passe par défaut sécurisé
    statut = 'actif'
  } = req.body;
  
  // Vérifier si l'email existe déjà
  const utilisateurExistant = await Utilisateur.findOne({ email });
  
  if (utilisateurExistant) {
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { champ: 'email', message: 'Un utilisateur avec cet email existe déjà' }
      ]
    });
  }
  
  // Hacher le mot de passe
  const sel = await bcrypt.genSalt(10);
  const motDePasseHache = await bcrypt.hash(motDePasse, sel);
  
  // Créer l'utilisateur
  const nouvelUtilisateur = await Utilisateur.create({
    civilite,
    nom,
    prenom,
    email,
    telephone,
    role,
    specialite: role === 'medecin' ? specialite : undefined,
    motDePasse: motDePasseHache,
    statut,
    creePar: req.user.id
  });
  
  // Ne pas renvoyer le mot de passe dans la réponse
  const utilisateurReponse = nouvelUtilisateur.toObject();
  delete utilisateurReponse.motDePasse;
  
  // Journaliser l'action
  logger.info(`Nouvel utilisateur créé par l'admin ${req.user.id}`, {
    utilisateurCree: nouvelUtilisateur._id,
    role: nouvelUtilisateur.role,
    statut: nouvelUtilisateur.statut
  });
  
  res.status(201).json({
    succes: true,
    message: 'Utilisateur créé avec succès',
    donnees: {
      utilisateur: utilisateurReponse
    }
  });
});

/**
 * Obtenir les détails d'un utilisateur
 * GET /api/admin/utilisateurs/:id
 * Accès: Admin uniquement
 */
exports.obtenirUtilisateur = asyncHandler(async (req, res) => {
  const utilisateur = await Utilisateur.findById(req.params.id)
    .select('-motDePasse')
    .populate('creePar', 'prenom nom')
    .populate('modifiePar', 'prenom nom')
    .lean();
  
  if (!utilisateur) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun utilisateur trouvé avec cet ID' }
      ]
    });
  }
  
  res.status(200).json({
    succes: true,
    message: 'Utilisateur récupéré avec succès',
    donnees: {
      utilisateur
    }
  });
});

/**
 * Mettre à jour un utilisateur
 * PUT /api/admin/utilisateurs/:id
 * Accès: Admin uniquement
 */
exports.mettreAJourUtilisateur = asyncHandler(async (req, res) => {
  // Valider les données
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
    civilite,
    nom,
    prenom,
    email,
    telephone,
    role,
    specialite,
    statut
  } = req.body;
  
  // Vérifier si l'utilisateur existe
  const utilisateur = await Utilisateur.findById(req.params.id);
  
  if (!utilisateur) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun utilisateur trouvé avec cet ID' }
      ]
    });
  }
  
  // Vérifier si l'email est déjà utilisé par un autre utilisateur
  if (email && email !== utilisateur.email) {
    const emailExiste = await Utilisateur.findOne({ 
      email,
      _id: { $ne: req.params.id }
    });
    
    if (emailExiste) {
      return res.status(400).json({
        succes: false,
        message: 'Erreur de validation',
        erreurs: [
          { champ: 'email', message: 'Cet email est déjà utilisé par un autre compte' }
        ]
      });
    }
  }
  
  // Mettre à jour l'utilisateur
  const champsMiseAJour = {};
  
  if (civilite) champsMiseAJour.civilite = civilite;
  if (nom) champsMiseAJour.nom = nom;
  if (prenom) champsMiseAJour.prenom = prenom;
  if (email) champsMiseAJour.email = email;
  if (telephone) champsMiseAJour.telephone = telephone;
  if (role) champsMiseAJour.role = role;
  if (specialite) champsMiseAJour.specialite = role === 'medecin' ? specialite : undefined;
  if (statut) champsMiseAJour.statut = statut;
  
  // Ajouter les métadonnées de mise à jour
  champsMiseAJour.modifiePar = req.user.id;
  champsMiseAJour.dateMiseAJour = Date.now();
  
  const utilisateurModifie = await Utilisateur.findByIdAndUpdate(
    req.params.id,
    { $set: champsMiseAJour },
    { new: true, runValidators: true }
  ).select('-motDePasse');
  
  // Journaliser l'action
  logger.info(`Utilisateur modifié par l'admin ${req.user.id}`, {
    utilisateurModifie: utilisateurModifie._id,
    champsModifies: Object.keys(champsMiseAJour)
  });
  
  res.status(200).json({
    succes: true,
    message: 'Utilisateur mis à jour avec succès',
    donnees: {
      utilisateur: utilisateurModifie
    }
  });
});

/**
 * Réinitialiser le mot de passe d'un utilisateur
 * POST /api/admin/utilisateurs/:id/reinitialiser-mot-de-passe
 * Accès: Admin uniquement
 */
exports.reinitialiserMotDePasse = asyncHandler(async (req, res) => {
  const { motDePasse } = req.body;
  
  // Valider le mot de passe
  if (!motDePasse || motDePasse.length < 8) {
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { 
          champ: 'motDePasse', 
          message: 'Le mot de passe doit contenir au moins 8 caractères' 
        }
      ]
    });
  }
  
  // Vérifier si l'utilisateur existe
  const utilisateur = await Utilisateur.findById(req.params.id);
  
  if (!utilisateur) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun utilisateur trouvé avec cet ID' }
      ]
    });
  }
  
  // Hacher le nouveau mot de passe
  const sel = await bcrypt.genSalt(10);
  const motDePasseHache = await bcrypt.hash(motDePasse, sel);
  
  // Mettre à jour le mot de passe
  utilisateur.motDePasse = motDePasseHache;
  utilisateur.dateMiseAJour = Date.now();
  utilisateur.modifiePar = req.user.id;
  
  await utilisateur.save();
  
  // Journaliser l'action
  logger.info(`Mot de passe réinitialisé par l'admin ${req.user.id}`, {
    utilisateurCible: utilisateur._id,
    reinitialisationForcee: true
  });
  
  res.status(200).json({
    succes: true,
    message: 'Mot de passe réinitialisé avec succès',
    donnees: {}
  });
});

/**
 * Désactiver un compte utilisateur
 * PATCH /api/admin/utilisateurs/:id/desactiver
 * Accès: Admin uniquement
 */
exports.desactiverUtilisateur = asyncHandler(async (req, res) => {
  // Vérifier si l'utilisateur existe
  const utilisateur = await Utilisateur.findById(req.params.id);
  
  if (!utilisateur) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun utilisateur trouvé avec cet ID' }
      ]
    });
  }
  
  // Vérifier si l'utilisateur n'est pas déjà désactivé
  if (utilisateur.statut === 'inactif') {
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { champ: 'statut', message: 'Ce compte est déjà désactivé' }
      ]
    });
  }
  
  // Désactiver l'utilisateur
  const utilisateurDesactive = await Utilisateur.findByIdAndUpdate(
    req.params.id,
    { 
      $set: { 
        statut: 'inactif',
        modifiePar: req.user.id,
        dateMiseAJour: Date.now()
      } 
    },
    { new: true }
  ).select('-motDePasse');
  
  // Annuler les rendez-vous à venir de l'utilisateur si c'est un médecin
  if (utilisateur.role === 'medecin') {
    await RendezVous.updateMany(
      {
        medecin: utilisateur._id,
        dateDebut: { $gt: new Date() },
        statut: { $in: ['confirme', 'en_attente'] }
      },
      {
        $set: {
          statut: 'annule',
          motifAnnulation: 'Médecin indisponible',
          modifiePar: req.user.id,
          dateMiseAJour: Date.now()
        }
      }
    );
  }
  
  // Journaliser l'action
  logger.info(`Utilisateur désactivé par l'admin ${req.user.id}`, {
    utilisateurDesactive: utilisateur._id,
    role: utilisateur.role
  });
  
  res.status(200).json({
    succes: true,
    message: 'Utilisateur désactivé avec succès',
    donnees: {
      utilisateur: utilisateurDesactive
    }
  });
});

/**
 * Réactiver un compte utilisateur
 * PATCH /api/admin/utilisateurs/:id/reactiver
 * Accès: Admin uniquement
 */
exports.reactiverUtilisateur = asyncHandler(async (req, res) => {
  // Vérifier si l'utilisateur existe
  const utilisateur = await Utilisateur.findById(req.params.id);
  
  if (!utilisateur) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun utilisateur trouvé avec cet ID' }
      ]
    });
  }
  
  // Vérifier si l'utilisateur n'est pas déjà actif
  if (utilisateur.statut === 'actif') {
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { champ: 'statut', message: 'Ce compte est déjà actif' }
      ]
    });
  }
  
  // Réactiver l'utilisateur
  const utilisateurReactive = await Utilisateur.findByIdAndUpdate(
    req.params.id,
    { 
      $set: { 
        statut: 'actif',
        modifiePar: req.user.id,
        dateMiseAJour: Date.now()
      } 
    },
    { new: true }
  ).select('-motDePasse');
  
  // Journaliser l'action
  logger.info(`Utilisateur réactivé par l'admin ${req.user.id}`, {
    utilisateurReactive: utilisateur._id,
    role: utilisateur.role
  });
  
  res.status(200).json({
    succes: true,
    message: 'Utilisateur réactivé avec succès',
    donnees: {
      utilisateur: utilisateurReactive
    }
  });
});

/**
 * Supprimer un utilisateur (soft delete)
 * DELETE /api/admin/utilisateurs/:id
 * Accès: Admin uniquement
 */
exports.supprimerUtilisateur = asyncHandler(async (req, res) => {
  // Vérifier si l'utilisateur existe
  const utilisateur = await Utilisateur.findById(req.params.id);
  
  if (!utilisateur) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun utilisateur trouvé avec cet ID' }
      ]
    });
  }
  
  // Vérifier si l'utilisateur n'est pas déjà supprimé
  if (utilisateur.supprime) {
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { champ: 'supprime', message: 'Ce compte a déjà été supprimé' }
      ]
    });
  }
  
  // Vérifier si l'utilisateur a des rendez-vous à venir
  const rendezVousAVenir = await RendezVous.findOne({
    $or: [
      { medecin: utilisateur._id },
      { patient: utilisateur._id }
    ],
    dateDebut: { $gt: new Date() },
    statut: { $in: ['confirme', 'en_attente'] }
  });
  
  if (rendezVousAVenir) {
    return res.status(400).json({
      succes: false,
      message: 'Impossible de supprimer cet utilisateur',
      erreurs: [
        { 
          champ: 'rendezVous', 
          message: 'Cet utilisateur a des rendez-vous à venir. Veuillez d\'abord les annuler ou les réaffecter.' 
        }
      ]
    });
  }
  
  // Effectuer un soft delete
  utilisateur.supprime = true;
  utilisateur.email = `${utilisateur.email}_supprime_${Date.now()}`;
  utilisateur.telephone = utilisateur.telephone ? `${utilisateur.telephone}_supprime_${Date.now()}` : null;
  utilisateur.modifiePar = req.user.id;
  utilisateur.dateMiseAJour = Date.now();
  
  await utilisateur.save();
  
  // Journaliser l'action
  logger.info(`Utilisateur supprimé (soft delete) par l'admin ${req.user.id}`, {
    utilisateurSupprime: utilisateur._id,
    role: utilisateur.role
  });
  
  res.status(200).json({
    succes: true,
    message: 'Utilisateur supprimé avec succès',
    donnees: {}
  });
});

/**
 * Obtenir les statistiques d'administration
 * GET /api/admin/statistiques
 * Accès: Admin uniquement
 */
exports.obtenirStatistiquesAdmin = asyncHandler(async (req, res) => {
  // Compter les utilisateurs par rôle
  const nombreUtilisateursParRole = await Utilisateur.aggregate([
    { $match: { supprime: { $ne: true } } },
    { $group: { _id: '$role', total: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);
  
  // Compter les rendez-vous par statut
  const rendezVousParStatut = await RendezVous.aggregate([
    { 
      $match: { 
        dateDebut: { 
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) 
        } 
      } 
    },
    { $group: { _id: '$statut', total: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);
  
  // Rendez-vous par mois pour les 12 derniers mois
  const rendezVousParMois = await RendezVous.aggregate([
    { 
      $match: { 
        dateCreation: { 
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)),
          $lte: new Date()
        } 
      } 
    },
    {
      $group: {
        _id: { 
          annee: { $year: '$dateCreation' },
          mois: { $month: '$dateCreation' }
        },
        total: { $sum: 1 }
      }
    },
    { $sort: { '_id.annee': 1, '_id.mois': 1 } },
    {
      $project: {
        _id: 0,
        periode: {
          $dateToString: {
            format: '%Y-%m',
            date: {
              $dateFromParts: {
                year: '$_id.annee',
                month: '$_id.mois',
                day: 1
              }
            }
          }
        },
        total: 1
      }
    }
  ]);
  
  // Derniers utilisateurs inscrits
  const derniersUtilisateurs = await Utilisateur.find({ supprime: { $ne: true } })
    .sort({ dateCreation: -1 })
    .limit(5)
    .select('prenom nom email role dateCreation')
    .lean();
  
  // Prochains rendez-vous
  const prochainsRendezVous = await RendezVous.find({
    dateDebut: { $gte: new Date() },
    statut: { $in: ['confirme', 'en_attente'] }
  })
  .sort({ dateDebut: 1 })
  .limit(5)
  .populate('patient', 'prenom nom')
  .populate('medecin', 'prenom nom')
  .select('dateDebut dateFin statut type motif')
  .lean();
  
  res.status(200).json({
    succes: true,
    message: 'Statistiques administratives récupérées avec succès',
    donnees: {
      utilisateurs: {
        total: nombreUtilisateursParRole.reduce((acc, curr) => acc + curr.total, 0),
        parRole: nombreUtilisateursParRole,
        derniersInscrits: derniersUtilisateurs
      },
      rendezVous: {
        parStatut: rendezVousParStatut,
        parMois: rendezVousParMois,
        prochains: prochainsRendezVous
      }
    }
  });
});

/**
 * Exporter les données utilisateurs (CSV/Excel)
 * GET /api/admin/export/utilisateurs
 * Accès: Admin uniquement
 */
exports.exporterUtilisateurs = asyncHandler(async (req, res) => {
  const { format = 'csv' } = req.query;
  
  // Récupérer tous les utilisateurs (non supprimés)
  const utilisateurs = await Utilisateur.find({ supprime: { $ne: true } })
    .select('-motDePasse')
    .sort({ nom: 1, prenom: 1 })
    .lean();
  
  // Formater les données pour l'export
  const donnees = utilisateurs.map(user => ({
    'ID': user._id,
    'Civilité': user.civilite,
    'Nom': user.nom,
    'Prénom': user.prenom,
    'Email': user.email,
    'Téléphone': user.telephone || '',
    'Rôle': user.role,
    'Spécialité': user.specialite || '',
    'Statut': user.statut,
    'Date de création': user.dateCreation.toISOString(),
    'Dernière connexion': user.dateDerniereConnexion ? user.dateDerniereConnexion.toISOString() : 'Jamais',
    'Créé par': user.creePar || 'Système',
    'Dernière modification': user.dateMiseAJour ? user.dateMiseAJour.toISOString() : 'Jamais',
    'Modifié par': user.modifiePar || 'Personne'
  }));
  
  // Si le format demandé est CSV
  if (format.toLowerCase() === 'csv') {
    // Convertir en CSV
    const csv = require('csv-stringify/sync');
    const csvData = csv.stringify(donnees, {
      header: true,
      quotedString: true
    });
    
    // Définir les en-têtes de la réponse
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=utilisateurs_export_' + new Date().toISOString().split('T')[0] + '.csv');
    
    // Envoyer le fichier CSV
    return res.status(200).send(csvData);
  }
  
  // Si le format demandé est Excel ou autre format non pris en charge
  // Pour l'instant, on renvoie du JSON
  res.status(200).json({
    succes: true,
    message: 'Export des utilisateurs réussi',
    donnees: {
      format: 'json',
      total: donnees.length,
      utilisateurs: donnees
    }
  });
});

/**
 * Exporter les données des rendez-vous (CSV/Excel)
 * GET /api/admin/export/rendez-vous
 * Accès: Admin uniquement
 */
exports.exporterRendezVous = asyncHandler(async (req, res) => {
  const { 
    format = 'csv',
    dateDebut,
    dateFin,
    statut,
    medecinId,
    patientId
  } = req.query;
  
  // Construire la requête
  const query = {};
  
  // Filtres optionnels
  if (dateDebut || dateFin) {
    query.dateDebut = {};
    if (dateDebut) query.dateDebut.$gte = new Date(dateDebut);
    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      query.dateDebut.$lte = fin;
    }
  }
  
  if (statut) {
    query.statut = statut;
  }
  
  if (medecinId) {
    query.medecin = medecinId;
  }
  
  if (patientId) {
    query.patient = patientId;
  }
  
  // Récupérer les rendez-vous avec les informations des utilisateurs
  const rendezVous = await RendezVous.find(query)
    .populate('patient', 'prenom nom email telephone')
    .populate('medecin', 'prenom nom specialite')
    .populate('creePar', 'prenom nom')
    .populate('modifiePar', 'prenom nom')
    .sort({ dateDebut: -1 })
    .lean();
  
  // Formater les données pour l'export
  const donnees = rendezVous.map(rdv => ({
    'ID': rdv._id,
    'Date et heure de début': rdv.dateDebut.toISOString(),
    'Date et heure de fin': rdv.dateFin.toISOString(),
    'Durée (minutes)': Math.round((rdv.dateFin - rdv.dateDebut) / (1000 * 60)),
    'Type': rdv.type || '',
    'Motif': rdv.motif || '',
    'Statut': rdv.statut,
    'Notes': rdv.notes || '',
    'Patient ID': rdv.patient?._id || '',
    'Patient': rdv.patient ? `${rdv.patient.prenom} ${rdv.patient.nom}` : 'Inconnu',
    'Email patient': rdv.patient?.email || '',
    'Téléphone patient': rdv.patient?.telephone || '',
    'Médecin ID': rdv.medecin?._id || '',
    'Médecin': rdv.medecin ? `Dr. ${rdv.medecin.prenom} ${rdv.medecin.nom}` : 'Non attribué',
    'Spécialité': rdv.medecin?.specialite || '',
    'Date de création': rdv.dateCreation.toISOString(),
    'Créé par': rdv.creePar ? `${rdv.creePar.prenom} ${rdv.creePar.nom}` : 'Système',
    'Dernière modification': rdv.dateMiseAJour ? rdv.dateMiseAJour.toISOString() : 'Jamais',
    'Modifié par': rdv.modifiePar ? `${rdv.modifiePar.prenom} ${rdv.modifiePar.nom}` : 'Personne',
    'Annulé le': rdv.dateAnnulation ? rdv.dateAnnulation.toISOString() : '',
    'Motif d\'annulation': rdv.motifAnnulation || ''
  }));
  
  // Si le format demandé est CSV
  if (format.toLowerCase() === 'csv') {
    // Convertir en CSV
    const csv = require('csv-stringify/sync');
    const csvData = csv.stringify(donnees, {
      header: true,
      quotedString: true
    });
    
    // Définir les en-têtes de la réponse
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=rendez_vous_export_${new Date().toISOString().split('T')[0]}.csv`);
    
    // Envoyer le fichier CSV
    return res.status(200).send(csvData);
  }
  
  // Si le format demandé est Excel ou autre format non pris en charge
  // Pour l'instant, on renvoie du JSON
  res.status(200).json({
    succes: true,
    message: 'Export des rendez-vous réussi',
    donnees: {
      format: 'json',
      total: donnees.length,
      filtres: { dateDebut, dateFin, statut, medecinId, patientId },
      rendezVous: donnees
    }
  });
});
