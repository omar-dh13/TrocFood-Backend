const express = require("express");
const router = express.Router();
const Don = require("../models/dons");
const cloudinary = require('../config/cloudinary');


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
router.post("/", async (req, res) => {
  const { title, description, image, location, user } = req.body;

  if (!title || !description || !location || !user) {
    return res.status(400).json({
      result: false,
      message: "Tous les champs obligatoires doivent être fournis.",
    });
  }

  const newDon = new Don({
    title,
    description,
    image,
    location,
    user,
  });

  try {
    const savedDon = await newDon.save();
    res.status(201).json({ result: true, don: savedDon });
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