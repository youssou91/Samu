"use strict";const RendezVous = require('../models/RendezVous');
const Utilisateur = require('../models/Utilisateur');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const moment = require('moment');
const logger = require('../config/logger');

/**
 * Obtenir les statistiques d'occupation des médecins
 * GET /api/rapports/occupation-medecins
 * Accès: Admin
 */
exports.obtenirOccupationMedecins = asyncHandler(async (req, res) => {
  const { dateDebut, dateFin, groupBy = 'day' } = req.query;

  // Valider les dates
  const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const fin = dateFin ? new Date(dateFin) : new Date();

  // Valider le groupBy
  const groupesValides = ['day', 'week', 'month', 'year'];
  const groupByValide = groupesValides.includes(groupBy) ? groupBy : 'day';

  // Agrégation pour obtenir l'occupation par médecin
  const occupationParMedecin = await RendezVous.aggregate([
  // Filtrer par date
  {
    $match: {
      dateDebut: { $gte: debut, $lte: fin },
      statut: { $in: ['termine', 'confirme'] }
    }
  },
  // Grouper par médecin et par période
  {
    $group: {
      _id: {
        medecin: '$medecin',
        date: {
          $dateToString: {
            format: {
              day: '%Y-%m-%d',
              week: '%Y-%U',
              month: '%Y-%m',
              year: '%Y'
            }[groupByValide],
            date: '$dateDebut'
          }
        }
      },
      totalDuree: { $sum: { $subtract: ['$dateFin', '$dateDebut'] } },
      nombreRdv: { $sum: 1 }
    }
  },
  // Joindre les informations du médecin
  {
    $lookup: {
      from: 'utilisateurs',
      localField: '_id.medecin',
      foreignField: '_id',
      as: 'medecinInfo'
    }
  },
  { $unwind: '$medecinInfo' },
  // Grouper pour obtenir le total par médecin
  {
    $group: {
      _id: '$_id.medecin',
      medecin: { $first: '$medecinInfo' },
      details: {
        $push: {
          date: '$_id.date',
          totalDuree: '$totalDuree',
          nombreRdv: '$nombreRdv'
        }
      },
      totalDuree: { $sum: '$totalDuree' },
      totalRdv: { $sum: '$nombreRdv' }
    }
  },
  // Trier par durée totale décroissante
  { $sort: { totalDuree: -1 } }]
  );

  // Formater la réponse
  const resultats = occupationParMedecin.map((med) => ({
    medecin: {
      id: med.medecin._id,
      nom: med.medecin.nom,
      prenom: med.medecin.prenom,
      specialite: med.medecin.specialite
    },
    details: med.details,
    statistiques: {
      dureeTotaleMinutes: Math.round(med.totalDuree / (1000 * 60)),
      nombreTotalRdv: med.totalRdv,
      dureeMoyenneMinutes: Math.round(med.totalDuree / (1000 * 60) / med.totalRdv) || 0
    }
  }));

  res.status(200).json({
    succes: true,
    message: 'Statistiques d\'occupation des médecins récupérées avec succès',
    donnees: {
      dateDebut: debut,
      dateFin: fin,
      groupBy: groupByValide,
      resultats
    }
  });
});

/**
 * Obtenir les statistiques de fréquentation des patients
 * GET /api/rapports/frequentation-patients
 * Accès: Admin
 */
exports.obtenirFrequentationPatients = asyncHandler(async (req, res) => {
  const { dateDebut, dateFin, groupBy = 'month' } = req.query;

  // Valider les dates
  const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const fin = dateFin ? new Date(dateFin) : new Date();

  // Valider le groupBy
  const groupesValides = ['day', 'week', 'month', 'year'];
  const groupByValide = groupesValides.includes(groupBy) ? groupBy : 'month';

  // Agrégation pour obtenir la fréquentation des patients
  const frequentation = await RendezVous.aggregate([
  // Filtrer par date et statut
  {
    $match: {
      dateDebut: { $gte: debut, $lte: fin },
      statut: { $in: ['termine', 'confirme'] }
    }
  },
  // Grouper par période
  {
    $group: {
      _id: {
        date: {
          $dateToString: {
            format: {
              day: '%Y-%m-%d',
              week: '%Y-%U',
              month: '%Y-%m',
              year: '%Y'
            }[groupByValide],
            date: '$dateDebut'
          }
        }
      },
      nombrePatients: { $addToSet: '$patient' },
      nombreRdv: { $sum: 1 }
    }
  },
  // Compter le nombre de patients uniques
  {
    $project: {
      date: '$_id.date',
      nombrePatients: { $size: '$nombrePatients' },
      nombreRdv: 1,
      _id: 0
    }
  },
  // Trier par date
  { $sort: { date: 1 } }]
  );

  res.status(200).json({
    succes: true,
    message: 'Statistiques de fréquentation des patients récupérées avec succès',
    donnees: {
      dateDebut: debut,
      dateFin: fin,
      groupBy: groupByValide,
      frequentation
    }
  });
});

/**
 * Obtenir les statistiques de retard et d'annulation
 * GET /api/rapports/retards-annulations
 * Accès: Admin
 */
exports.obtenirStatistiquesRetardsAnnulations = asyncHandler(async (req, res) => {
  const { dateDebut, dateFin, medecinId } = req.query;

  // Valider les dates
  const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const fin = dateFin ? new Date(dateFin) : new Date();

  // Construire le filtre de base
  const match = {
    dateDebut: { $gte: debut, $lte: fin },
    $or: [
    { statut: 'annule' },
    { 'retard.minutes': { $gt: 0 } }]

  };

  // Ajouter le filtre par médecin si spécifié
  if (medecinId) {
    match.medecin = medecinId;
  }

  // Agrégation pour obtenir les statistiques de retard et d'annulation
  const resultats = await RendezVous.aggregate([
  // Filtrer les rendez-vous annulés ou en retard
  { $match: match },
  // Projeter les champs nécessaires
  {
    $project: {
      statut: 1,
      dateDebut: 1,
      dateFin: 1,
      medecin: 1,
      patient: 1,
      motifAnnulation: 1,
      retard: 1,
      // Calculer le mois et l'année pour le regroupement
      mois: { $month: '$dateDebut' },
      annee: { $year: '$dateDebut' },
      // Type d'événement (annulation ou retard)
      typeEvenement: {
        $cond: [
        { $eq: ['$statut', 'annule'] },
        'annulation',
        'retard']

      }
    }
  },
  // Grouper par type d'événement et par mois/année
  {
    $group: {
      _id: {
        typeEvenement: '$typeEvenement',
        mois: '$mois',
        annee: '$annee',
        // Pour les retards, regrouper également par plage de minutes
        plageRetard: {
          $switch: {
            branches: [
            {
              case: { $and: [
                { $eq: ['$typeEvenement', 'retard'] },
                { $lte: ['$retard.minutes', 15] }]
              },
              then: '0-15 min'
            },
            {
              case: { $and: [
                { $eq: ['$typeEvenement', 'retard'] },
                { $lte: ['$retard.minutes', 30] }]
              },
              then: '16-30 min'
            },
            {
              case: { $eq: ['$typeEvenement', 'retard'] },
              then: '30+ min'
            },
            { case: { $eq: ['$typeEvenement', 'annulation'] }, then: null }],

            default: null
          }
        }
      },
      nombre: { $sum: 1 },
      // Pour les annulations, compter les motifs les plus courants
      motifsAnnulation: {
        $addToSet: {
          $cond: [
          { $and: [
            { $ne: ['$motifAnnulation', ''] },
            { $ne: ['$motifAnnulation', null] }]
          },
          '$motifAnnulation',
          '$$REMOVE']

        }
      },
      // Pour les retards, calculer la moyenne des retards
      moyenneRetardMinutes: {
        $avg: {
          $cond: [
          { $eq: ['$typeEvenement', 'retard'] },
          '$retard.minutes',
          '$$REMOVE']

        }
      },
      // Pour les retards, obtenir le retard maximum
      maxRetardMinutes: {
        $max: {
          $cond: [
          { $eq: ['$typeEvenement', 'retard'] },
          '$retard.minutes',
          '$$REMOVE']

        }
      }
    }
  },
  // Trier par année, mois et type d'événement
  {
    $sort: {
      '_id.annee': 1,
      '_id.mois': 1,
      '_id.typeEvenement': 1
    }
  },
  // Regrouper pour formater la réponse
  {
    $group: {
      _id: {
        mois: '$_id.mois',
        annee: '$_id.annee'
      },
      evenements: {
        $push: {
          typeEvenement: '$_id.typeEvenement',
          plageRetard: '$_id.plageRetard',
          nombre: '$nombre',
          moyenneRetardMinutes: { $ifNull: [{ $round: ['$moyenneRetardMinutes', 1] }, null] },
          maxRetardMinutes: '$maxRetardMinutes',
          motifsAnnulation: {
            $cond: [
            { $eq: ['$_id.typeEvenement', 'annulation'] },
            '$motifsAnnulation',
            '$$REMOVE']

          }
        }
      },
      totalEvenements: { $sum: '$nombre' }
    }
  },
  // Trier par année et mois
  {
    $sort: {
      '_id.annee': 1,
      '_id.mois': 1
    }
  },
  // Formater la réponse finale
  {
    $project: {
      _id: 0,
      mois: '$_id.mois',
      annee: '$_id.annee',
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
      evenements: 1,
      totalEvenements: 1
    }
  }]
  );

  // Obtenir la liste des médecins pour le filtre
  const medecins = await Utilisateur.find({ role: 'medecin', statut: 'actif' }).
  select('prenom nom specialite').
  sort({ nom: 1, prenom: 1 }).
  lean();

  res.status(200).json({
    succes: true,
    message: 'Statistiques de retards et annulations récupérées avec succès',
    donnees: {
      dateDebut: debut,
      dateFin: fin,
      medecin: medecinId ? medecins.find((m) => m._id.toString() === medecinId) : null,
      medecins,
      resultats
    }
  });
});

/**
 * Fonction utilitaire pour construire les champs de regroupement
 * @param {string} groupBy - Type de regroupement
 * @param {string} dateField - Champ de date à utiliser
 * @returns {Object} - Objet de regroupement pour l'agrégation
 */
function buildGroupByFields(groupBy, dateField) {
  const groupFields = {};

  switch (groupBy) {
    case 'day':
      groupFields.date = { $dateToString: { format: '%Y-%m-%d', date: dateField } };
      break;
    case 'week':
      groupFields.semaine = { $week: dateField };
      groupFields.annee = { $year: dateField };
      break;
    case 'month':
      groupFields.mois = { $month: dateField };
      groupFields.annee = { $year: dateField };
      break;
    case 'year':
      groupFields.annee = { $year: dateField };
      break;
    case 'medecin':
      groupFields.medecin = '$medecin';
      break;
    case 'patient':
      groupFields.patient = '$patient';
      break;
    case 'type':
      groupFields.type = '$type';
      break;
    default:
      groupFields.mois = { $month: dateField };
      groupFields.annee = { $year: dateField };
  }

  return groupFields;
}
//# sourceMappingURL=rapportsController.js.map