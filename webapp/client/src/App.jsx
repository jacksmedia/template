import { useState } from 'react';

const App = () => {
  const [imageData, setImageData] = useState(null);

  const handleQuery = async () => {
    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_mode: true,
          prompt:
            '(ruins, broken, snow, dappled sunlight:1.2), sun, tree, forest, scenery, rock, reflection, ancient, overgrown, mountains, sunset, clouds, mountainous horizon, fantasy, medieval, 1other, looking away, (pixel art, pixelated:1.2), (masterpiece, exceptional, best aesthetic, best quality, masterpiece, extremely detailed:1.2), in the style of umempart',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const { imageData } = await response.json();
      setImageData(imageData);
    } catch (error) {
      console.error('Error contacting Hugging Face API:', error);
    }
  };

  return (
    <div>
      <button onClick={handleQuery}>Query Hugging Face</button>
      {imageData && (
        <img
          src={`data:image/png;base64,${imageData}`}
          alt="Hugging Face model response"
          style={{ maxWidth: '500px', display: 'block', marginTop: '1rem' }}
        />
      )}
    </div>
  );
};

export default App;
