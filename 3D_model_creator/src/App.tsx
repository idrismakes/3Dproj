import { useState } from 'react';
import './App.css';
import axios from 'axios';
import ModelViewer from './ModelViewer'; // Import the ModelViewer component

function App() {
  const [message, setMessage] = useState('');

  const fetchMessage = async () => {
    const response = await axios.get('http://localhost:5000');
    setMessage(response.data);

  };

  return (
    
    <div className='App'>
      {/* <h1>3D Model Viewer</h1>
      <button onClick={fetchMessage}>Fetch Message</button> */}
      <p>{message}</p>

      <ModelViewer />
    </div>
  );
}

export default App;
