const express = require("express");
const router = express.Router();
const Don = require("../models/dons");
const User = require("../models/users");
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// 📸 Configuration multer pour les uploads d'images
const upload = multer({ dest: 'temp/' });

// 📍 Fonction utilitaire pour calculer la distance entre deux points GPS
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Retourne la distance arrondie au mètre près
  return Math.round(distance * 1000) / 1000;
}

// 📋 GET - Récupérer toutes les annonces avec calcul de distance optionnel
router.get("/", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    
    // 🔍 Récupération de tous les dons, triés par date de création (plus récents en premier)
    const dons = await Don.find()
      .populate("user", "userName") // Récupère le nom de l'utilisateur
      .sort({ createdAt: -1 });

    // 📏 Si position utilisateur fournie, calculer les distances pour chaque don
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      
      const donsWithDistance = dons.map(don => {
        // ✅ Vérification que les coordonnées existent
        if (don.location?.coordinates && don.location.coordinates.length === 2) {
          const [donLon, donLat] = don.location.coordinates; // Format MongoDB: [longitude, latitude]
          const distance = calculateDistance(userLat, userLon, donLat, donLon);
          return { ...don.toObject(), distance };
        }
        return { ...don.toObject(), distance: null };
      });
      
      return res.json({ result: true, dons: donsWithDistance });
    }

    // 📦 Retour des dons sans calcul de distance
    res.json({ result: true, dons });
  } catch (err) {
    console.error('❌ Erreur GET /dons:', err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// 🆕 POST - Créer une nouvelle annonce avec upload d'image
router.post("/", upload.single('image'), async (req, res) => {
  const { title, description, location, user } = req.body;

  // ✅ Validation des champs obligatoires
  if (!title || !description || !location || !user) {
    return res.status(400).json({
      result: false,
      message: "Tous les champs obligatoires doivent être fournis.",
    });
  }

  try {
    // 👤 Recherche de l'utilisateur par email si nécessaire
    let userId = user;
    if (typeof user === 'string' && user.includes('@')) {
      const userDoc = await User.findOne({ email: user });
      if (!userDoc) {
        return res.status(400).json({
          result: false,
          message: "Utilisateur non trouvé avec cet email: " + user
        });
      }
      userId = userDoc._id;
    }

    // 🗺️ Parsing et validation de la localisation GeoJSON
    let parsedLocation = location;
    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location);
        // 🔢 Conversion des coordonnées en nombres
        if (parsedLocation.coordinates && Array.isArray(parsedLocation.coordinates)) {
          parsedLocation.coordinates = parsedLocation.coordinates.map(Number);
        }
      } catch (e) {
        return res.status(400).json({
          result: false,
          message: "Le champ location doit être un objet GeoJSON valide.",
        });
      }
    }

    // ✅ Validation stricte du format GeoJSON Point
    if (
      !parsedLocation.type ||
      parsedLocation.type !== "Point" ||
      !Array.isArray(parsedLocation.coordinates) ||
      parsedLocation.coordinates.length !== 2 ||
      typeof parsedLocation.coordinates[0] !== "number" ||
      typeof parsedLocation.coordinates[1] !== "number"
    ) {
      return res.status(400).json({
        result: false,
        message: "Le champ location doit être au format GeoJSON : { type: 'Point', coordinates: [longitude, latitude] }",
      });
    }

    // 📸 Upload vers Cloudinary si une image est fournie
    let cloudinaryUrl = null;
    if (req.file) {
        // 🌩️ Upload du fichier temporaire vers Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        cloudinaryUrl = result.secure_url; // URL sécurisée HTTPS
        console.log('✅ Image uploadée sur Cloudinary:', cloudinaryUrl);
    }

    // 💾 Création et sauvegarde du nouveau don en base
    const newDon = new Don({
        title,
        description,
        image: cloudinaryUrl, // URL Cloudinary ou null si pas d'image
        location: parsedLocation,
        user: userId,
    });

    const savedDon = await newDon.save();
    console.log("🎉 Don créé avec succès:", savedDon.title);
    
    // 📤 Retour du don créé avec code 201 (Created)
    res.status(201).json({ result: true, don: savedDon });

  } catch (err) {
    console.error('❌ Erreur POST /dons:', err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// 📍 GET - Récupérer les dons proches d'une position géographique
router.get("/near", async (req, res) => {
  const { lng, lat, maxDistance = 5000 } = req.query; // Distance par défaut: 5km

  // ✅ Validation des coordonnées
  if (!lng || !lat) {
    return res.status(400).json({
      result: false,
      message: "Veuillez fournir les coordonnées (lng, lat).",
    });
  }

  try {
    // 🔍 Recherche géospatiale MongoDB avec $near
    const dons = await Don.find({
      location: {
        $near: {
          $geometry: { 
            type: "Point", 
            coordinates: [parseFloat(lng), parseFloat(lat)] 
          },
          $maxDistance: parseInt(maxDistance), // Distance max en mètres
        },
      },
    }).populate("user", "userName");

    res.json({ result: true, dons });
  } catch (err) {
    console.error('❌ Erreur GET /dons/near:', err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// 🔍 GET - Récupérer un don spécifique par son ID
router.get("/:id", async (req, res) => {
  try {
    // 🔎 Recherche du don avec populate pour récupérer les infos utilisateur
    const don = await Don.findById(req.params.id).populate("user", "userName");

    // ❌ Don non trouvé
    if (!don) {
      return res.status(404).json({ 
        result: false, 
        message: "Don introuvable." 
      });
    }

    // ✅ Retour du don trouvé
    res.json({ result: true, don });
  } catch (err) {
    console.error('❌ Erreur GET /dons/:id:', err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// ✏️ PUT - Mettre à jour un don existant
router.put("/:id", async (req, res) => {
  const { title, description, image, location } = req.body;

  // ✅ Validation des champs obligatoires
  if (!title || !description || !location) {
    return res.status(400).json({
      result: false,
      message: "Tous les champs obligatoires doivent être fournis.",
    });
  }

  try {
    // 🔄 Mise à jour du don avec retour de l'objet mis à jour
    const updatedDon = await Don.findByIdAndUpdate(
      req.params.id,
      { title, description, image, location },
      { new: true } // Retourne l'objet après modification
    );

    // ❌ Don non trouvé
    if (!updatedDon) {
      return res.status(404).json({
        result: false,
        message: "Don non trouvé.",
      });
    }

    // ✅ Retour du don mis à jour
    res.json({ result: true, don: updatedDon });
  } catch (err) {
    console.error('❌ Erreur PUT /dons/:id:', err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// 🗑️ DELETE - Supprimer un don par son ID
router.delete("/:id", async (req, res) => {
  try {
    // 🗑️ Suppression du don de la base de données
    const deletedDon = await Don.findByIdAndDelete(req.params.id);

    // ❌ Don non trouvé
    if (!deletedDon) {
      return res.status(404).json({
        result: false,
        message: "Don non trouvé.",
      });
    }

    // ✅ Confirmation de suppression
    res.json({
      result: true,
      message: "Don supprimé avec succès.",
      don: deletedDon,
    });
  } catch (err) {
    console.error('❌ Erreur DELETE /dons/:id:', err);
    res.status(500).json({ result: false, message: err.message });
  }
});

// 📤 Export du router pour utilisation dans app.js
module.exports = router;