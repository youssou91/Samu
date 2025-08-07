const Parametre = require('../models/Parametre');
const JoursFeries = require('../models/JoursFeries');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');

/**
 * Obtenir les paramètres de l'application
 * GET /api/parametres
 * Accès: Admin uniquement
 */
exports.obtenirParametres = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { champ: 'autorisation', message: 'Vous devez être administrateur pour accéder à cette ressource' }
      ]
    });
  }

  // Récupérer les paramètres
  const parametres = await Parametre.findOne({});
  
  // Si aucun paramètre n'existe, créer une configuration par défaut
  if (!parametres) {
    const parametresParDefaut = new Parametre({
      horairesOuverture: [
        { jour: 1, ouvrir: '08:00', fermer: '18:00', estOuvert: true },
        { jour: 2, ouvrir: '08:00', fermer: '18:00', estOuvert: true },
        { jour: 3, ouvrir: '08:00', fermer: '18:00', estOuvert: true },
        { jour: 4, ouvrir: '08:00', fermer: '18:00', estOuvert: true },
        { jour: 5, ouvrir: '08:00', fermer: '18:00', estOuvert: true },
        { jour: 6, ouvrir: '09:00', fermer: '12:00', estOuvert: false },
        { jour: 0, ouvrir: '09:00', fermer: '12:00', estOuvert: false },
      ],
      dureeRdvDefaut: 30, // en minutes
      dureePauseDefaut: 15, // en minutes
      delaiAnnulationHeures: 24, // délai minimum pour annuler un RDV
      delaiRappelHeures: 24, // délai d'envoi du rappel avant le RDV
      notifications: {
        emailActif: true,
        smsActif: true,
        rappelActif: true,
        confirmationActif: true,
        annulationActif: true,
        modificationActif: true
      },
      creePar: req.user.id
    });
    
    await parametresParDefaut.save();
    
    return res.status(200).json({
      succes: true,
      message: 'Paramètres récupérés avec succès',
      donnees: {
        parametres: parametresParDefaut
      }
    });
  }
  
  res.status(200).json({
    succes: true,
    message: 'Paramètres récupérés avec succès',
    donnees: {
      parametres
    }
  });
});

/**
 * Mettre à jour les paramètres de l'application
 * PUT /api/parametres
 * Accès: Admin uniquement
 */
exports.mettreAJourParametres = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { champ: 'autorisation', message: 'Vous devez être administrateur pour modifier cette ressource' }
      ]
    });
  }
  
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
    horairesOuverture,
    dureeRdvDefaut,
    dureePauseDefaut,
    delaiAnnulationHeures,
    delaiRappelHeures,
    notifications
  } = req.body;
  
  // Mettre à jour les paramètres
  const parametres = await Parametre.findOneAndUpdate(
    {},
    {
      $set: {
        horairesOuverture,
        dureeRdvDefaut,
        dureePauseDefaut,
        delaiAnnulationHeures,
        delaiRappelHeures,
        notifications,
        modifiePar: req.user.id,
        dateMiseAJour: Date.now()
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  
  res.status(200).json({
    succes: true,
    message: 'Paramètres mis à jour avec succès',
    donnees: {
      parametres
    }
  });
});

/**
 * Obtenir la liste des jours fériés
 * GET /api/parametres/jours-feries
 * Accès: Tous les utilisateurs authentifiés
 */
exports.obtenirJoursFeries = asyncHandler(async (req, res) => {
  const { annee } = req.query;
  
  let query = {};
  
  // Filtrer par année si spécifiée
  if (annee) {
    const debutAnnee = new Date(annee, 0, 1);
    const finAnnee = new Date(annee, 11, 31, 23, 59, 59);
    
    query.date = {
      $gte: debutAnnee,
      $lte: finAnnee
    };
  }
  
  const joursFeries = await JoursFeries.find(query).sort({ date: 1 });
  
  res.status(200).json({
    succes: true,
    message: 'Jours fériés récupérés avec succès',
    donnees: {
      joursFeries,
      total: joursFeries.length
    }
  });
});

/**
 * Ajouter un jour férié
 * POST /api/parametres/jours-feries
 * Accès: Admin uniquement
 */
exports.ajouterJourFerie = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { champ: 'autorisation', message: 'Vous devez être administrateur pour ajouter un jour férié' }
      ]
    });
  }
  
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
  
  const { date, libelle, estRecurrent } = req.body;
  
  // Vérifier si le jour férié existe déjà
  const jourFerieExiste = await JoursFeries.findOne({ date });
  
  if (jourFerieExiste) {
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { champ: 'date', message: 'Un jour férié existe déjà pour cette date' }
      ]
    });
  }
  
  // Créer le jour férié
  const jourFerie = await JoursFeries.create({
    date,
    libelle,
    estRecurrent,
    creePar: req.user.id
  });
  
  res.status(201).json({
    succes: true,
    message: 'Jour férié ajouté avec succès',
    donnees: {
      jourFerie
    }
  });
});

/**
 * Supprimer un jour férié
 * DELETE /api/parametres/jours-feries/:id
 * Accès: Admin uniquement
 */
exports.supprimerJourFerie = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { champ: 'autorisation', message: 'Vous devez être administrateur pour supprimer un jour férié' }
      ]
    });
  }
  
  const jourFerie = await JoursFeries.findById(req.params.id);
  
  if (!jourFerie) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'id', message: 'Aucun jour férié trouvé avec cet ID' }
      ]
    });
  }
  
  // Supprimer le jour férié
  await jourFerie.remove();
  
  res.status(200).json({
    succes: true,
    message: 'Jour férié supprimé avec succès',
    donnees: {}
  });
});

/**
 * Générer automatiquement les jours fériés pour une année donnée
 * POST /api/parametres/jours-feries/generer
 * Accès: Admin uniquement
 */
exports.genererJoursFeries = asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur est admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé',
      erreurs: [
        { champ: 'autorisation', message: 'Vous devez être administrateur pour générer des jours fériés' }
      ]
    });
  }
  
  const { annee } = req.body;
  
  if (!annee || isNaN(annee)) {
    return res.status(400).json({
      succes: false,
      message: 'Erreur de validation',
      erreurs: [
        { champ: 'annee', message: 'L\'année est requise et doit être un nombre valide' }
      ]
    });
  }
  
  // Jours fériés fixes (date fixe chaque année)
  const joursFeriesFixes = [
    { date: new Date(annee, 0, 1), libelle: 'Jour de l\'an', estRecurrent: true },
    { date: new Date(annee, 4, 1), libelle: 'Fête du Travail', estRecurrent: true },
    { date: new Date(annee, 4, 8), libelle: 'Victoire 1945', estRecurrent: true },
    { date: new Date(annee, 6, 14), libelle: 'Fête Nationale', estRecurrent: true },
    { date: new Date(annee, 7, 15), libelle: 'Assomption', estRecurrent: true },
    { date: new Date(annee, 10, 1), libelle: 'Toussaint', estRecurrent: true },
    { date: new Date(annee, 10, 11), libelle: 'Armistice 1918', estRecurrent: true },
    { date: new Date(annee, 11, 25), libelle: 'Noël', estRecurrent: true }
  ];
  
  // Calculer les jours fériés mobiles (Pâques, Ascension, Pentecôte)
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const moisPaques = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const jourPaques = (h + l - 7 * m + 114) % 31 + 1;
  
  const datePaques = new Date(annee, moisPaques, jourPaques);
  
  // Ajouter les jours fériés mobiles
  const joursFeriesMobiles = [
    { date: datePaques, libelle: 'Dimanche de Pâques', estRecurrent: true },
    { 
      date: new Date(datePaques.getTime() + 86400000), // +1 jour
      libelle: 'Lundi de Pâques', 
      estRecurrent: true 
    },
    { 
      date: new Date(datePaques.getTime() + 39 * 86400000), // 39 jours après Pâques
      libelle: 'Jeudi de l\'Ascension', 
      estRecurrent: true 
    },
    { 
      date: new Date(datePaques.getTime() + 49 * 86400000), // 49 jours après Pâques
      libelle: 'Lundi de Pentecôte', 
      estRecurrent: true 
    }
  ];
  
  // Fusionner les tableaux
  const tousLesJoursFeries = [...joursFeriesFixes, ...joursFeriesMobiles];
  
  // Vérifier les doublons et insérer les jours fériés
  const resultats = [];
  const erreurs = [];
  
  for (const jf of tousLesJoursFeries) {
    try {
      // Vérifier si le jour férié existe déjà
      const existeDeja = await JoursFeries.findOne({ date: jf.date });
      
      if (!existeDeja) {
        const nouveauJourFerie = await JoursFeries.create({
          date: jf.date,
          libelle: jf.libelle,
          estRecurrent: jf.estRecurrent,
          creePar: req.user.id
        });
        
        resultats.push(nouveauJourFerie);
      } else {
        erreurs.push({
          date: jf.date,
          message: `Un jour férié existe déjà pour le ${jf.date.toLocaleDateString('fr-FR')}`
        });
      }
    } catch (error) {
      erreurs.push({
        date: jf.date,
        message: `Erreur lors de l'ajout du jour férié: ${error.message}`
      });
    }
  }
  
  res.status(200).json({
    succes: true,
    message: `Génération des jours fériés pour l'année ${annee} terminée`,
    donnees: {
      ajoutes: resultats.length,
      erreurs: erreurs.length,
      resultats,
      erreurs
    }
  });
});

/**
 * Obtenir les paramètres de notification
 * GET /api/parametres/notifications
 * Accès: Tous les utilisateurs authentifiés
 */
exports.obtenirParametresNotifications = asyncHandler(async (req, res) => {
  // Récupérer les paramètres de notification de l'utilisateur
  const utilisateur = await Utilisateur.findById(req.user.id).select('+parametresNotifications');
  
  // Si l'utilisateur n'a pas encore de paramètres, initialiser avec des valeurs par défaut
  if (!utilisateur.parametresNotifications) {
    utilisateur.parametresNotifications = {
      emailActif: true,
      smsActif: true,
      rappelActif: true,
      confirmationActif: true,
      annulationActif: true,
      modificationActif: true,
      rappelAvantHeures: 24
    };
    
    await utilisateur.save();
  }
  
  res.status(200).json({
    succes: true,
    message: 'Paramètres de notification récupérés avec succès',
    donnees: {
      parametres: utilisateur.parametresNotifications
    }
  });
});

/**
 * Mettre à jour les paramètres de notification de l'utilisateur
 * PUT /api/parametres/notifications
 * Accès: Utilisateur authentifié
 */
exports.mettreAJourParametresNotifications = asyncHandler(async (req, res) => {
  const {
    emailActif,
    smsActif,
    rappelActif,
    confirmationActif,
    annulationActif,
    modificationActif,
    rappelAvantHeures
  } = req.body;
  
  // Mettre à jour les paramètres de notification
  const utilisateur = await Utilisateur.findByIdAndUpdate(
    req.user.id,
    {
      $set: {
        'parametresNotifications.emailActif': emailActif,
        'parametresNotifications.smsActif': smsActif,
        'parametresNotifications.rappelActif': rappelActif,
        'parametresNotifications.confirmationActif': confirmationActif,
        'parametresNotifications.annulationActif': annulationActif,
        'parametresNotifications.modificationActif': modificationActif,
        'parametresNotifications.rappelAvantHeures': rappelAvantHeures,
        dateMiseAJour: Date.now()
      }
    },
    { new: true, runValidators: true }
  ).select('+parametresNotifications');
  
  res.status(200).json({
    succes: true,
    message: 'Paramètres de notification mis à jour avec succès',
    donnees: {
      parametres: utilisateur.parametresNotifications
    }
  });
});
