// client/src/App.jsx
import { useState } from 'react';

const App = () => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Test server connectivity
  const testServer = async () => {
    try {
      console.log('Testing server connectivity...');
      const response = await fetch('/test');
      const data = await response.json();
      console.log('Server test successful:', data);
      alert(`Server is working! Response: ${data.message}`);
    } catch (error) {
      console.error('Server test failed:', error);
      alert(`Server test failed: ${error.message}`);
    }
  };

  // Test POST endpoint
  const testHealth = async () => {
    try {
      console.log('Testing POST endpoint...');
      const response = await fetch('/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });
      const data = await response.json();
      console.log('Health check successful:', data);
      alert(`Health check passed! Server received: ${JSON.stringify(data.body)}`);
    } catch (error) {
      console.error('Health check failed:', error);
      alert(`Health check failed: ${error.message}`);
    }
  };

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setImageData(null);

    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Updated prompt to use trigger word and pixel art styling
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
      <h1>HuggingFace FLUX Pixel Art Generator</h1>
      
      {/* Debug buttons */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#5f5f5f', borderRadius: '8px' }}>
        <h3>Debug Tools:</h3>
        <button 
          onClick={testServer}
          style={{
            padding: '0.5rem 1rem',
            margin: '0.5rem',
            backgroundColor: '#1bc442ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Server (GET)
        </button>
        <button 
          onClick={testHealth}
          style={{
            padding: '0.5rem 1rem',
            margin: '0.5rem',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test POST Endpoint
        </button>
      </div>
      
      <button 
        onClick={handleQuery} 
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          backgroundColor: loading ? '#ccc' : '#007bff',
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