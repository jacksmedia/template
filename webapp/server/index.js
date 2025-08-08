const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// app.post('/upload', upload.single('uploaded'), async (req, res) => {
//   const events = await parseMidiToEvents(req.file.path);
//   const path = require('path');
//   const hexes = translateEventsToFlatHex(events, schema);

//   fs.unlinkSync(req.file.path);

//   res.send(hexes.join(' '));
// });

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
