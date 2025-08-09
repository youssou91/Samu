const mongoose = require('mongoose');

const PlanningSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Le titre est obligatoire'], trim: true, minlength: [3, 'Le titre doit contenir au moins 3 caractères'] },
  start: { 
    type: String, 
    required: [true, 'La date de début est obligatoire'],
    validate: {
      validator: function(v) {
        return !isNaN(Date.parse(v));
      },
      message: props => `${props.value} n'est pas une date valide.`
    }
  },
  end: { 
    type: String, 
    required: [true, 'La date de fin est obligatoire'],
    validate: {
      validator: function(v) {
        return !isNaN(Date.parse(v));
      },
      message: props => `${props.value} n'est pas une date valide.`
    }
  },
  type: { type: String, enum: ['consultation', 'reunion', 'autre'], default: 'consultation' },
  personnel: { type: String },
  patient: { type: String },
  description: { type: String },
  status: { type: String }
});

// Validateur custom pour que end > start
PlanningSchema.pre('validate', function(next) {
  if (this.start && this.end && Date.parse(this.start) >= Date.parse(this.end)) {
    this.invalidate('end', 'La date de fin doit être postérieure à la date de début.');
  }
  next();
});

module.exports = mongoose.model('Planning', PlanningSchema);
