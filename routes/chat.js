var express = require("express");
var router = express.Router();
const Pusher = require("pusher");
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

router.put("/users/:username", (req, res) => {
  pusher.trigger("chat", "join", {
    user: req.params.username,
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

// Envoi d'un message

router.post("/message", (req, res) => {
  const message = req.body;

  pusher.trigger("chat", "message", message);

  res.json({ result: true });
});

module.exports = router;

// router.post("/message", async (req, res) => {
//   const { from, content, date } = req.body;

//   try {

//     // Créer le message :
//     const newMessage = new Message({
//       from: from,
//       content: content,
//       date: date,
//     });
//     await newMessage.save();

//     // Envoyer via pusher
//     pusher.trigger("chat", "message", {
//       from: from,
//       content: content,
//       date: date,
//     });

//     res.json({ result: true, messageId: newMessage._id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
