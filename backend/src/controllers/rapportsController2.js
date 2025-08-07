const RendezVous = require('../models/RendezVous');
const Utilisateur = require('../models/Utilisateur');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Obtenir les statistiques de performance des médecins
 * GET /api/rapports/performance-medecins
 * Accès: Admin
 */
exports.obtenirPerformanceMedecins = asyncHandler(async (req, res) => {
  const { dateDebut, dateFin } = req.query;
  
  // Valider les dates
  const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().setMonth(new Date().getMonth() - 3));
  const fin = dateFin ? new Date(dateFin) : new Date();
  
  // Agrégation pour obtenir les statistiques de performance des médecins
  const performanceMedecins = await RendezVous.aggregate([
    // Filtrer par date et statut
    {
      $match: {
        dateDebut: { $gte: debut, $lte: fin },
        statut: { $in: ['termine', 'confirme', 'annule'] },
        medecin: { $exists: true, $ne: null }
      }
    },
    // Joindre les informations du médecin
    {
      $lookup: {
        from: 'utilisateurs',
        localField: 'medecin',
        foreignField: '_id',
        as: 'medecinInfo'
      }
    },
    { $unwind: '$medecinInfo' },
    // Grouper par médecin
    {
      $group: {
        _id: '$medecin',
        medecin: { $first: '$medecinInfo' },
        totalRdv: { $sum: 1 },
        rdvTermines: {
          $sum: {
            $cond: [{ $eq: ['$statut', 'termine'] }, 1, 0]
          }
        },
        rdvConfirmes: {
          $sum: {
            $cond: [{ $eq: ['$statut', 'confirme'] }, 1, 0]
          }
        },
        rdvAnnules: {
          $sum: {
            $cond: [{ $eq: ['$statut', 'annule'] }, 1, 0]
          }
        },
        dureeTotaleMinutes: {
          $sum: {
            $cond: [
              { $in: ['$statut', ['termine', 'confirme']] },
              { $divide: [{ $subtract: ['$dateFin', '$dateDebut'] }, 1000 * 60] },
              0
            ]
          }
        },
        nombrePatientsUniques: { $addToSet: '$patient' },
        // Statistiques de retard
        retards: {
          $sum: {
            $cond: [
              { $and: [
                { $gt: ['$retard.minutes', 0] },
                { $in: ['$statut', ['termine', 'confirme']] }
              ]},
              1,
              0
            ]
          }
        },
        dureeTotaleRetardMinutes: {
          $sum: {
            $cond: [
              { $and: [
                { $gt: ['$retard.minutes', 0] },
                { $in: ['$statut', ['termine', 'confirme']] }
              ]},
              '$retard.minutes',
              0
            ]
          }
        }
      }
    },
    // Calculer les indicateurs de performance
    {
      $addFields: {
        tauxFrequentation: {
          $multiply: [
            {
              $cond: [
                { $eq: ['$totalRdv', 0] },
                0,
                { $divide: [
                  { $subtract: ['$totalRdv', '$rdvAnnules'] },
                  '$totalRdv'
                ] }
              ]
            },
            100
          ]
        },
        dureeMoyenneRdv: {
          $cond: [
            { $eq: [
              { $add: ['$rdvTermines', '$rdvConfirmes'] },
              0
            ]},
            0,
            { $divide: [
              '$dureeTotaleMinutes',
              { $add: ['$rdvTermines', '$rdvConfirmes'] }
            ]}
          ]
        },
        tauxRetard: {
          $multiply: [
            {
              $cond: [
                { $eq: [
                  { $add: ['$rdvTermines', '$rdvConfirmes'] },
                  0
                ]},
                0,
                { $divide: [
                  '$retards',
                  { $add: ['$rdvTermines', '$rdvConfirmes'] }
                ]}
              ]
            },
            100
          ]
        },
        dureeMoyenneRetard: {
          $cond: [
            { $eq: ['$retards', 0] },
            0,
            { $divide: ['$dureeTotaleRetardMinutes', '$retards'] }
          ]
        },
        nombrePatientsUniques: { $size: '$nombrePatientsUniques' }
      }
    },
    // Trier par taux de fréquentation décroissant
    { $sort: { tauxFrequentation: -1 } }
  ]);
  
  // Formater la réponse
  const resultats = performanceMedecins.map(med => ({
    medecin: {
      id: med.medecin._id,
      nom: med.medecin.nom,
      prenom: med.medecin.prenom,
      specialite: med.medecin.specialite
    },
    statistiques: {
      totalRdv: med.totalRdv,
      rdvTermines: med.rdvTermines,
      rdvConfirmes: med.rdvConfirmes,
      rdvAnnules: med.rdvAnnules,
      nombrePatientsUniques: med.nombrePatientsUniques,
      dureeTotaleMinutes: Math.round(med.dureeTotaleMinutes),
      dureeMoyenneMinutes: Math.round(med.dureeMoyenneRdv * 10) / 10,
      retards: {
        total: med.retards,
        dureeMoyenneMinutes: Math.round(med.dureeMoyenneRetard * 10) / 10,
        pourcentage: Math.round(med.tauxRetard * 10) / 10
      },
      tauxFrequentation: Math.round(med.tauxFrequentation * 10) / 10
    }
  }));
  
  // Calculer les moyennes globales
  const nbMedecins = performanceMedecins.length;
  const moyennes = nbMedecins > 0 ? {
    tauxFrequentation: performanceMedecins.reduce((acc, curr) => acc + curr.tauxFrequentation, 0) / nbMedecins,
    dureeMoyenneRdv: performanceMedecins.reduce((acc, curr) => acc + curr.dureeMoyenneRdv, 0) / nbMedecins,
    tauxRetard: performanceMedecins.reduce((acc, curr) => acc + curr.tauxRetard, 0) / nbMedecins,
    dureeMoyenneRetard: performanceMedecins.reduce((acc, curr) => acc + (curr.retards > 0 ? curr.dureeMoyenneRetard : 0), 0) / 
      performanceMedecins.filter(m => m.retards > 0).length || 0
  } : null;
  
  res.status(200).json({
    succes: true,
    message: 'Statistiques de performance des médecins récupérées avec succès',
    donnees: {
      dateDebut: debut,
      dateFin: fin,
      resultats,
      moyennes: moyennes ? {
        tauxFrequentation: Math.round(moyennes.tauxFrequentation * 10) / 10,
        dureeMoyenneMinutes: Math.round(moyennes.dureeMoyenneRdv * 10) / 10,
        tauxRetard: Math.round(moyennes.tauxRetard * 10) / 10,
        dureeMoyenneRetard: Math.round(moyennes.dureeMoyenneRetard * 10) / 10
      } : null
    }
  });
});

/**
 * Obtenir les statistiques de satisfaction des patients
 * GET /api/rapports/satisfaction
 * Accès: Admin
 */
exports.obtenirSatisfactionPatients = asyncHandler(async (req, res) => {
  const { dateDebut, dateFin, medecinId } = req.query;
  
  // Valider les dates
  const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const fin = dateFin ? new Date(dateFin) : new Date();
  
  // Construire le filtre de base
  const match = {
    'avis.dateAvis': { $gte: debut, $lte: fin },
    'avis.note': { $exists: true, $ne: null }
  };
  
  // Ajouter le filtre par médecin si spécifié
  if (medecinId) {
    match.medecin = medecinId;
  }
  
  // Agrégation pour obtenir les statistiques de satisfaction
  const statistiques = await RendezVous.aggregate([
    // Filtrer les rendez-vous avec avis
    { $match: match },
    // Dérouler les avis
    { $unwind: '$avis' },
    // Filtrer à nouveau après le déroulement
    { $match: { 'avis.note': { $exists: true, $ne: null } } },
    // Joindre les informations du médecin
    {
      $lookup: {
        from: 'utilisateurs',
        localField: 'medecin',
        foreignField: '_id',
        as: 'medecinInfo'
      }
    },
    { $unwind: '$medecinInfo' },
    // Grouper par médecin et par note
    {
      $group: {
        _id: {
          medecinId: '$medecin',
          medecinNom: '$medecinInfo.nom',
          medecinPrenom: '$medecinInfo.prenom',
          note: '$avis.note'
        },
        count: { $sum: 1 },
        commentaires: {
          $push: {
            $cond: [
              { $and: [
                { $ne: ['$avis.commentaire', ''] },
                { $ne: ['$avis.commentaire', null] }
              ]},
              '$avis.commentaire',
              '$$REMOVE'
            ]
          }
        }
      }
    },
    // Grouper par médecin pour calculer les totaux
    {
      $group: {
        _id: {
          medecinId: '$_id.medecinId',
          medecinNom: '$_id.medecinNom',
          medecinPrenom: '$_id.medecinPrenom'
        },
        notes: {
          $push: {
            note: '$_id.note',
            count: '$count',
            commentaires: {
              $filter: {
                input: '$commentaires',
                as: 'commentaire',
                cond: { $ne: ['$$commentaire', null] }
              }
            }
          }
        },
        totalAvis: { $sum: '$count' },
        sommeNotes: {
          $sum: { $multiply: ['$_id.note', '$count'] }
        }
      }
    },
    // Calculer la note moyenne
    {
      $addFields: {
        noteMoyenne: {
          $round: [
            { $divide: ['$sommeNotes', '$totalAvis'] },
            1
          ]
        }
      }
    },
    // Trier par note moyenne décroissante
    { $sort: { noteMoyenne: -1 } }
  ]);
  
  // Formater la réponse
  const resultats = statistiques.map(med => ({
    medecin: {
      id: med._id.medecinId,
      nom: med._id.medecinNom,
      prenom: med._id.medecinPrenom
    },
    statistiques: {
      totalAvis: med.totalAvis,
      noteMoyenne: med.noteMoyenne,
      repartitionNotes: med.notes.map(n => ({
        note: n.note,
        count: n.count,
        pourcentage: Math.round((n.count / med.totalAvis) * 1000) / 10
      })).sort((a, b) => b.note - a.note),
      commentaires: med.notes
        .flatMap(n => n.commentaires)
        .filter(c => c && c.trim() !== '')
    }
  }));
  
  // Obtenir la liste des médecins pour le filtre
  const medecins = await Utilisateur.find({ 
    role: 'medecin', 
    statut: 'actif'
  })
  .select('prenom nom specialite')
  .sort({ nom: 1, prenom: 1 })
  .lean();
  
  // Calculer les moyennes globales
  const nbMedecinsAvecAvis = resultats.length;
  const moyennes = nbMedecinsAvecAvis > 0 ? {
    noteMoyenneGlobale: 
      Math.round((resultats.reduce((acc, curr) => acc + curr.statistiques.noteMoyenne, 0) / nbMedecinsAvecAvis) * 10) / 10,
    totalAvis: resultats.reduce((acc, curr) => acc + curr.statistiques.totalAvis, 0)
  } : null;
  
  res.status(200).json({
    succes: true,
    message: 'Statistiques de satisfaction des patients récupérées avec succès',
    donnees: {
      dateDebut: debut,
      dateFin: fin,
      medecin: medecinId ? medecins.find(m => m._id.toString() === medecinId) : null,
      medecins,
      resultats,
      moyennes
    }
  });
});

// Exporter la fonction utilitaire pour pouvoir l'utiliser dans d'autres fichiers
module.exports.buildGroupByFields = require('./rapportsController').buildGroupByFields;
