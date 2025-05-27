const mongoose = require("mongoose");

const conversationSchema = mongoose.Schema({
  // Sujet de la conversation (par exemple un don spécifique)
  subject: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "dons", // Référence vers la collection des dons
    required: false // Optionnel car toutes les conversations ne sont pas liées à un don
  },
  // Liste des participants à la conversation (2 utilisateurs maximum)
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "users", // Référence vers la collection des utilisateurs
    required: true // Obligatoire - une conversation sans participants n'existe pas
  }],
  // Liste de tous les messages de cette conversation
  messages: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "messages" // Référence vers la collection des messages
  }],
  // Référence vers le dernier message envoyé (pour affichage rapide)
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "messages" // Permet d'afficher un aperçu sans charger tous les messages
  },
  // Date de la dernière activité dans cette conversation
  lastActivity: {
    type: Date,
    default: Date.now // Initialisé à la création de la conversation
  }
}, {
  // Ajoute automatiquement les champs createdAt et updatedAt
  timestamps: true 
});

// MIDDLEWARE DE VALIDATION

// Validation pour s'assurer qu'il y a exactement 2 participants
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    // Erreur si pas exactement 2 participants (conversation privée uniquement)
    next(new Error('Une conversation doit avoir exactement 2 participants'));
  } else {
    next(); // Validation OK, continuer la sauvegarde
  }
});

// INDEX POUR OPTIMISER LES PERFORMANCES

// Index pour trouver rapidement les conversations d'un utilisateur
conversationSchema.index({ participants: 1 });

// Index pour trier les conversations par activité récente
conversationSchema.index({ lastActivity: -1 });

// Index pour filtrer les conversations par sujet (don spécifique)
conversationSchema.index({ subject: 1 });

// MÉTHODES PERSONNALISÉES

// Méthode d'instance : trouver l'autre participant dans la conversation
conversationSchema.methods.getOtherParticipant = function(userId) {
  // Retourne l'ID du participant qui n'est pas l'utilisateur actuel
  return this.participants.find(participant => 
    participant.toString() !== userId.toString()
  );
};

// Méthode statique : trouver une conversation entre deux utilisateurs spécifiques
conversationSchema.statics.findBetweenUsers = function(userId1, userId2) {
  // Recherche une conversation contenant exactement ces deux utilisateurs
  return this.findOne({
    participants: { $all: [userId1, userId2] } // $all vérifie que les deux IDs sont présents
  });
};

// Création du modèle MongoDB
const Conversation = mongoose.model("conversations", conversationSchema);

// Index pour optimiser les requêtes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

module.exports = Conversation;
