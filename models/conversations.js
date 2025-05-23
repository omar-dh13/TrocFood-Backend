const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema({
  subject: String, // l'id du don
  user1: [String], // les id des messages
  user2: [String], // les id des messages
});

const conversation = mongoose.model("conversations", conversationSchema);
module.exports = conversation;
