import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = () => {
  const [images, setImages] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [processedImages, setProcessedImages] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileList = Array.from(event.target.files);
      if (fileList.length > 5) {
        setMessage('❌ You can upload up to 5 images only.');
      } else {
        setImages(fileList);
        setMessage('');
      }
    }
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      setMessage('⚠️ Please select images to upload.');
      return;
    }

    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));

    console.log("📤 Sending FormData:", images.map(img => img.name));

    try {
      // Upload images to backend
      const uploadResponse = await axios.post('http://localhost:5000/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log("✅ Upload response:", uploadResponse.data);
      setMessage(uploadResponse.data.message || '✅ Images uploaded successfully!');

      if (uploadResponse.data.processedImages) {
        setProcessedImages(uploadResponse.data.processedImages);
      }

      // Trigger model processing
      console.log("🔄 Triggering model processing...");
      const processResponse = await axios.post('http://localhost:5000/process-model');
      console.log("✅ Process response:", processResponse.data);
      setMessage((prev) => prev + '\n' + processResponse.data.message);
    } catch (error: any) {
      console.error('❌ Error uploading or processing images:', error.response?.data || error.message);
      setMessage('❌ Failed to upload or process images.');
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

      {images.length > 0 && (
        <div>
          <h4>🖼 Selected Images:</h4>
          <ul>
            {images.map((image, index) => (
              <li key={index}>
                {image.name}
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Uploaded ${index}`}
                  width="100"
                  style={{ marginLeft: '10px' }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {processedImages.length > 0 && (
        <div>
          <h4>📌 Processed Images:</h4>
          <ul>
            {processedImages.map((image, index) => (
              <li key={index}>
                <img
                  src={`http://localhost:5000/processed_images/${image}`}
                  alt={`Processed ${index}`}
                  width="100"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
