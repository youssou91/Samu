"use strict";const RendezVous = require('../models/RendezVous');
const Utilisateur = require('../models/Utilisateur');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Construire le pipeline pour le rapport des médecins
 * @param {Date} debut - Date de début
 * @param {Date} fin - Date de fin
 * @param {string} groupBy - Type de regroupement
 * @param {Object} filtres - Filtres supplémentaires
 * @param {Array} colonnes - Colonnes à inclure
 * @returns {Array} - Pipeline d'agrégation
 */
function buildRapportMedecins(debut, fin, groupBy, filtres = {}, colonnes = []) {
  return [
  // Filtrer par date et statut
  {
    $match: {
      dateDebut: { $gte: debut, $lte: fin },
      statut: { $in: ['termine', 'confirme', 'annule'] },
      medecin: { $exists: true, $ne: null },
      ...filtres
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
          { $divide: [
            { $subtract: ['$dateFin', '$dateDebut'] },
            60 * 1000 // Convertir en minutes
            ] },
          0]

        }
      },
      nombrePatientsUniques: { $addToSet: '$patient' },
      // Statistiques de retard
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
      dureeTotaleRetardMinutes: {
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
      // Statistiques financières
      montantTotal: { $sum: '$montant' },
      montantPaye: {
        $sum: {
          $cond: [{ $eq: ['$statutPaiement', 'paye'] }, '$montant', 0]
        }
      },
      // Statistiques de satisfaction
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
  // Calculer les indicateurs de performance
  {
    $addFields: {
      // Taux de fréquentation (1 - annulations / total)
      tauxFrequentation: {
        $multiply: [
        {
          $cond: [
          { $eq: ['$totalRdv', 0] },
          0,
          { $divide: [
            { $subtract: ['$totalRdv', '$rdvAnnules'] },
            '$totalRdv']
          }]

        },
        100]

      },
      // Durée moyenne des rendez-vous (en minutes)
      dureeMoyenneRdv: {
        $cond: [
        { $eq: [
          { $add: ['$rdvTermines', '$rdvConfirmes'] },
          0]
        },
        0,
        { $divide: [
          '$dureeTotaleMinutes',
          { $add: ['$rdvTermines', '$rdvConfirmes'] }]
        }]

      },
      // Taux de retard (retards / rdv terminés ou confirmés)
      tauxRetard: {
        $multiply: [
        {
          $cond: [
          { $eq: [
            { $add: ['$rdvTermines', '$rdvConfirmes'] },
            0]
          },
          0,
          { $divide: [
            '$retards',
            { $add: ['$rdvTermines', '$rdvConfirmes'] }]
          }]

        },
        100]

      },
      // Durée moyenne des retards (en minutes)
      dureeMoyenneRetard: {
        $cond: [
        { $eq: ['$retards', 0] },
        0,
        { $divide: ['$dureeTotaleRetardMinutes', '$retards'] }]

      },
      // Note moyenne de satisfaction
      noteMoyenneSatisfaction: {
        $cond: [
        { $eq: [{ $size: '$notesSatisfaction' }, 0] },
        null,
        { $avg: '$notesSatisfaction' }]

      },
      // Nombre de patients uniques
      nbPatientsUniques: { $size: '$nombrePatientsUniques' },
      // Taux de paiement
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
  // Trier par taux de fréquentation décroissant par défaut
  { $sort: { tauxFrequentation: -1 } },
  // Projeter les champs finaux
  {
    $project: {
      _id: 0,
      medecin: {
        id: '$medecin._id',
        nom: '$medecin.nom',
        prenom: '$medecin.prenom',
        specialite: '$medecin.specialite',
        email: '$medecin.email',
        telephone: '$medecin.telephone',
        dateEmbauche: '$medecin.dateEmbauche',
        statut: '$medecin.statut'
      },
      // Inclure dynamiquement les colonnes demandées
      ...(colonnes.includes('totalRdv') && { totalRdv: 1 }),
      ...(colonnes.includes('rdvTermines') && { rdvTermines: 1 }),
      ...(colonnes.includes('rdvConfirmes') && { rdvConfirmes: 1 }),
      ...(colonnes.includes('rdvAnnules') && { rdvAnnules: 1 }),
      ...(colonnes.includes('tauxFrequentation') && { tauxFrequentation: 1 }),
      ...(colonnes.includes('dureeTotaleMinutes') && { dureeTotaleMinutes: 1 }),
      ...(colonnes.includes('dureeMoyenneRdv') && { dureeMoyenneRdv: 1 }),
      ...(colonnes.includes('retards') && { retards: 1 }),
      ...(colonnes.includes('tauxRetard') && { tauxRetard: 1 }),
      ...(colonnes.includes('dureeMoyenneRetard') && { dureeMoyenneRetard: 1 }),
      ...(colonnes.includes('nbPatientsUniques') && { nbPatientsUniques: 1 }),
      ...(colonnes.includes('montantTotal') && { montantTotal: 1 }),
      ...(colonnes.includes('montantPaye') && { montantPaye: 1 }),
      ...(colonnes.includes('tauxPaiement') && { tauxPaiement: 1 }),
      ...(colonnes.includes('noteMoyenneSatisfaction') && { noteMoyenneSatisfaction: 1 }),
      // Inclure les détails si demandés
      ...(colonnes.includes('details') && {
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
 * Exporter un rapport au format CSV ou Excel
 * POST /api/rapports/export
 * Accès: Admin
 */
exports.exporterRapport = asyncHandler(async (req, res) => {
  const { format = 'csv', ...params } = req.body;

  // Valider le format d'export
  const formatsValides = ['csv', 'excel', 'json'];
  if (!formatsValides.includes(format)) {
    return res.status(400).json({
      succes: false,
      message: 'Format d\'export non valide',
      erreurs: [
      {
        champ: 'format',
        message: `Le format doit être l'un des suivants: ${formatsValides.join(', ')}`
      }]

    });
  }

  try {
    // Générer le rapport
    const { donnees } = await exports.genererRapportPersonnalise(
      { body: params },
      { json: (data) => data },
      () => {}
    );

    if (!donnees || !donnees.resultats) {
      throw new Error('Aucune donnée à exporter');
    }

    // Formater les données pour l'export
    let contenu, contentType, extension;

    switch (format) {
      case 'csv':
        // Convertir en CSV
        const { Parser } = require('json2csv');
        const parser = new Parser({
          fields: Object.keys(donnees.resultats[0] || {})
        });
        contenu = parser.parse(donnees.resultats);
        contentType = 'text/csv';
        extension = 'csv';
        break;

      case 'excel':
        // Convertir en Excel avec exceljs
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rapport');

        // Ajouter les en-têtes
        if (donnees.resultats.length > 0) {
          const headers = Object.keys(donnees.resultats[0]);
          worksheet.addRow(headers);

          // Ajouter les données
          donnees.resultats.forEach((item) => {
            const row = headers.map((header) => {
              // Gérer les sous-objets (comme medecin.nom)
              return header.split('.').reduce((obj, key) =>
              obj && obj[key] !== undefined ? obj[key] : '', item);
            });
            worksheet.addRow(row);
          });

          // Mettre en forme les en-têtes
          worksheet.getRow(1).font = { bold: true };
          worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
          };

          // Ajuster la largeur des colonnes
          worksheet.columns.forEach((column) => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
              const columnLength = cell.value ? cell.value.toString().length : 10;
              if (columnLength > maxLength) {
                maxLength = columnLength;
              }
            });
            column.width = Math.min(Math.max(maxLength + 2, 10), 50);
          });
        }

        // Générer le buffer Excel
        const buffer = await workbook.xlsx.writeBuffer();
        contenu = buffer;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;

      case 'json':
      default:
        // Retourner du JSON
        contenu = JSON.stringify(donnees.resultats, null, 2);
        contentType = 'application/json';
        extension = 'json';
    }

    // Générer un nom de fichier avec la date et l'heure actuelles
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const nomFichier = `rapport-${date}.${extension}`;

    // Envoyer le fichier
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);

    if (Buffer.isBuffer(contenu)) {
      res.send(contenu);
    } else {
      res.send(contenu);
    }

  } catch (error) {
    logger.error('Erreur lors de l\'export du rapport:', error);

    res.status(500).json({
      succes: false,
      message: 'Une erreur est survenue lors de l\'export du rapport',
      erreur: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Exporter les fonctions pour les tests
module.exports = {
  ...module.exports,
  buildRapportMedecins
};
//# sourceMappingURL=rapportsController4.js.map