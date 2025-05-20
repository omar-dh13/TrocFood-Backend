const mongoose = require("mongoose");

const donationHistorySchema = mongoose.Schema({});

const DonationHistory = mongoose.model(
  "donationhistories",
  donationHistorySchema
);
module.exports = DonationHistory;
