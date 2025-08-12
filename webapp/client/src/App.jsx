// client/src/App.jsx
import { useState } from 'react';

const App = () => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('a shattered cyberpunk city');


    // Tests server connection
  const testServer = async () => {
    try {
      console.log('Testing server connectivity...');
      const response = await fetch('http://localhost:3001/test');
      const data = await response.json();
      console.log('Server test successful:', data);
      alert(`Server is working! Response: ${data.message}`);
    } catch (error) {
      console.error('Server test failed:', error);
      alert(`Server test failed: ${error.message}`);
    }
  };

  // Tests request
  const testHealth = async () => {
    try {
      console.log('Testing POST endpoint...');
      const response = await fetch('http://localhost:3001/health', {
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
      const response = await fetch('http://localhost:3001/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Prompt uses LoRA trigger word + pixel art styling in lieu of accessing LoRA
          prompt: '(in the style of umempart:1.5), (pixel art, pixelated:1.4), (vivid colours:1.3) (masterpiece, exceptional, best aesthetic, best quality, masterpiece, extremely detailed:1.2)'
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
      
      {/* Debug buttons
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Debug Tools:</h3>
        <button 
          onClick={testServer}
          style={{
            padding: '0.5rem 1rem',
            margin: '0.5rem',
            backgroundColor: '#0c3516ff',
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
            backgroundColor: '#117a30ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test POST Endpoint
        </button>
      </div> */}
      
      {/* main app features */}
            {/* Custom prompt input */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Describe what you want to create:
        </label>
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="a shattered cyberpunk city"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '2px solid #ddd',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            boxSizing: 'border-box'
          }}
          maxLength={200}
        />
        <small style={{ color: '#666', fontSize: '0.9rem' }}>
          Your prompt will be combined with pixel art styling and the LoRA (sub-model) trigger word
        </small>
        
        {/* Show full prompt preview */}
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#007bff' }}>
            Preview full prompt
          </summary>
          <div style={{ 
            marginTop: '0.5rem',
            padding: '1rem',
            backgroundColor: '#242424ff',
            borderRadius: '4px',
            fontSize: '0.9rem',
            border: '1px solid #e9ecef'
          }}>
            "{customPrompt}, (in the style of umempart: 1.5), (pixel art, pixelated:1.3), (masterpiece, exceptional, best aesthetic, best quality, masterpiece, extremely detailed:1.2)"
          </div>
        </details>
      </div>
      
      <button 
        onClick={handleQuery} 
        disabled={loading || !customPrompt.trim()}
        style={{
          padding: '1rem 2rem',
          fontSize: '1rem',
          backgroundColor: loading || !customPrompt.trim() ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading || !customPrompt.trim() ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {loading ? 'Generating Pixel Art...' : 'Generate Pixel Art'}
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