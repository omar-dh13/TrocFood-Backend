var express = require("express");
const { token } = require("morgan");
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
// TODO: création conversation dans la BDD avec les personnes
router.put("/users/:token", (req, res) => {
  pusher.trigger("chat", "join", {
    token: req.params.token,
  });

  res.json({ result: true });
});

// Leave chat
router.delete("/users/:token", (req, res) => {
  pusher.trigger("chat", "leave", {
    token: req.params.token,
  });

  res.json({ result: true });
});

// Send message
// TODO: Enregister le message dans la BDD
router.post("/message", (req, res) => {
  console.log("Hello");
  const { token, message, createdAt, id } = req.body;
  pusher.trigger("chat", "message", {
    token,
    text: message,
    createdAt,
    id,
  });

  res.json({ result: true });
});

module.exports = router;
