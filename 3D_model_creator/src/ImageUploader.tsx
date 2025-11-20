import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader = () => {
  const [images, setImages] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [processedImages, setProcessedImages] = useState<string[]>([]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

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
    <div className="uploader">
      <div className="uploader-controls">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="file-input"
          aria-label="Upload images"
        />
        <button className="btn primary" onClick={handleUpload}>
          Upload
        </button>
      </div>

      {message && <div className="upload-message">{message}</div>}

      {images.length > 0 && (
        <div className="preview-grid">
          {images.map((image, index) => (
            <div className="preview-item" key={index}>
              <button
                className="preview-remove"
                aria-label={`Remove ${image.name}`}
                onClick={() => removeImage(index)}
              >
                ×
              </button>
              <img src={URL.createObjectURL(image)} alt={`Uploaded ${index}`} />
              <div className="preview-name">{image.name}</div>
              <button className="preview-delete" onClick={() => removeImage(index)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {processedImages.length > 0 && (
        <div className="processed-grid">
          {processedImages.map((image, index) => (
            <div className="processed-item" key={index}>
              <img
                src={`http://localhost:5000/processed_images/${image}`}
                alt={`Processed ${index}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
