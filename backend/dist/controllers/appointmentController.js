"use strict";const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');

// Créer un nouveau rendez-vous
exports.createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      patientId,
      patientName,
      patientPhone,
      startTime,
      endTime,
      type,
      reason,
      notes
    } = req.body;

    // Vérifier la disponibilité du créneau
    const isAvailable = await Appointment.checkAvailability(
      req.body.doctorId,
      new Date(startTime),
      new Date(endTime)
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Le médecin a déjà un rendez-vous à ce créneau horaire'
      });
    }

    // Créer le rendez-vous
    const appointment = await Appointment.create({
      patient: patientId,
      patientName,
      patientPhone,
      doctor: req.body.doctorId,
      doctorName: req.body.doctorName,
      startTime,
      endTime,
      type,
      reason,
      notes,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer tous les rendez-vous
exports.getAppointments = async (req, res) => {
  try {
    const { doctorId, patientId, startDate, endDate, status } = req.query;
    const query = {};

    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;
    if (status) query.status = status;

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query).
    sort({ startTime: 1 }).
    populate('patient', 'firstName lastName email').
    populate('doctor', 'firstName lastName specialty');

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour un rendez-vous
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier si le rendez-vous existe
    let appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Vérifier la disponibilité si les horaires changent
    if (updates.startTime || updates.endTime) {
      const startTime = new Date(updates.startTime || appointment.startTime);
      const endTime = new Date(updates.endTime || appointment.endTime);

      const isAvailable = await Appointment.checkAvailability(
        updates.doctorId || appointment.doctor,
        startTime,
        endTime,
        id
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Le médecin a déjà un rendez-vous à ce créneau horaire'
        });
      }
    }

    // Mettre à jour le rendez-vous
    appointment = await Appointment.findByIdAndUpdate(
      id,
      {
        ...updates,
        updatedBy: req.user.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Supprimer un rendez-vous
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Marquer comme annulé au lieu de supprimer
    appointment.status = 'annule';
    appointment.updatedBy = req.user.id;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Marquer un rendez-vous comme commencé
exports.startAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    appointment.status = 'en_cours';
    appointment.updatedBy = req.user.id;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Marquer un rendez-vous comme terminé
exports.completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    appointment.status = 'termine';
    appointment.updatedBy = req.user.id;
    await appointment.save();

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
//# sourceMappingURL=appointmentController.js.map