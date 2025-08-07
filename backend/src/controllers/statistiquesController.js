const RendezVous = require('../models/RendezVous');
const Utilisateur = require('../models/Utilisateur');
const asyncHandler = require('express-async-handler');
const moment = require('moment');

// Obtenir les statistiques générales
exports.obtenirStatistiquesGenerales = asyncHandler(async (req, res) => {
  const { dateDebut, dateFin } = req.query;
  
  // Définir la plage de dates (par défaut: 30 derniers jours)
  const debut = dateDebut 
    ? new Date(dateDebut) 
    : moment().subtract(30, 'days').toDate();
    
  const fin = dateFin 
    ? new Date(dateFin) 
    : new Date();
  
  // Filtrer par utilisateur si nécessaire
  const filtreUtilisateur = {};
  
  if (req.user.role === 'medecin') {
    filtreUtilisateur.medecin = req.user.id;
  } else if (req.user.role === 'patient') {
    filtreUtilisateur.patient = req.user.id;
  }
  
  // Requêtes en parallèle pour optimiser les performances
  const [
    totalRendezVous,
    rendezVousConfirme,
    rendezVousTermine,
    rendezVousAnnule,
    moyenneDuree,
    tauxPonctualite,
    repartitionParJour,
    repartitionParType,
    repartitionParStatut,
    medecinsActifs,
    patientsFrequents
  ] = await Promise.all([
    // Nombre total de rendez-vous
    RendezVous.countDocuments({
      ...filtreUtilisateur,
      dateDebut: { $gte: debut, $lte: fin }
    }),
    
    // Nombre de rendez-vous confirmés
    RendezVous.countDocuments({
      ...filtreUtilisateur,
      statut: 'confirme',
      dateDebut: { $gte: debut, $lte: fin }
    }),
    
    // Nombre de rendez-vous terminés
    RendezVous.countDocuments({
      ...filtreUtilisateur,
      statut: 'termine',
      dateDebut: { $gte: debut, $lte: fin }
    }),
    
    // Nombre de rendez-vous annulés
    RendezVous.countDocuments({
      ...filtreUtilisateur,
      statut: 'annule',
      dateDebut: { $gte: debut, $lte: fin }
    }),
    
    // Durée moyenne des rendez-vous terminés
    RendezVous.aggregate([
      {
        $match: {
          ...filtreUtilisateur,
          statut: 'termine',
          dateDebut: { $gte: debut, $lte: fin },
          dureeReelleMinutes: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          moyenne: { $avg: '$dureeReelleMinutes' },
          total: { $sum: 1 }
        }
      }
    ]),
    
    // Taux de ponctualité (rendez-vous commencés à l'heure ou en avance)
    RendezVous.aggregate([
      {
        $match: {
          ...filtreUtilisateur,
          statut: { $in: ['termine', 'en_cours'] },
          dateDebut: { $gte: debut, $lte: fin },
          heureDebut: { $exists: true }
        }
      },
      {
        $project: {
          estPonctuel: {
            $lte: [
              { $subtract: ['$heureDebut', '$dateDebut'] },
              5 * 60 * 1000 // 5 minutes de tolérance
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          ponctuels: {
            $sum: { $cond: ['$estPonctuel', 1, 0] }
          }
        }
      }
    ]),
    
    // Répartition des rendez-vous par jour de la semaine
    RendezVous.aggregate([
      {
        $match: {
          ...filtreUtilisateur,
          dateDebut: { $gte: debut, $lte: fin }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$dateDebut' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Répartition des rendez-vous par type
    RendezVous.aggregate([
      {
        $match: {
          ...filtreUtilisateur,
          dateDebut: { $gte: debut, $lte: fin },
          type: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    
    // Répartition des rendez-vous par statut
    RendezVous.aggregate([
      {
        $match: {
          ...filtreUtilisateur,
          dateDebut: { $gte: debut, $lte: fin }
        }
      },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    
    // Médecins les plus actifs (nombre de rendez-vous)
    RendezVous.aggregate([
      {
        $match: {
          ...filtreUtilisateur,
          dateDebut: { $gte: debut, $lte: fin }
        }
      },
      {
        $lookup: {
          from: 'utilisateurs',
          localField: 'medecin',
          foreignField: '_id',
          as: 'medecinInfo'
        }
      },
      { $unwind: '$medecinInfo' },
      {
        $group: {
          _id: '$medecin',
          nom: { $first: { $concat: ['$medecinInfo.prenom', ' ', '$medecinInfo.nom'] } },
          specialite: { $first: '$medecinInfo.specialite' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    
    // Patients les plus fréquents
    RendezVous.aggregate([
      {
        $match: {
          ...filtreUtilisateur,
          dateDebut: { $gte: debut, $lte: fin }
        }
      },
      {
        $lookup: {
          from: 'utilisateurs',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientInfo'
        }
      },
      { $unwind: '$patientInfo' },
      {
        $group: {
          _id: '$patient',
          nom: { $first: { $concat: ['$patientInfo.prenom', ' ', '$patientInfo.nom'] } },
          telephone: { $first: '$patientInfo.telephone' },
          count: { $sum: 1 },
          dernierRendezVous: { $max: '$dateDebut' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);
  
  // Traiter les résultats des agrégations
  const resultatMoyenneDuree = moyenneDuree[0] || { moyenne: 0, total: 0 };
  const resultatTauxPonctualite = tauxPonctualite[0] || { total: 0, ponctuels: 0 };
  
  // Formater la réponse
  const statistiques = {
    periode: {
      debut: debut,
      fin: fin,
      dureeJours: moment(fin).diff(moment(debut), 'days') + 1
    },
    resume: {
      totalRendezVous,
      rendezVousConfirme,
      rendezVousTermine,
      rendezVousAnnule,
      moyenneDureeMinutes: Math.round(resultatMoyenneDuree.moyenne || 0),
      tauxPonctualite: resultatTauxPonctualite.total > 0 
        ? Math.round((resultatTauxPonctualite.ponctuels / resultatTauxPonctualite.total) * 100) 
        : 0
    },
    repartitionParJour: repartitionParJour.map(item => ({
      jour: item._id,
      nomJour: moment().day(item._id - 1).format('dddd'),
      count: item.count
    })),
    repartitionParType: repartitionParType,
    repartitionParStatut: repartitionParStatut,
    medecinsActifs: medecinsActifs,
    patientsFrequents: patientsFrequents.map(patient => ({
      ...patient,
      dernierRendezVous: patient.dernierRendezVous,
      dernierRendezVousFormat: moment(patient.dernierRendezVous).format('DD/MM/YYYY HH:mm')
    })),
    metriquesAvancees: {
      // À implémenter selon les besoins spécifiques
    }
  };
  
  res.status(200).json({
    succes: true,
    message: 'Statistiques récupérées avec succès',
    donnees: statistiques
  });
});

// Obtenir les statistiques d'un médecin spécifique
exports.obtenirStatistiquesMedecin = asyncHandler(async (req, res) => {
  const { medecinId } = req.params;
  const { dateDebut, dateFin } = req.query;
  
  // Vérifier que l'utilisateur a le droit d'accéder à ces statistiques
  if (req.user.role === 'patient' || 
      (req.user.role === 'medecin' && req.user.id !== medecinId)) {
    return res.status(403).json({
      succes: false,
      message: 'Accès non autorisé à ces statistiques',
      erreurs: [
        { champ: 'autorisation', message: 'Vous n\'êtes pas autorisé à accéder à ces données' }
      ]
    });
  }
  
  // Vérifier que le médecin existe
  const medecin = await Utilisateur.findOne({
    _id: medecinId,
    role: 'medecin',
    actif: true
  }).select('prenom nom specialite');
  
  if (!medecin) {
    return res.status(404).json({
      succes: false,
      message: 'Ressource non trouvée',
      erreurs: [
        { champ: 'medecinId', message: 'Médecin non trouvé ou inactif' }
      ]
    });
  }
  
  // Définir la plage de dates (par défaut: 30 derniers jours)
  const debut = dateDebut 
    ? new Date(dateDebut) 
    : moment().subtract(30, 'days').toDate();
    
  const fin = dateFin 
    ? new Date(dateFin) 
    : new Date();
  
  // Requêtes en parallèle pour optimiser les performances
  const [
    totalRendezVous,
    rendezVousTermine,
    moyenneDuree,
    tauxPonctualite,
    repartitionParJour,
    repartitionParType,
    repartitionParStatut,
    patientsFrequents,
    disponibiliteMoyenne
  ] = await Promise.all([
    // Nombre total de rendez-vous
    RendezVous.countDocuments({
      medecin: medecinId,
      dateDebut: { $gte: debut, $lte: fin }
    }),
    
    // Nombre de rendez-vous terminés
    RendezVous.countDocuments({
      medecin: medecinId,
      statut: 'termine',
      dateDebut: { $gte: debut, $lte: fin }
    }),
    
    // Durée moyenne des rendez-vous terminés
    RendezVous.aggregate([
      {
        $match: {
          medecin: medecinId,
          statut: 'termine',
          dateDebut: { $gte: debut, $lte: fin },
          dureeReelleMinutes: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          moyenne: { $avg: '$dureeReelleMinutes' },
          total: { $sum: 1 }
        }
      }
    ]),
    
    // Taux de ponctualité
    RendezVous.aggregate([
      {
        $match: {
          medecin: medecinId,
          statut: { $in: ['termine', 'en_cours'] },
          dateDebut: { $gte: debut, $lte: fin },
          heureDebut: { $exists: true }
        }
      },
      {
        $project: {
          estPonctuel: {
            $lte: [
              { $subtract: ['$heureDebut', '$dateDebut'] },
              5 * 60 * 1000 // 5 minutes de tolérance
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          ponctuels: {
            $sum: { $cond: ['$estPonctuel', 1, 0] }
          }
        }
      }
    ]),
    
    // Répartition par jour de la semaine
    RendezVous.aggregate([
      {
        $match: {
          medecin: medecinId,
          dateDebut: { $gte: debut, $lte: fin }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$dateDebut' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Répartition par type de rendez-vous
    RendezVous.aggregate([
      {
        $match: {
          medecin: medecinId,
          dateDebut: { $gte: debut, $lte: fin },
          type: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    
    // Répartition par statut
    RendezVous.aggregate([
      {
        $match: {
          medecin: medecinId,
          dateDebut: { $gte: debut, $lte: fin }
        }
      },
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    
    // Patients les plus fréquents
    RendezVous.aggregate([
      {
        $match: {
          medecin: medecinId,
          dateDebut: { $gte: debut, $lte: fin }
        }
      },
      {
        $lookup: {
          from: 'utilisateurs',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientInfo'
        }
      },
      { $unwind: '$patientInfo' },
      {
        $group: {
          _id: '$patient',
          nom: { $first: { $concat: ['$patientInfo.prenom', ' ', '$patientInfo.nom'] } },
          telephone: { $first: '$patientInfo.telephone' },
          count: { $sum: 1 },
          dernierRendezVous: { $max: '$dateDebut' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    
    // Taux de disponibilité moyen
    RendezVous.aggregate([
      {
        $match: {
          medecin: medecinId,
          dateDebut: { $gte: debut, $lte: fin },
          statut: 'termine'
        }
      },
      {
        $group: {
          _id: null,
          totalDureePlanifiee: {
            $sum: {
              $divide: [
                { $subtract: ['$dateFin', '$dateDebut'] },
                1000 * 60 // Convertir en minutes
              ]
            }
          },
          totalDureeReelle: { $sum: '$dureeReelleMinutes' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);
  
  // Traiter les résultats des agrégations
  const resultatMoyenneDuree = moyenneDuree[0] || { moyenne: 0, total: 0 };
  const resultatTauxPonctualite = tauxPonctualite[0] || { total: 0, ponctuels: 0 };
  const resultatDisponibilite = disponibiliteMoyenne[0] || { 
    totalDureePlanifiee: 0, 
    totalDureeReelle: 0, 
    count: 0 
  };
  
  // Calculer le taux de disponibilité
  const tauxDisponibilite = resultatDisponibilite.totalDureePlanifiee > 0
    ? (resultatDisponibilite.totalDureeReelle / resultatDisponibilite.totalDureePlanifiee) * 100
    : 0;
  
  // Formater la réponse
  const statistiques = {
    medecin: {
      id: medecin._id,
      nomComplet: `${medecin.prenom} ${medecin.nom}`,
      specialite: medecin.specialite
    },
    periode: {
      debut: debut,
      fin: fin,
      dureeJours: moment(fin).diff(moment(debut), 'days') + 1
    },
    resume: {
      totalRendezVous,
      rendezVousTermine,
      moyenneDureeMinutes: Math.round(resultatMoyenneDuree.moyenne || 0),
      tauxPonctualite: resultatTauxPonctualite.total > 0 
        ? Math.round((resultatTauxPonctualite.ponctuels / resultatTauxPonctualite.total) * 100) 
        : 0,
      tauxDisponibilite: Math.round(tauxDisponibilite)
    },
    repartitionParJour: repartitionParJour.map(item => ({
      jour: item._id,
      nomJour: moment().day(item._id - 1).format('dddd'),
      count: item.count
    })),
    repartitionParType: repartitionParType,
    repartitionParStatut: repartitionParStatut,
    patientsFrequents: patientsFrequents.map(patient => ({
      ...patient,
      dernierRendezVous: patient.dernierRendezVous,
      dernierRendezVousFormat: moment(patient.dernierRendezVous).format('DD/MM/YYYY HH:mm')
    }))
  };
  
  res.status(200).json({
    succes: true,
    message: 'Statistiques du médecin récupérées avec succès',
    donnees: statistiques
  });
});

// Exporter d'autres fonctions de statistiques selon les besoins
// Par exemple : statistiques par patient, par période, etc.
