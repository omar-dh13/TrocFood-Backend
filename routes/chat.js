var express = require("express");
var router = express.Router();

const Pusher = require("pusher");
const Message = require("../models/messages");
const Conversation = require("../models/conversations");
const User = require("../models/users");

/**
 * Configuration Pusher pour le chat en temps réel
 * Permet d'envoyer des notifications push aux utilisateurs connectés
 */
const pusher = new Pusher({
  appId: process.env.PUSHER_APPID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

/**
 * Middleware d'authentification pour vérifier le token utilisateur
 * Vérifie que l'utilisateur est connecté avant d'accéder aux routes protégées
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @param {Function} next - Fonction pour passer au middleware suivant
 */
const authenticateUser = async (req, res, next) => {
  // Récupération du token depuis les paramètres ou le body
  const token = req.params.token || req.body.token;
  
  if (!token) {
    return res.status(401).json({ error: "Token required" });
  }
  
  try {
    // Recherche de l'utilisateur avec ce token
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    // Ajout de l'utilisateur à la requête pour les routes suivantes
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Route GET /conversations/:token
 * Récupère toutes les conversations de l'utilisateur connecté
 * Retourne la liste triée par activité récente
 */
router.get("/conversations/:token", authenticateUser, async (req, res) => {
  try {
    // Recherche des conversations où l'utilisateur est participant
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    // Populate pour récupérer les infos des autres participants
    .populate('participants', 'userName _id')
    // Populate pour récupérer le dernier message
    .populate('lastMessage')
    // Tri par activité récente (plus récent en premier)
    .sort({ lastActivity: -1 });

    res.json({ conversations });
  } catch (err) {
    console.error("❌ Erreur récupération conversations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Route POST /message
 * Envoie un nouveau message dans une conversation
 * Crée automatiquement la conversation si elle n'existe pas
 */
router.post("/message", authenticateUser, async (req, res) => {
  const { to, content } = req.body;

  // Vérification des champs obligatoires
  if (!to || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Pas besoin de re-authentifier, req.user existe déjà
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, to] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, to],
        messages: []
      });
      await conversation.save();
      console.log("✅ Nouvelle conversation créée:", conversation._id);
    }

    // Création du nouveau message
    const newMessage = new Message({
      from: req.user._id,           // Expéditeur
      to: to,                   // Destinataire
      content: content.trim(),  // Contenu du message (sans espaces)
      date: new Date(),         // Date d'envoi
      conversationId: conversation._id  // ID de la conversation
    });
    await newMessage.save();
    console.log("📝 Message créé:", newMessage._id);

    // Mise à jour de la conversation avec le nouveau message
    await Conversation.findByIdAndUpdate(conversation._id, {
      $push: { messages: newMessage._id },  // Ajouter le message à la liste
      $set: { 
        lastMessage: newMessage._id,        // Définir comme dernier message
        lastActivity: new Date()            // Mettre à jour l'activité
      }
    });

    // Envoi de la notification en temps réel via Pusher
    const channelName = `chat-${conversation._id}`;
    pusher.trigger(channelName, "message", {
      _id: newMessage._id,
      from: {
        _id: req.user._id,
        userName: req.user.userName
      },
      content: newMessage.content,
      date: newMessage.date,
      conversationId: conversation._id
    });
    console.log("📡 Notification Pusher envoyée sur:", channelName);

    // Réponse de succès
    res.json({ 
      result: true, 
      messageId: newMessage._id,
      conversationId: conversation._id 
    });
  } catch (err) {
    console.error("❌ Erreur envoi message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Route POST /join/:otherUserId
 * Rejoindre ou créer une conversation avec un autre utilisateur
 * Retourne l'ID de la conversation et le nom du canal Pusher
 */
router.post("/join/:otherUserId", authenticateUser, async (req, res) => {
  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, req.params.otherUserId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user._id, req.params.otherUserId],
        messages: []
      });
      await conversation.save();
      console.log("✅ Conversation créée pour join:", conversation._id);
    }

    // Retourner les informations de la conversation
    res.json({ 
      result: true, 
      conversationId: conversation._id,
      channelName: `chat-${conversation._id}`  // Nom du canal Pusher
    });
  } catch (err) {
    console.error("❌ Erreur join conversation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Route GET /conversation/:token/:otherUserId
 * Récupère l'historique complet des messages d'une conversation
 * Entre l'utilisateur connecté et un autre utilisateur spécifique
 */
router.get("/conversation/:token/:otherUserId", async (req, res) => {
  try {
    // Authentification de l'utilisateur
    const user = await User.findOne({ token: req.params.token });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Recherche de la conversation entre les deux utilisateurs
    const conversation = await Conversation.findOne({
      participants: { $all: [user._id, req.params.otherUserId] }
    }).populate('messages');  // Populate pour récupérer tous les messages

    // Si aucune conversation n'existe, retourner un tableau vide
    if (!conversation) {
      return res.json({ messages: [], conversationId: null });
    }

    // Retourner l'historique des messages
    res.json({ 
      messages: conversation.messages,
      conversationId: conversation._id 
    });
  } catch (err) {
    console.error("❌ Erreur récupération historique:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
