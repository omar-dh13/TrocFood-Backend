const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
  street: String,
  postalCode: String, //TODO: regarder ce que renvoie expo-location (number ou string ?)
  city: String,
  country: String,
  latitude: Number,
  longitude: Number,
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
});
//

const User = mongoose.model("users", userSchema);
module.exports = User;
