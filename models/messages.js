const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "conversation" },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  messages: [
    {
      content: String,
      from: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      date: Date,
    },
  ],
});

const message = mongoose.model("messages", messageSchema);
module.exports = message;
