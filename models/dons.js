const mongoose = require('mongoose');

const donSchema = new mongoose.Schema({
  title: String,
  description: String, 
  image: String, // URL de l’image
  location: String, 
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }, // Référence vers l’utilisateur
  createdAt: { type: Date, default: Date.now }, // Date automatique
});


const Don = mongoose.model('dons', donSchema);

module.exports = Don;
