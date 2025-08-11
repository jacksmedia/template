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

// endpoint (inference provider)
// const HF_MODEL_URL = 'https://router.huggingface.co/jayavibhav/pixel-art-style';
const HF_MODEL_URL = 'https://router.huggingface.co/nebius/v1/images/generations';

// access HF from our server
app.post('/query', async (req, res) => {
  try {
    const hfResponse = await queryHuggingFace(req.body);
    // Pass HF's JSON straight through to the client
    res.json(hfResponse);
  } catch (error) {
    console.error('Error querying Hugging Face API:', error);
    res.status(500).json({ error: 'Error querying Hugging Face API' });
  }
});

async function queryHuggingFace(data) {
  const response = await fetch(
    HF_MODEL_URL, {
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
  }

  // HF returns JSON with { data: [{ b64_json: "..." }] }
  return await response.json();
}

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
