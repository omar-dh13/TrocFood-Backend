var express = require("express");
const { token } = require("morgan");
var router = express.Router();

const Pusher = require("pusher");
const Message = require("../models/messages");
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
router.put("/users/:token", (req, res) => {
  pusher.trigger("chat", "join", {
    token: req.params.token,
  });

  res.json({ result: true });
});

// Déconnexion du canal chat
router.delete("/users/:token", (req, res) => {
  pusher.trigger("chat", "leave", {
    token: req.params.token,
  });

  res.json({ result: true });
});

// Envoi d'un message et sauvegarde dans la BDD
// TODO: Enregister le message dans la BDD
router.post("/message", (req, res) => {
  const { username, message, createdAt, id } = req.body;
  pusher.trigger("chat", "message", {
    username,
    text: message,
    createdAt,
    id,
  });

  const newMessage = new Message({
    //conversation: id, // TODO: récupérer l'id de la conversation
    users: [username], // TODO: récupérer les id des users
    messages: [
      {
        content: message,
        from: username,
        date: createdAt,
      },
    ],
  });
  newMessage.save().then((newDoc) => {
    console.log("Message savec in DB", newDoc);
  });
  res.json({ result: true });
});

module.exports = router;
