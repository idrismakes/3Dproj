import { useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');

  const fetchMessage = async () => {
    const response = await axios.get('http://localhost:5000');
    setMessage(response.data);

// yes

  };

  return (
    
    <div className='App'>
      <h1>3D Model Viewer</h1>
      <button onClick={fetchMessage}>Fetch Message</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
