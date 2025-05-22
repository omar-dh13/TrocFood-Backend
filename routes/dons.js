const express = require("express");
const router = express.Router();
const Don = require("../models/dons");
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trocfood_dons',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});
const upload = multer({ storage: storage });


// GET - Récupérer toutes les annonces (dons)
router.get("/", async (_req, res) => {
  try {
    const dons = await Don.find()
      .populate("user", "username")
      .sort({ createdAt: -1 });

    res.json({ result: true, dons });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
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

  // *On parse la chaîne de caractères en objet JSON
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
      return res.status(400).json({
        result: false,
        message: "Le champ location doit être un objet GeoJSON valide.",
      });
    }
  }

  // *Validation du format GeoJSON pour location
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
  const imageUrl = req.file ? req.file.path : null;

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
    res.status(500).json({ result: false, message: err.message });
  }
});

// GET - Récupérer les dons proches d'une position (optionnel)
router.get("/near", async (req, res) => {
  //* On récupère la longitude (lng), la latitude (lat) et la distance maximale (maxDistance) depuis la query string de la requête.
  //* Exemple d'appel : /near?lng=2.35&lat=48.85&maxDistance=5000
  const { lng, lat, maxDistance = 5000 } = req.query; // *maxDistance en mètres

  // *On vérifie que lng et lat sont bien fournis
  if (!lng || !lat) {
    return res.status(400).json({
      result: false,
      message: "Veuillez fournir lng et lat dans la query string.",
    });
  }

  try {
    // *On utilise l'opérateur $near de MongoDB pour trouver les dons proches d'un point donné.
    // *$geometry permet de spécifier le point de référence au format GeoJSON.
    // *parseFloat(lng) et parseFloat(lat) convertissent les valeurs reçues (qui sont des strings) en nombres à virgule flottante.
    // *$maxDistance définit la distance maximale (en mètres) autour du point pour la recherche.
    // *parseInt(maxDistance) convertit la valeur reçue (string) en entier.
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
    res.status(500).json({ result: false, message: err.message });
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
    res.status(500).json({
      result: false,
      message: err.message,
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
    res.status(500).json({ result: false, message: err.message });
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
    res.status(500).json({ result: false, message: err.message });
  }
});


module.exports = router;