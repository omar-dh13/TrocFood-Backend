const express = require('express');
const router = express.Router();
const User = require('../models/users');

// GET - Récupérer les favoris d'un utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('favorites');
    if (!user) return res.status(404).json({ result: false, message: 'User not found' });
    res.json({ result: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// POST - Ajouter un favori
router.post('/:userId', async (req, res) => {
  try {
    const { donId } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ result: false, message: 'User not found' });
    if (!user.favorites.includes(donId)) user.favorites.push(donId);
    await user.save();
    res.json({ result: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

// DELETE - Retirer un favori
router.delete('/:userId/:donId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ result: false, message: 'User not found' });
    user.favorites = user.favorites.filter(id => id.toString() !== req.params.donId);
    await user.save();
    res.json({ result: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});

module.exports = router;