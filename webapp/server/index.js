const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());


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


app.listen(3001, () => console.log('Server running on http://localhost:3001'));
