const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    // Expéditeur du message (référence vers la collection users)
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Lien vers le modèle User
      required: true, // Obligatoire - on doit savoir qui envoie
    },
    // Destinataire du message (référence vers la collection users)
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Lien vers le modèle User
      required: true, // Obligatoire - on doit savoir qui reçoit
    },
    // Contenu textuel du message
    content: {
      type: String,
      required: true, // Obligatoire - un message vide n'a pas de sens
      trim: true, // Supprime les espaces en début/fin automatiquement
      maxLength: 1000, // Limite à 1000 caractères pour éviter les messages trop longs
    },
    // Date d'envoi du message
    date: {
      type: Date,
      default: Date.now, // Si pas spécifiée, prend la date actuelle
    },
    // Référence vers la conversation à laquelle appartient ce message
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations", // Lien vers le modèle Conversation
      required: true, // Obligatoire - chaque message appartient à une conversation
    },
    // Statut de lecture du message (lu/non lu)
    read: {
      type: Boolean,
      default: false, // Par défaut, un nouveau message n'est pas lu
    },
    // Date à laquelle le message a été lu
    readAt: {
      type: Date,
      // Pas de default - sera défini uniquement quand le message est lu
    },
  },
  {
    // Ajoute automatiquement les champs createdAt et updatedAt
    timestamps: true,
  }
);

// INDEX POUR OPTIMISER LES PERFORMANCES

// Index composé pour récupérer rapidement les messages d'une conversation triés par date
messageSchema.index({ conversationId: 1, date: -1 });

// Index pour trouver rapidement les messages non lus d'un utilisateur
messageSchema.index({ to: 1, read: 1 });

// Index pour récupérer l'historique des messages envoyés par un utilisateur
messageSchema.index({ from: 1, date: -1 });

// Création du modèle MongoDB
const message = mongoose.model("messages", messageSchema);
module.exports = message;
