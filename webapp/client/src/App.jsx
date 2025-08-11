import { useState } from 'react';

const App = () => {
  const [imageData, setImageData] = useState(null);

  const handleQuery = async () => {
    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_format: "b64_json",
          prompt:
            '(ruins, broken, snow, dappled sunlight:1.2), A futuristic cityscape in the style of Moebius',
          model: "black-forest-labs/flux-dev"
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const { data } = await response.json();
      const imageData = data.data[0].b64_json; // access initial JSON object
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
