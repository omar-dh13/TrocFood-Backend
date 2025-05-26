var express = require("express");
const { token } = require("morgan");
var router = express.Router();
const mongoose = require("mongoose");

const Pusher = require("pusher");
const Message = require("../models/messages");
const Conversation = require("../models/conversations");
const User = require("../models/users");

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Récupérer le userName de l'utilisateur
router.get("/usersInfo/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ userName: user.userName });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});

// Connexion au canal chat
// TODO: création conversation dans la BDD avec les personnes
router.put("/users/:userName", (req, res) => {
  pusher.trigger("chat", "join", {
    user: req.params.userName,
  });

  res.json({ result: true });
});

// Déconnexion du canal chat
router.delete("/users/:userName", (req, res) => {
  pusher.trigger("chat", "leave", {
    user: req.params.userName,
  });

  res.json({ result: true });
});

// Envoi d'un message et sauvegarde dans la BDD

router.post("/message", async (req, res) => {
  const { username, message, createdAt, id } = req.body;

  //Trouver l'utilisateur dans la BDD:
  const user = await User.findOne({ userName: username });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Trouver ou créer la conversation dans la BDD:
  let conversation = await Conversation.findOne({
    users: { $all: [user._id] },
    //subject: id du don ?
  });

  if (!conversation) {
    conversation = new Conversation({
      //subject: subject,
      users: [user._id],
      messages: [],
    });
    await conversation.save();
  }

  //créer le message :
  const newMessage = new Message({
    conversation: conversation._id,
    users: [{ userId: user._id, username: user.userName }],
    messages: [
      {
        content: message,
        from: user._id,
        fromUserName: username,
        date: createdAt,
      },
    ],
  });
  await newMessage.save();

  // ajouter le message à la conversation:
  conversation.messages.push(newMessage._id);
  await conversation.save();

  //Envoyer via pusher
  pusher.trigger("chat", "message", {
    conversationId: conversation._id,
    username,
    text: message,
    createdAt,
    id,
  });
});

module.exports = router;
