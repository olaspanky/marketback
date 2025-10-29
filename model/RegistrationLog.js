// models/RegistrationLog.js
const mongoose = require('mongoose');

const RegistrationLogSchema = new mongoose.Schema({
  // ----- attempt data -----
  name: String,
  email: String,
  phone: String,
  organization: String,
  role: String,
  country: String,
  amount: Number,
  currency: String,

  // ----- outcome -----
  status: {               // "attempted" | "failed" | "success"
    type: String,
    enum: ['attempted', 'failed', 'success'],
    required: true,
  },
  errorMessage: String,   // only for failed attempts

  // ----- Stripe -----
  stripeSessionId: String,
  paymentIntentId: String,

  // ----- timestamps -----
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RegistrationLog', RegistrationLogSchema);