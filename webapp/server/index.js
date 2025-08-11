// server/index.js
import { InferenceClient } from "@huggingface/inference";
import path from 'path';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const client = new InferenceClient(process.env.HF_TOKEN);
const fetch = global.fetch;
const port = 3001;
const __dirname = import.meta.dirname;

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
    const result = await client.textToImage({
      model: "black-forest-labs/FLUX.1-dev",
      provider: "fal-ai",            // Explicitly choose fal.ai
      inputs: req.body.prompt,       // Your prompt payload
      response_format: "b64_json"
    });
    res.json({ imageData: result.data[0].b64_json });
  } catch (error) {
    console.error("Error querying Fal AI via SDK:", error);
    res.status(500).json({ error: error.message });
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
