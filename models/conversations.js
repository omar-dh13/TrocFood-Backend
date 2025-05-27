const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "dons" },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  messages: [
    {
      content: String,
      from: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      fromUserName: String,
      date: Date,
    },
  ],
});

const conversation = mongoose.model("conversations", conversationSchema);
module.exports = conversation;
