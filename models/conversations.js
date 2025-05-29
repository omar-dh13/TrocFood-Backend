const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "dons" },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "messages" }],
});

const conversation = mongoose.model("conversations", conversationSchema);
module.exports = conversation;