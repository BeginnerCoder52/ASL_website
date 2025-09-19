const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const FormData = require('form-data');

// Configure multer to handle file upload in memory
const upload = multer();

// Your API Ninjas key (ensure you secure this in production)
const API_KEY = "aeJ22gw8hVDI74qYSyVoog==UlRS4HWbbk0qVxjd";

// POST /api/predict : accepts an image and returns caption with ASL image URLs.
router.post('/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Prepare form data to call API Ninjas endpoint
    const form = new FormData();
    form.append('image', req.file.buffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });

    const apiResponse = await axios.post(
      "https://api.api-ninjas.com/v1/imagetotext",
      form,
      {
        headers: {
          'X-Api-Key': API_KEY,
          ...form.getHeaders(),
        },
      }
    );

    let caption = "";
    if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
      caption = apiResponse.data[0].text;
    } else if (typeof apiResponse.data === 'object') {
      caption = apiResponse.data.text;
    }

    // For each alphanumeric character in caption, get a sample ASL image URL.
    // Our dataset is located at ../AI/data/DATASET relative to backend folder.
    const datasetDir = path.join(__dirname, '../AI/data/DATASET');
    let aslImages = [];

    for (const char of caption.toUpperCase()) {
      if (/[A-Z0-9]/.test(char)) {
        const charDir = path.join(datasetDir, char);
        if (fs.existsSync(charDir)) {
          const files = fs.readdirSync(charDir);
          if (files.length > 0) {
            // Use the first image file.
            // Build a public URL assuming your static files are served under /static/dataset
            const fileUrl = path.join(char, files[0]).replace(/\\/g, '/');
            aslImages.push(fileUrl);
          }
        }
      }
    }
    
    // Respond with the caption and ASL image URLs (to be appended to /static/dataset )
    return res.json({ caption, aslImages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;