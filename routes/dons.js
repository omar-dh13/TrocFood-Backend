const express = require("express");
const router = express.Router();
const Don = require("../models/dons");
const cloudinary = require('../config/cloudinary');
const multer = require('multer'); // Middleware Node.js pour le téléversement de fichiers vers Cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // permet de stocker les fichiers directement sur Cloudinary

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trocfood_dons',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const upload = multer({ storage: storage });

// GET - Récupérer toutes les annonces (dons) avec calcul de distance
router.get("/", async (req, res) => {
  try {
    const { latitude, longitude } = req.query; // Récupérer lat/lng depuis query params
    
    const dons = await Don.find()
      .populate("user", "userName")
      .sort({ createdAt: -1 });

    // ⭐ Si position utilisateur fournie, calculer les distances
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      
      console.log("📍 Position utilisateur:", userLat, userLon);
      
      const donsWithDistance = dons.map(don => {
        if (don.location?.coordinates && don.location.coordinates.length === 2) {
          const [donLon, donLat] = don.location.coordinates;
          const distance = calculateDistance(userLat, userLon, donLat, donLon);
          
          console.log(`📏 Don "${don.title}" - Distance: ${distance} km`);
          
          return { ...don.toObject(), distance };
        }
        return { ...don.toObject(), distance: null };
      });
      
      return res.json({ result: true, dons: donsWithDistance });
    }

    // Si pas de position, retourner sans distances
    res.json({ result: true, dons });
  } catch (err) {
    console.error('Erreur GET /dons:', err);
    res.status(500).json({ result: false, message: err.message, error: err });
  }
});

// POST - Ajouter une annonce (don)
router.post("/", upload.single('image'), async (req, res) => {
  const { title, description, location, user } = req.body;

  // Validation des champs obligatoires
  if (!title || !description || !location || !user) {
    return res.status(400).json({
      result: false,
      message: "Tous les champs obligatoires doivent être fournis.",
    });
  }

  // DEBUG : voir ce que reçoit le backend
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);

  // On parse la chaîne de caractères en objet JSON
  let parsedLocation = location;
  if (typeof location === "string") {
    try {
      parsedLocation = JSON.parse(location);
      // Force la conversion en nombre pour chaque coordonnée
      if (
        parsedLocation.coordinates &&
        Array.isArray(parsedLocation.coordinates)
      ) {
        parsedLocation.coordinates = parsedLocation.coordinates.map(Number);
      }
    } catch (e) {
      console.error('Erreur parsing location:', e);
      return res.status(400).json({
        result: false,
        message: "Le champ location doit être un objet GeoJSON valide.",
        error: e.message,
      });
    }
  }

  // Validation du format GeoJSON pour location
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

  // L'URL de l'image uploadée sur Cloudinary
  const imageUrl = req.file && req.file.path ? req.file.path : null;

  // DEBUG : voir l'URL Cloudinary
  console.log('imageUrl:', imageUrl);

  const newDon = new Don({
    title,
    description,
    image: imageUrl,
    location: parsedLocation,
    user,
  });

  try {
    const savedDon = await newDon.save();
    res.status(201).json({ result: true, don: savedDon });
  } catch (err) {
    console.error('Erreur POST /dons:', err);
    res.status(500).json({ result: false, message: err.message, error: err });
  }
});

// GET - Récupérer les dons proches d'une position (optionnel)
router.get("/near", async (req, res) => {
  const { lng, lat, maxDistance = 5000 } = req.query; // maxDistance en mètres

  if (!lng || !lat) {
    return res.status(400).json({
      result: false,
      message: "Veuillez fournir les informations.",
    });
  }

  try {
    const dons = await Don.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance),
        },
      },
    }).populate("user", "username");

    res.json({ result: true, dons });
  } catch (err) {
    console.error('Erreur GET /dons/near:', err);
    res.status(500).json({ result: false, message: err.message, error: err });
  }
});

// DELETE - Supprimer un don par ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedDon = await Don.findByIdAndDelete(req.params.id);

    if (!deletedDon) {
      return res.status(404).json({
        result: false,
        message: "Don non trouvé.",
      });
    }

    res.json({
      result: true,
      message: "Don supprimé avec succès.",
      don: deletedDon,
    });
  } catch (err) {
    console.error('Erreur DELETE /dons/:id:', err);
    res.status(500).json({
      result: false,
      message: err.message,
      error: err,
    });
  }
});

// PUT - Mettre à jour un don par ID 
router.put("/:id", async (req, res) => {
  const { title, description, image, location } = req.body;

  if (!title || !description || !location) {
    return res.status(400).json({
      result: false,
      message: "Tous les champs obligatoires doivent être fournis.",
    });
  }

  try {
    const updatedDon = await Don.findByIdAndUpdate(
      req.params.id,
      { title, description, image, location },
      { new: true }
    );

    if (!updatedDon) {
      return res.status(404).json({
        result: false,
        message: "Don non trouvé.",
      });
    }

    res.json({ result: true, don: updatedDon });
  } catch (err) {
    console.error('Erreur PUT /dons/:id:', err);
    res.status(500).json({ result: false, message: err.message, error: err });
  }
});

// GET - Récupérer un don par ID (pour afficher les détails après un "press" sur une annonce)
router.get("/:id", async (req, res) => {
  try {
    const don = await Don.findById(req.params.id).populate("user", "username");

    if (!don) {
      return res.status(404).json({ result: false, message: "Don introuvable." });
    }

    res.json({ result: true, don });
  } catch (err) {
    console.error('Erreur GET /dons/:id:', err);
    res.status(500).json({ result: false, message: err.message, error: err });
  }
});

// ⭐ AJOUTER la fonction calculateDistance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // ⭐ Retourner en kilomètres avec 3 décimales pour précision
  return Math.round(distance * 1000) / 1000;
}

module.exports = router;