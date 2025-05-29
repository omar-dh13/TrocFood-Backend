const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
  street: String,
  postalCode: String,
  city: String,
  country: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
  },
});

const donationSchema = mongoose.Schema({
  received: [{ type: mongoose.Schema.Types.ObjectId, ref: "" }],
  given: [{ type: mongoose.Schema.Types.ObjectId, ref: "" }],
});

const scoreSchema = mongoose.Schema({
  notation: [Number],
  dons: donationSchema,
});

const userSchema = mongoose.Schema({
  email: String,
  userName: String,
  firstName: String,
  lastName: String,
  password: String,
  token: String,
  picture: String,
  birthday: Date,
  phone: String,
  address: addressSchema,
  score: scoreSchema,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'dons' }], // * liste des dons favoris 
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date }
});

userSchema.index({ "address.location": "2dsphere" });
// * L'index 2dsphere est utilisé dans MongoDB pour les données géospatiales du type "Point" en GeoJSON (comme des coordonnées de latitude et longitude).

const User = mongoose.model("users", userSchema);
module.exports = User;
