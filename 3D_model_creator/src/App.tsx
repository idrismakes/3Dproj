import { useState } from 'react';
import './App.css';
import axios from 'axios';
import ModelViewer from './ModelViewer'; // Import the ModelViewer component
import ImageUploader from './ImageUploader'; // Import the ImageUploader component

function App() {
  const [message, setMessage] = useState('');

  const fetchMessage = async () => {
    try {
      const response = await axios.get('http://localhost:5000');
      setMessage(response.data);
    } catch (error) {
      console.error('Error fetching the message:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>3D Model Viewer</h1>
        <button onClick={fetchMessage}>Fetch Backend Message</button>
      </header>
      <main>
        <p>{message}</p>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          {/* ImageUploader for uploading images */}
          <div style={{ width: '30%', padding: '10px' }}>
            <h2>Upload Images</h2>
            <ImageUploader />
          </div>
          {/* ModelViewer for displaying the spinning model */}
          <div style={{ width: '70%' }}>
            <ModelViewer />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
