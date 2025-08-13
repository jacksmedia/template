# PWA template
A generic fullstack webapp backbone built with node + express + react.
Bootstrapped with Vite. Intended for use with Vercel, but can work with any modern hosting platform.

## Running this webapp

1.Start the backend server from the directory `/server` with the command:

`node index.js`

2.From the frontend folder (`/client`), with the server running on localhost:3001,
type:

`npm run dev`

## Details
App is intended to demonstrate the HuggingFace ecosystem of text-to-image models by querying one (Flux) and rendering an image based on a hardcoded text prompt.

Severe rate limiting will exist when this app is deployed in order to prevent abuse and prohibitive charges to the account that's behind this project.

The LoRA chosen is here: (Modern Pixel Art)[https://huggingface.co/UmeAiRT/FLUX.1-dev-LoRA-Modern_Pixel_art]

Since the existing HF infra does not currently provide access to LoRAs, the main model is queried instead, and the trigger token for this LoRA is used to access its training weights.The main model is here: (Black Forest Labs Flux1)[https://huggingface.co/black-forest-labs/FLUX.1-dev]