"use strict";const RendezVous = require('../models/RendezVous');
const Utilisateur = require('../models/Utilisateur');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');
const { buildGroupByFields } = require('./rapportsController');

/**
 * Générer un rapport personnalisé - Partie 1/2
 * POST /api/rapports/personnalise
 * Accès: Admin
 */
exports.genererRapportPersonnalise = asyncHandler(async (req, res) => {
  const {
    typeRapport,
    dateDebut,
    dateFin,
    groupBy = 'month',
    filtres = {},
    colonnes = []
  } = req.body;

  // Valider le type de rapport
  const typesRapportValides = [
  'rendez-vous',
  'patients',
  'medecins',
  'financier',
  'satisfaction',
  'performance'];


  if (!typesRapportValides.includes(typeRapport)) {
    return res.status(400).json({
      succes: false,
      message: 'Type de rapport non valide',
      erreurs: [
      {
        champ: 'typeRapport',
        message: `Le type de rapport doit être l'un des suivants: ${typesRapportValides.join(', ')}`
      }]

    });
  }

  // Valider les dates
  const debut = dateDebut ? new Date(dateDebut) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const fin = dateFin ? new Date(dateFin) : new Date();

  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    return res.status(400).json({
      succes: false,
      message: 'Format de date invalide',
      erreurs: [
      { champ: 'dateDebut', message: 'Format de date invalide (utilisez YYYY-MM-DD)' },
      { champ: 'dateFin', message: 'Format de date invalide (utilisez YYYY-MM-DD)' }]

    });
  }

  // Valider le groupBy
  const groupByValides = ['day', 'week', 'month', 'year', 'medecin', 'patient', 'type'];
  const groupByValide = groupByValides.includes(groupBy) ? groupBy : 'month';

  // Construire la requête de base en fonction du type de rapport
  let pipeline = [];

  switch (typeRapport) {
    case 'rendez-vous':
      // Pipeline pour le rapport des rendez-vous
      pipeline = buildRapportRendezVous(debut, fin, groupByValide, filtres, colonnes);
      break;

    case 'patients':
      // Pipeline pour le rapport des patients
      pipeline = buildRapportPatients(debut, fin, groupByValide, filtres, colonnes);
      break;

    case 'medecins':
      // Pipeline pour le rapport des médecins
      pipeline = buildRapportMedecins(debut, fin, groupByValide, filtres, colonnes);
      break;

    default:
      return res.status(400).json({
        succes: false,
        message: 'Type de rapport non implémenté',
        erreurs: [
        {
          champ: 'typeRapport',
          message: `Le type de rapport "${typeRapport}" n'est pas encore implémenté`
        }]

      });
  }

  try {
    // Exécuter la requête d'agrégation
    const resultats = await RendezVous.aggregate(pipeline);

    // Formater la réponse
    res.status(200).json({
      succes: true,
      message: 'Rapport généré avec succès',
      donnees: {
        typeRapport,
        dateDebut: debut,
        dateFin: fin,
        groupBy: groupByValide,
        nbResultats: resultats.length,
        resultats
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la génération du rapport personnalisé:', error);

    res.status(500).json({
      succes: false,
      message: 'Une erreur est survenue lors de la génération du rapport',
      erreur: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Construire le pipeline pour le rapport des rendez-vous
 * @param {Date} debut - Date de début
 * @param {Date} fin - Date de fin
 * @param {string} groupBy - Type de regroupement
 * @param {Object} filtres - Filtres supplémentaires
 * @param {Array} colonnes - Colonnes à inclure
 * @returns {Array} - Pipeline d'agrégation
 */
function buildRapportRendezVous(debut, fin, groupBy, filtres = {}, colonnes = []) {
  return [
  // Filtrer par date
  {
    $match: {
      dateDebut: { $gte: debut, $lte: fin },
      ...filtres
    }
  },
  // Joindre les informations du médecin et du patient
  {
    $lookup: {
      from: 'utilisateurs',
      localField: 'medecin',
      foreignField: '_id',
      as: 'medecinInfo'
    }
  },
  { $unwind: { path: '$medecinInfo', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'utilisateurs',
      localField: 'patient',
      foreignField: '_id',
      as: 'patientInfo'
    }
  },
  { $unwind: { path: '$patientInfo', preserveNullAndEmptyArrays: true } },
  // Grouper selon les critères demandés
  {
    $group: {
      _id: buildGroupByFields(groupBy, '$dateDebut'),
      count: { $sum: 1 },
      dureeTotale: {
        $sum: { $subtract: ['$dateFin', '$dateDebut'] }
      },
      // Autres statistiques à agréger
      statuts: { $push: '$statut' },
      types: { $push: '$type' },
      medecins: { $addToSet: '$medecinInfo._id' },
      patients: { $addToSet: '$patientInfo._id' },
      // Pour les statistiques financières
      montantTotal: { $sum: '$montant' },
      montantPaye: {
        $sum: {
          $cond: [{ $eq: ['$statutPaiement', 'paye'] }, '$montant', 0]
        }
      },
      // Pour les retards
      retards: {
        $sum: {
          $cond: [
          { $and: [
            { $gt: ['$retard.minutes', 0] },
            { $in: ['$statut', ['termine', 'confirme']] }]
          },
          1,
          0]

        }
      },
      dureeTotaleRetard: {
        $sum: {
          $cond: [
          { $and: [
            { $gt: ['$retard.minutes', 0] },
            { $in: ['$statut', ['termine', 'confirme']] }]
          },
          '$retard.minutes',
          0]

        }
      },
      // Pour les notes de satisfaction
      notesSatisfaction: {
        $push: {
          $cond: [
          { $and: [
            { $gt: ['$avis.note', 0] },
            { $ne: ['$avis.note', null] }]
          },
          '$avis.note',
          '$$REMOVE']

        }
      },
      commentairesSatisfaction: {
        $push: {
          $cond: [
          { $and: [
            { $ne: ['$avis.commentaire', ''] },
            { $ne: ['$avis.commentaire', null] }]
          },
          '$avis.commentaire',
          '$$REMOVE']

        }
      }
    }
  },
  // Calculer les indicateurs dérivés
  {
    $addFields: {
      dureeMoyenne: {
        $cond: [
        { $eq: ['$count', 0] },
        0,
        { $divide: ['$dureeTotale', '$count'] }]

      },
      tauxRetard: {
        $cond: [
        { $eq: ['$count', 0] },
        0,
        { $multiply: [
          { $divide: ['$retards', '$count'] },
          100]
        }]

      },
      dureeMoyenneRetard: {
        $cond: [
        { $eq: ['$retards', 0] },
        0,
        { $divide: ['$dureeTotaleRetard', '$retards'] }]

      },
      noteMoyenneSatisfaction: {
        $cond: [
        { $eq: [{ $size: '$notesSatisfaction' }, 0] },
        null,
        { $avg: '$notesSatisfaction' }]

      },
      nbPatientsUniques: { $size: '$patients' },
      nbMedecinsUniques: { $size: '$medecins' },
      tauxPaiement: {
        $cond: [
        { $eq: ['$montantTotal', 0] },
        0,
        { $multiply: [
          { $divide: ['$montantPaye', '$montantTotal'] },
          100]
        }]

      }
    }
  },
  // Trier par la période
  { $sort: { '_id.annee': 1, '_id.mois': 1, '_id.semaine': 1, '_id.date': 1 } },
  // Projeter les champs finaux
  {
    $project: {
      _id: 0,
      periode: {
        $switch: {
          branches: [
          { case: { $ne: ['$_id.date', undefined] }, then: '$_id.date' },
          {
            case: { $and: [
              { $ne: ['$_id.semaine', undefined] },
              { $ne: ['$_id.annee', undefined] }]
            },
            then: { $concat: [
              'S',
              { $substr: [{ $toString: '$_id.semaine' }, 0, -1] },
              ' ',
              { $toString: '$_id.annee' }]
            }
          },
          {
            case: { $and: [
              { $ne: ['$_id.mois', undefined] },
              { $ne: ['$_id.annee', undefined] }]
            },
            then: { $dateToString: {
                format: '%Y-%m',
                date: {
                  $dateFromParts: {
                    year: '$_id.annee',
                    month: '$_id.mois',
                    day: 1
                  }
                }
              } }
          },
          {
            case: { $ne: ['$_id.annee', undefined] },
            then: { $toString: '$_id.annee' }
          },
          {
            case: { $ne: ['$_id.medecin', undefined] },
            then: 'Médecin: ' + { $toString: '$_id.medecin' }
          },
          {
            case: { $ne: ['$_id.patient', undefined] },
            then: 'Patient: ' + { $toString: '$_id.patient' }
          },
          {
            case: { $ne: ['$_id.type', undefined] },
            then: 'Type: ' + '$_id.type'
          }],

          default: 'Non spécifié'
        }
      },
      // Inclure dynamiquement les colonnes demandées
      ...(colonnes.includes('nbRendezVous') && { nbRendezVous: 1 }),
      ...(colonnes.includes('dureeTotale') && { dureeTotale: 1 }),
      ...(colonnes.includes('dureeMoyenne') && { dureeMoyenne: 1 }),
      ...(colonnes.includes('nbRetards') && { nbRetards: 1 }),
      ...(colonnes.includes('tauxRetard') && { tauxRetard: 1 }),
      ...(colonnes.includes('dureeMoyenneRetard') && { dureeMoyenneRetard: 1 }),
      ...(colonnes.includes('noteMoyenneSatisfaction') && { noteMoyenneSatisfaction: 1 }),
      ...(colonnes.includes('nbPatientsUniques') && { nbPatientsUniques: 1 }),
      ...(colonnes.includes('nbMedecinsUniques') && { nbMedecinsUniques: 1 }),
      ...(colonnes.includes('montantTotal') && { montantTotal: 1 }),
      ...(colonnes.includes('montantPaye') && { montantPaye: 1 }),
      ...(colonnes.includes('tauxPaiement') && { tauxPaiement: 1 }),
      // Inclure les détails si demandés
      ...(colonnes.includes('details') && {
        statuts: 1,
        types: 1,
        commentairesSatisfaction: {
          $filter: {
            input: '$commentairesSatisfaction',
            as: 'commentaire',
            cond: { $ne: ['$$commentaire', null] }
          }
        }
      })
    }
  }];

}

/**
 * Construire le pipeline pour le rapport des patients
 * @param {Date} debut - Date de début
 * @param {Date} fin - Date de fin
 * @param {string} groupBy - Type de regroupement
 * @param {Object} filtres - Filtres supplémentaires
 * @param {Array} colonnes - Colonnes à inclure
 * @returns {Array} - Pipeline d'agrégation
 */
function buildRapportPatients(debut, fin, groupBy, filtres = {}, colonnes = []) {
  return [
  // Filtrer par date
  {
    $match: {
      dateDebut: { $gte: debut, $lte: fin },
      ...filtres
    }
  },
  // Joindre les informations du patient
  {
    $lookup: {
      from: 'utilisateurs',
      localField: 'patient',
      foreignField: '_id',
      as: 'patientInfo'
    }
  },
  { $unwind: { path: '$patientInfo', preserveNullAndEmptyArrays: true } },
  // Grouper par patient
  {
    $group: {
      _id: '$patient',
      patient: { $first: '$patientInfo' },
      nbRendezVous: { $sum: 1 },
      montantTotal: { $sum: '$montant' },
      montantPaye: {
        $sum: {
          $cond: [{ $eq: ['$statutPaiement', 'paye'] }, '$montant', 0]
        }
      },
      premierRendezVous: { $min: '$dateDebut' },
      dernierRendezVous: { $max: '$dateDebut' },
      statuts: { $push: '$statut' },
      types: { $push: '$type' },
      medecins: { $addToSet: '$medecin' },
      notesSatisfaction: {
        $push: {
          $cond: [
          { $and: [
            { $gt: ['$avis.note', 0] },
            { $ne: ['$avis.note', null] }]
          },
          '$avis.note',
          '$$REMOVE']

        }
      },
      commentairesSatisfaction: {
        $push: {
          $cond: [
          { $and: [
            { $ne: ['$avis.commentaire', ''] },
            { $ne: ['$avis.commentaire', null] }]
          },
          '$avis.commentaire',
          '$$REMOVE']

        }
      }
    }
  },
  // Calculer les indicateurs dérivés
  {
    $addFields: {
      noteMoyenneSatisfaction: {
        $cond: [
        { $eq: [{ $size: '$notesSatisfaction' }, 0] },
        null,
        { $avg: '$notesSatisfaction' }]

      },
      nbMedecinsUniques: { $size: '$medecins' },
      tauxPaiement: {
        $cond: [
        { $eq: ['$montantTotal', 0] },
        0,
        { $multiply: [
          { $divide: ['$montantPaye', '$montantTotal'] },
          100]
        }]

      },
      frequenceMoyenne: {
        $cond: [
        { $eq: ['$nbRendezVous', 1] },
        null,
        {
          $divide: [
          { $subtract: ['$dernierRendezVous', '$premierRendezVous'] },
          { $multiply: [
            { $subtract: ['$nbRendezVous', 1] },
            24 * 60 * 60 * 1000 // Convertir en jours
            ] }]

        }]

      }
    }
  },
  // Trier par nombre de rendez-vous décroissant
  { $sort: { nbRendezVous: -1 } },
  // Projeter les champs finaux
  {
    $project: {
      _id: 0,
      patient: {
        id: '$patient._id',
        nom: '$patient.nom',
        prenom: '$patient.prenom',
        email: '$patient.email',
        telephone: '$patient.telephone',
        dateNaissance: '$patient.dateNaissance',
        genre: '$patient.genre',
        adresse: '$patient.adresse',
        ville: '$patient.ville',
        codePostal: '$patient.codePostal',
        pays: '$patient.pays',
        dateInscription: '$patient.dateCreation',
        statut: '$patient.statut'
      },
      // Inclure dynamiquement les colonnes demandées
      ...(colonnes.includes('nbRendezVous') && { nbRendezVous: 1 }),
      ...(colonnes.includes('premierRendezVous') && { premierRendezVous: 1 }),
      ...(colonnes.includes('dernierRendezVous') && { dernierRendezVous: 1 }),
      ...(colonnes.includes('frequenceMoyenne') && { frequenceMoyenne: 1 }),
      ...(colonnes.includes('montantTotal') && { montantTotal: 1 }),
      ...(colonnes.includes('montantPaye') && { montantPaye: 1 }),
      ...(colonnes.includes('tauxPaiement') && { tauxPaiement: 1 }),
      ...(colonnes.includes('noteMoyenneSatisfaction') && { noteMoyenneSatisfaction: 1 }),
      ...(colonnes.includes('nbMedecinsUniques') && { nbMedecinsUniques: 1 }),
      // Inclure les détails si demandés
      ...(colonnes.includes('details') && {
        statuts: 1,
        types: 1,
        commentairesSatisfaction: {
          $filter: {
            input: '$commentairesSatisfaction',
            as: 'commentaire',
            cond: { $ne: ['$$commentaire', null] }
          }
        }
      })
    }
  }];

}

// Exporter les fonctions pour les tests
module.exports = {
  ...module.exports,
  buildRapportRendezVous,
  buildRapportPatients
};
//# sourceMappingURL=rapportsController3.js.map