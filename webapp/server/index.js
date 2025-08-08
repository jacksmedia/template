const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

// Serves React app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// API route to handle the Hugging Face query
app.post('/query', async (req, res) => {
  try {
    const response = await query(req.body);
    res.json({ imageData: response });
  } catch (error) {
    console.error('Error querying Hugging Face API:', error);
    res.status(500).json({ error: 'Error querying Hugging Face API' });
  }
});


async function query(data) {
	const response = await fetch(
		"https://router.huggingface.co/fal-ai/fal-ai/flux-lora",
		{
			headers: {
				Authorization: `Bearer ${process.env.HF_TOKEN}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.blob();
	return result;
}


app.listen(3001, () => console.log(`Server running on ${port}`));
