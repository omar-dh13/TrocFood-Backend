const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "conversations" },
  users: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      userName: String,
    },
  ],

  messages: [
    {
      content: String,
      from: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      fromUserName: String,
      date: Date,
    },
  ],
});

const message = mongoose.model("messages", messageSchema);
module.exports = message;
