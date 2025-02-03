import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = () => {
  const [images, setImages] = useState<File[]>([]);
  const [message, setMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileList = Array.from(event.target.files);
      if (fileList.length > 5) {
        setMessage('You can upload up to 5 images only.');
      } else {
        setImages(fileList);
        setMessage('');
      }
    }
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      setMessage('Please select images to upload.');
      return;
    }

    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));

    try {
      const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage(uploadResponse.data.message || 'Images uploaded successfully!');

      // Trigger model processing once images are uploaded
      const processResponse = await axios.post('http://localhost:5000/process-model');
      setMessage(processResponse.data.message);
    } catch (error) {
      console.error('Error uploading or processing images:', error);
      setMessage('Failed to upload or process images.');
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
      <h3>Upload Images</h3>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ marginBottom: '10px' }}
      />
      <button onClick={handleUpload} style={{ marginBottom: '10px' }}>
        Upload
      </button>
      <p>{message}</p>
      <ul>
        {images.map((image, index) => (
          <li key={index}>{image.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ImageUploader;
