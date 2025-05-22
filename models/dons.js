const mongoose = require('mongoose');

const donSchema = new mongoose.Schema({
  title: String,
  description: String, 
  image: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now },
});

donSchema.index({ location: "2dsphere" }); 
//* L'index 2dsphere est utilisé dans MongoDB pour les données géospatiales du type "Point" en GeoJSON (comme des coordonnées de latitude et longitude).
//* ce sont des des coordonnées géographiques sur une sphère (la Terre).
const Don = mongoose.model('dons', donSchema);

module.exports = Don;

//* Seul location est au format GeoJSON, les autres champs sont des types de données standards.