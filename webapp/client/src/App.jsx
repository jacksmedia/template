// client/src/App.jsx
import { useState } from 'react';

function App() {
  const [hexDump, setHexDump] = useState('');


  async function handleUpload(e) {
    const formData = new FormData();
    formData.append('uploaded', e.target.files[0]);

    const response = await fetch('http://localhost:3001/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.text();
    setHexDump(result);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-2">🎊 Webapp 👨‍🏭</h1>
      <h5 className="text-sm mb-4">by xJ4cks & friends</h5>

    </div>
  );
}

export default App;
