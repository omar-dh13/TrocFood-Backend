var express = require("express");
var router = express.Router();

const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Join chat
// création conversation dans la BDD avec les personnes
router.put("/users/:username", (req, res) => {
  pusher.trigger("chat", "join", {
    username: req.params.username,
  });

  res.json({ result: true });
});

// Leave chat
router.delete("/users/:username", (req, res) => {
  pusher.trigger("chat", "leave", {
    username: req.params.username,
  });

  res.json({ result: true });
});

// Send message
// enregistrer le message en question dans la BDD
router.post("/message", (req, res) => {
  pusher.trigger("chat", "message", req.body);

  res.json({ result: true });
});

module.exports = router;
