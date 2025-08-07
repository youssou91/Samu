"use strict";const RendezVous = require('../models/RendezVous');
const Utilisateur = require('../models/Utilisateur');
const Parametre = require('../models/Parametre');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const moment = require('moment');
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Configuration du transporteur d'emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production' // Ne pas vérifier le certificat en développement
  }
});

// Vérifier la connexion SMTP
transporter.verify(function (error, success) {
  if (error) {
    logger.error('Erreur de connexion au serveur SMTP:', error);
  } else {
    logger.info('Serveur SMTP prêt à envoyer des emails');
  }
});

/**
 * Envoyer une notification par email
 * @param {Object} options - Options de l'email
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet de l'email
 * @param {string} options.text - Corps de l'email en texte brut
 * @param {string} options.html - Corps de l'email en HTML (optionnel)
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
const envoyerEmail = async (options) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    });

    logger.info(`Email envoyé à ${options.to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de l'email à ${options.to}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer une notification SMS (simulé)
 * @param {string} telephone - Numéro de téléphone du destinataire
 * @param {string} message - Message à envoyer
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
const envoyerSMS = async (telephone, message) => {
  // En environnement de développement, on simule l'envoi
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[SIMULATION] SMS envoyé à ${telephone}: ${message}`);
    return { success: true, message: 'SMS simulé avec succès' };
  }

  // En production, intégrer avec un service d'envoi de SMS comme Twilio, etc.
  // Exemple avec Twilio (à décommenter et configurer si nécessaire) :
  /*
  try {
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telephone
    });
    
    logger.info(`SMS envoyé à ${telephone}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du SMS à ${telephone}:`, error);
    return { success: false, error: error.message };
  }
  */

  // Retourner un succès simulé si aucun service SMS n'est configuré
  return { success: true, message: 'Aucun service SMS configuré, notification ignorée' };
};

/**
 * Enregistrer une notification dans la base de données
 * @param {Object} notificationData - Données de la notification
 * @returns {Promise<Object>} - Notification enregistrée
 */
const enregistrerNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return { success: true, notification };
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement de la notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoyer une notification de confirmation de rendez-vous
 * @param {string} rendezVousId - ID du rendez-vous
 * @param {string} type - Type de notification (confirmation, rappel, annulation, etc.)
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
exports.envoyerNotificationRendezVous = async (rendezVousId, type = 'confirmation') => {
  try {
    // Récupérer le rendez-vous avec les informations du patient et du médecin
    const rendezVous = await RendezVous.findById(rendezVousId).
    populate('patient', 'prenom nom email telephone parametresNotifications').
    populate('medecin', 'prenom nom specialite').
    populate('creePar', 'prenom nom').
    lean();

    if (!rendezVous) {
      throw new Error('Rendez-vous non trouvé');
    }

    // Vérifier si le patient a activé les notifications
    const parametresPatient = rendezVous.patient.parametresNotifications || {};
    const notificationsActivees = {
      email: parametresPatient.emailActif !== false, // Par défaut à true si non défini
      sms: parametresPatient.smsActif === true, // Par défaut à false si non défini
      rappel: parametresPatient.rappelActif !== false // Par défaut à true si non défini
    };

    // Si le type est un rappel et que les rappels sont désactivés, ne rien faire
    if (type === 'rappel' && !notificationsActivees.rappel) {
      return { success: true, message: 'Notifications de rappel désactivées pour ce patient' };
    }

    // Récupérer les paramètres de l'application pour les modèles de notification
    const parametresApp = (await Parametre.findOne({}).lean()) || {};

    // Variables pour le modèle de notification
    const variables = {
      patientPrenom: rendezVous.patient.prenom,
      patientNom: rendezVous.patient.nom,
      medecinNom: `${rendezVous.medecin.prenom} ${rendezVous.medecin.nom}`,
      medecinSpecialite: rendezVous.medecin.specialite,
      dateRdv: moment(rendezVous.dateDebut).format('dddd D MMMM YYYY'),
      heureDebut: moment(rendezVous.dateDebut).format('HH:mm'),
      heureFin: moment(rendezVous.dateFin).format('HH:mm'),
      typeRdv: rendezVous.type || 'consultation',
      motif: rendezVous.motif || 'Non spécifié',
      lieu: parametresApp.lieuRdv || 'Notre cabinet',
      contactTelephone: parametresApp.telephoneContact || '',
      contactEmail: parametresApp.emailContact || '',
      urlAnnulation: `${process.env.CLIENT_URL}/rendez-vous/${rendezVous._id}/annuler`,
      urlConfirmation: `${process.env.CLIENT_URL}/rendez-vous/${rendezVous._id}/confirmer`,
      delaiAnnulationHeures: parametresApp.delaiAnnulationHeures || 24
    };

    // Déterminer le sujet et le contenu en fonction du type de notification
    let sujet = '';
    let contenuTexte = '';
    let contenuHTML = '';

    switch (type) {
      case 'confirmation':
        sujet = `Confirmation de votre rendez-vous du ${variables.dateRdv}`;
        contenuTexte = `Bonjour ${variables.patientPrenom},\n\n`;
        contenuTexte += `Votre rendez-vous avec le Dr ${variables.medecinNom} (${variables.medecinSpecialite}) a été confirmé.\n\n`;
        contenuTexte += `Détails du rendez-vous :\n`;
        contenuTexte += `- Date : ${variables.dateRdv}\n`;
        contenuTexte += `- Heure : ${variables.heureDebut} - ${variables.heureFin}\n`;
        contenuTexte += `- Type : ${variables.typeRdv}\n`;
        contenuTexte += `- Motif : ${variables.motif}\n\n`;
        contenuTexte += `Lieu : ${variables.lieu}\n\n`;
        contenuTexte += `Pour annuler ou reporter ce rendez-vous, veuillez nous contacter au moins ${variables.delaiAnnulationHeures} heures à l'avance.\n\n`;
        contenuTexte += `Cordialement,\nL'équipe médicale`;

        // Version HTML (simplifiée)
        contenuHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Confirmation de votre rendez-vous</h2>
            <p>Bonjour ${variables.patientPrenom},</p>
            <p>Votre rendez-vous avec le Dr ${variables.medecinNom} (${variables.medecinSpecialite}) a été confirmé.</p>
            
            <h3>Détails du rendez-vous :</h3>
            <ul>
              <li><strong>Date :</strong> ${variables.dateRdv}</li>
              <li><strong>Heure :</strong> ${variables.heureDebut} - ${variables.heureFin}</li>
              <li><strong>Type :</strong> ${variables.typeRdv}</li>
              <li><strong>Motif :</strong> ${variables.motif}</li>
            </ul>
            
            <p><strong>Lieu :</strong> ${variables.lieu}</p>
            
            <p>Pour annuler ou reporter ce rendez-vous, veuillez nous contacter au moins ${variables.delaiAnnulationHeures} heures à l'avance.</p>
            
            <p>Cordialement,<br>L'équipe médicale</p>
          </div>
        `;
        break;

      case 'rappel':
        sujet = `Rappel : Rendez-vous demain à ${variables.heureDebut}`;
        contenuTexte = `Bonjour ${variables.patientPrenom},\n\n`;
        contenuTexte += `Ceci est un rappel pour votre rendez-vous demain avec le Dr ${variables.medecinNom}.\n\n`;
        contenuTexte += `Détails du rendez-vous :\n`;
        contenuTexte += `- Date : ${variables.dateRdv}\n`;
        contenuTexte += `- Heure : ${variables.heureDebut} - ${variables.heureFin}\n`;
        contenuTexte += `- Type : ${variables.typeRdv}\n\n`;
        contenuTexte += `Lieu : ${variables.lieu}\n\n`;
        contenuTexte += `En cas d'empêchement, merci de nous contacter au plus vite.\n\n`;
        contenuTexte += `Cordialement,\nL'équipe médicale`;
        break;

      case 'annulation':
        sujet = `Annulation de votre rendez-vous du ${variables.dateRdv}`;
        contenuTexlet = `Bonjour ${variables.patientPrenom},\n\n`;
        contenuTexte += `Votre rendez-vous du ${variables.dateRdv} à ${variables.heureDebut} avec le Dr ${variables.medecinNom} a été annulé.\n\n`;
        contenuTexte += `Pour prendre un nouveau rendez-vous, veuillez nous contacter ou utiliser notre plateforme en ligne.\n\n`;
        contenuTexte += `Cordialement,\nL'équipe médicale`;
        break;

      case 'modification':
        sujet = `Modification de votre rendez-vous du ${variables.dateRdv}`;
        contenuTexte = `Bonjour ${variables.patientPrenom},\n\n`;
        contenuTexte += `Votre rendez-vous avec le Dr ${variables.medecinNom} a été modifié.\n\n`;
        contenuTexte += `Nouveaux détails du rendez-vous :\n`;
        contenuTexte += `- Date : ${variables.dateRdv}\n`;
        contenuTexte += `- Heure : ${variables.heureDebut} - ${variables.heureFin}\n`;
        contenuTexte += `- Type : ${variables.typeRdv}\n\n`;
        contenuTexte += `Lieu : ${variables.lieu}\n\n`;
        contenuTexte += `Si ces nouveaux horaires ne vous conviennent pas, veuillez nous contacter.\n\n`;
        contenuTexte += `Cordialement,\nL'équipe médicale`;
        break;

      default:
        throw new Error(`Type de notification non pris en charge: ${type}`);
    }

    // Tableau pour stocker les résultats des envois
    const resultats = [];

    // Envoyer par email si activé et si l'email est disponible
    if (notificationsActivees.email && rendezVous.patient.email) {var _req, _req$user;
      const resultatEmail = await envoyerEmail({
        to: rendezVous.patient.email,
        subject: sujet,
        text: contenuTexte,
        html: contenuHTML || contenuTexte
      });

      resultats.push({
        type: 'email',
        destinataire: rendezVous.patient.email,
        succes: resultatEmail.success,
        messageId: resultatEmail.messageId,
        erreur: resultatEmail.error
      });

      // Enregistrer la notification dans la base de données
      await enregistrerNotification({
        type: `email_${type}`,
        destinataire: {
          id: rendezVous.patient._id,
          type: 'patient',
          email: rendezVous.patient.email
        },
        contenu: {
          sujet,
          texte: contenuTexte,
          html: contenuHTML
        },
        statut: resultatEmail.success ? 'envoyee' : 'erreur',
        rendezVous: rendezVous._id,
        erreur: resultatEmail.error,
        creePar: ((_req = req) === null || _req === void 0 ? void 0 : (_req$user = _req.user) === null || _req$user === void 0 ? void 0 : _req$user.id) || 'système'
      });
    }

    // Envoyer par SMS si activé et si le numéro est disponible
    if (notificationsActivees.sms && rendezVous.patient.telephone) {var _req2, _req2$user;
      // Limiter la longueur du message SMS
      const messageSMS = contenuTexte.length > 160 ?
      contenuTexte.substring(0, 157) + '...' :
      contenuTexte;

      const resultatSMS = await envoyerSMS(
        rendezVous.patient.telephone,
        `${sujet}\n\n${messageSMS}`
      );

      resultats.push({
        type: 'sms',
        destinataire: rendezVous.patient.telephone,
        succes: resultatSMS.success,
        messageId: resultatSMS.sid,
        erreur: resultatSMS.error
      });

      // Enregistrer la notification dans la base de données
      await enregistrerNotification({
        type: `sms_${type}`,
        destinataire: {
          id: rendezVous.patient._id,
          type: 'patient',
          telephone: rendezVous.patient.telephone
        },
        contenu: {
          texte: messageSMS
        },
        statut: resultatSMS.success ? 'envoyee' : 'erreur',
        rendezVous: rendezVous._id,
        erreur: resultatSMS.error,
        creePar: ((_req2 = req) === null || _req2 === void 0 ? void 0 : (_req2$user = _req2.user) === null || _req2$user === void 0 ? void 0 : _req2$user.id) || 'système'
      });
    }

    return {
      success: resultats.some((r) => r.succes),
      resultats
    };

  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification (${type}):`, error);
    return {
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};

/**
 * Envoyer les rappels de rendez-vous
 * Méthode à appeler via un travail planifié (cron job)
 */
exports.envoyerRappelsRendezVous = async () => {
  try {
    // Récupérer les paramètres de l'application
    const parametres = (await Parametre.findOne({}).lean()) || {};
    const delaiRappelHeures = parametres.delaiRappelHeures || 24;

    // Calculer la date de début et de fin pour les rappels
    const maintenant = new Date();
    const dateDebut = new Date(maintenant.getTime() + delaiRappelHeures * 60 * 60 * 1000);
    const dateFin = new Date(dateDebut.getTime() + 60 * 60 * 1000); // Fenêtre d'1 heure

    // Récupérer les rendez-vous à rappeler
    const rendezVousARappeler = await RendezVous.find({
      dateDebut: { $gte: dateDebut, $lt: dateFin },
      statut: 'confirme',
      'notifications.rappelEnvoye': { $ne: true }
    }).
    populate('patient', 'prenom nom email telephone parametresNotifications').
    populate('medecin', 'prenom nom specialite').
    lean();

    logger.info(`Envoi des rappels pour ${rendezVousARappeler.length} rendez-vous`);

    // Envoyer les rappels
    const resultats = [];

    for (const rdv of rendezVousARappeler) {
      try {
        const resultat = await (void 0).envoyerNotificationRendezVous(rdv._id, 'rappel');

        // Marquer le rappel comme envoyé
        if (resultat.success) {
          await RendezVous.findByIdAndUpdate(rdv._id, {
            $set: { 'notifications.rappelEnvoye': true, 'notifications.dateRappel': new Date() }
          });
        }

        resultats.push({
          rendezVousId: rdv._id,
          patient: rdv.patient.email || rdv.patient.telephone,
          success: resultat.success,
          details: resultat.resultats
        });
      } catch (error) {
        logger.error(`Erreur lors de l'envoi du rappel pour le RDV ${rdv._id}:`, error);
        resultats.push({
          rendezVousId: rdv._id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      total: rendezVousARappeler.length,
      reussis: resultats.filter((r) => r.success).length,
      echecs: resultats.filter((r) => !r.success).length,
      resultats
    };

  } catch (error) {
    logger.error('Erreur lors de l\'envoi des rappels de rendez-vous:', error);
    return {
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};

/**
 * Obtenir l'historique des notifications d'un utilisateur
 * GET /api/notifications
 * Accès: Utilisateur authentifié
 */
exports.obtenirHistoriqueNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, statut } = req.query;

  // Construire la requête
  const query = {};

  // Filtrer par destinataire (l'utilisateur connecté)
  query['destinataire.id'] = req.user.id;

  // Filtres optionnels
  if (type) {
    query.type = type;
  }

  if (statut) {
    query.statut = statut;
  }

  // Pagination
  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);
  const skip = (pageInt - 1) * limitInt;

  // Exécuter les requêtes en parallèle
  const [total, notifications] = await Promise.all([
  Notification.countDocuments(query),
  Notification.find(query).
  sort({ dateCreation: -1 }).
  skip(skip).
  limit(limitInt).
  populate('rendezVous', 'dateDebut dateFin statut').
  populate('creePar', 'prenom nom role').
  lean()]
  );

  // Formater la réponse
  const resultats = notifications.map((notif) => ({
    id: notif._id,
    type: notif.type,
    statut: notif.statut,
    dateEnvoi: notif.dateCreation,
    contenu: notif.contenu,
    rendezVous: notif.rendezVous,
    creePar: notif.creePar,
    erreur: notif.erreur
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
    success: true,
    message: 'Historique des notifications récupéré avec succès',
    donnees: {
      notifications: resultats,
      pagination
    }
  });
});

/**
 * Marquer une notification comme lue
 * PATCH /api/notifications/:id/lu
 * Accès: Utilisateur authentifié (propriétaire de la notification)
 */
exports.marquerCommeLue = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      'destinataire.id': req.user.id
    },
    {
      $set: {
        lu: true,
        dateLecture: new Date()
      }
    },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification non trouvée ou accès non autorisé',
      erreurs: [
      { champ: 'id', message: 'Aucune notification trouvée avec cet ID ou accès refusé' }]

    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification marquée comme lue avec succès',
    donnees: {
      notification: {
        id: notification._id,
        lu: notification.lu,
        dateLecture: notification.dateLecture
      }
    }
  });
});

/**
 * Marquer toutes les notifications comme lues
 * PATCH /api/notifications/marquer-comme-lues
 * Accès: Utilisateur authentifié
 */
exports.marquerToutCommeLues = asyncHandler(async (req, res) => {
  const resultat = await Notification.updateMany(
    {
      'destinataire.id': req.user.id,
      lu: { $ne: true }
    },
    {
      $set: {
        lu: true,
        dateLecture: new Date()
      }
    }
  );

  res.status(200).json({
    success: true,
    message: `${resultat.nModified} notifications marquées comme lues`,
    donnees: {
      notificationsModifiees: resultat.nModified
    }
  });
});

/**
 * Supprimer une notification
 * DELETE /api/notifications/:id
 * Accès: Utilisateur authentifié (propriétaire de la notification)
 */
exports.supprimerNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    'destinataire.id': req.user.id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification non trouvée ou accès non autorisé',
      erreurs: [
      { champ: 'id', message: 'Aucune notification trouvée avec cet ID ou accès refusé' }]

    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification supprimée avec succès',
    donnees: {}
  });
});

/**
 * Obtenir le nombre de notifications non lues
 * GET /api/notifications/non-lues
 * Accès: Utilisateur authentifié
 */
exports.obtenirNombreNotificationsNonLues = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    'destinataire.id': req.user.id,
    lu: { $ne: true }
  });

  res.status(200).json({
    success: true,
    message: 'Nombre de notifications non lues récupéré avec succès',
    donnees: {
      count
    }
  });
});
//# sourceMappingURL=notificationController.js.map