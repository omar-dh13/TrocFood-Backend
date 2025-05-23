const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// POST /logmeal/recognize
router.post('/recognize', async (req, res) => {
  try {
    const { imageBase64 } = req.body;


    // 1. Reconnaissance du plat
    const recognitionResponse = await fetch('https://api.logmeal.es/v2/image/foodrecognition', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer VOTRE_TOKEN_LOGMEAL',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });
    const recognitionData = await recognitionResponse.json();


    // 2. Estimation du grammage
    const segmentationResponse = await fetch('https://api.logmeal.es/v2/image/segmentation/food', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer VOTRE_TOKEN_LOGMEAL',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });
    const segmentationData = await segmentationResponse.json();

    res.json({
      result: true,
      recognition: recognitionData,
      segmentation: segmentationData, // contient l'estimation du poids
    });
  } catch (err) {
    res.status(500).json({ result: false, error: err.message });
  }
});


module.exports = router;