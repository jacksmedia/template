// client/src/App.jsx
import { useState } from 'react';

const App = () => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setImageData(null);

    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Prompt uses LoRA trigger word + pixel art styling in lieu of accessing LoRA
          prompt: '(ruins, broken, snow, dappled sunlight:1.2), A futuristic cityscape in the style of umempart, (pixel art, pixelated:1.2), (masterpiece, exceptional, best aesthetic, best quality, masterpiece, extremely detailed:1.2)'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${response.status} - ${errorData.error}`);
      }

      const data = await response.json();
      setImageData(data.imageData);

    } catch (error) {
      console.error('Error contacting server:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Demo HuggingFace FLUX Pixel Art Generator</h1>
      <p>built with open resources by Jacks Media</p>
      <h3>Custom prompt feature coming soon!</h3>
      <button 
        onClick={handleQuery} 
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          backgroundColor: loading ? '#ccc' : '#126c80ff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Generating...' : 'Generate Pixel Art'}
      </button>
      
      {error && (
        <div style={{
          color: 'red',
          marginTop: '1rem',
          padding: '1rem',
          border: '1px solid red',
          borderRadius: '5px',
          backgroundColor: '#ffebee'
        }}>
          Error: {error}
        </div>
      )}
      
      {imageData && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Generated Image:</h2>
          <img
            src={`data:image/png;base64,${imageData}`}
            alt="Generated pixel art"
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default App;