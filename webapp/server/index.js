// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = global.fetch;
require('dotenv').config();

const app = express();
const port = 3001;

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Serve React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// HF endpoint (inference provider)
const HF_MODEL_URL = 'https://router.huggingface.co/fal-ai/fal-ai/flux-lora';

app.post('/query', async (req, res) => {
  try {
    const imageBase64 = await queryHuggingFace(req.body);
    res.json({ imageData: imageBase64 });
  } catch (error) {
    console.error('Error querying Hugging Face API:', error);
    res.status(500).json({ error: 'Error querying Hugging Face API' });
  }
});

async function queryHuggingFace(data) {
  const response = await fetch(HF_MODEL_URL, {
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
  }

  // Converts blob -> ArrayBuffer -> Buffer -> Base64 for image serve
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
