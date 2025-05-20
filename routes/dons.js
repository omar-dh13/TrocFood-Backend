const express = require('express');
const router = express.Router();
const Don = require('../models/don');


// GET - Récupérer toutes les annonces (dons)
router.get('/', async (req, res) => {
  try {
    const dons = await Don.find()
      .populate('user', 'username') // ← Affiche le nom de la personne
      .sort({ createdAt: -1 });

    res.json({ result: true, dons });
  } catch (err) {
    res.status(500).json({ result: false, message: err.message });
  }
});


module.exports = router;
