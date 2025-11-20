import { useState } from 'react';
import './App.css';
import axios from 'axios';
import ModelViewer from './ModelViewer';
import ImageUploader from './ImageUploader';

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
    <div className="app-root">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="title">3D Model Generator</h1>
          <div className="header-actions">
            <button className="btn" onClick={fetchMessage}>
              Fetch Backend Message
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {message && <div className="backend-message">{message}</div>}

        <div className="layout-grid">
          <aside className="left-column">
            <div className="uploader-card">
              <h2>Upload Images</h2>
              <ImageUploader />
            </div>
          </aside>

          <section className="center-column">
            <ModelViewer />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
