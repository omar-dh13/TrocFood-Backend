const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  content: String,
  date: Date,
});

const message = mongoose.model("messages", messageSchema);
module.exports = message;