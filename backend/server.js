const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for frontend communication

// Setup directories
const uploadsDir = path.join(__dirname, 'uploads');
const datasetDir = path.join(__dirname, 'dataset');
const processedImagesDir = path.join(__dirname, 'processed_images');
const modelCheckpointsDir = path.join(__dirname, 'model_checkpoints');

[uploadsDir, datasetDir, processedImagesDir, modelCheckpointsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Set up multer for image uploads
const upload = multer({ dest: uploadsDir });

// Serve static files
app.use('/processed_images', express.static(processedImagesDir));
app.use(cors({
    origin: 'http://localhost:5173', // Frontend port
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Root endpoint
app.get('/', (req, res) => res.send('Backend is running!'));

// API: Upload and preprocess images
app.post('/upload-images', upload.array('images', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
    }

    const imagePaths = req.files.map(file => path.join(uploadsDir, file.filename));
    const scriptPath = path.join(__dirname, 'image_preprocessing.py');

    const process = spawn('python3', [scriptPath, ...imagePaths]);

    let processedImages = [];

    process.stdout.on('data', (data) => {
        processedImages = data.toString().trim().split('\n').filter(filename => filename);
    });

    process.stderr.on('data', (data) => {
        console.error(`Python stderr: ${data.toString()}`);
    });

    process.on('close', (code) => {
        if (code === 0) {
            res.json({ message: 'Images processed successfully', processedImages });
        } else {
            res.status(500).json({ error: 'Image processing failed' });
        }
    });
});

// API: Train PyTorch Model
app.post('/train-model', (req, res) => {
    const trainScriptPath = path.join(__dirname, 'train_model.py');

    const process = spawn('python3', [trainScriptPath]);

    process.stdout.on('data', (data) => {
        console.log(`Training output: ${data.toString()}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`Training error: ${data.toString()}`);
    });

    process.on('close', (code) => {
        if (code === 0) {
            res.json({ message: '✅ Model trained successfully' });
        } else {
            res.status(500).json({ error: '❌ Model training failed' });
        }
    });
});

// API: Predict with PyTorch Model
app.post('/predict', (req, res) => {
    const predictScriptPath = path.join(__dirname, 'predict_model.py');

    const process = spawn('python3', [predictScriptPath]);

    let predictionResult = '';

    process.stdout.on('data', (data) => {
        predictionResult += data.toString();
    });

    process.stderr.on('data', (data) => {
        console.error(`Prediction error: ${data.toString()}`);
    });

    process.on('close', (code) => {
        if (code === 0) {
            res.json({ message: '✅ Prediction completed', result: predictionResult.trim() });
        } else {
            res.status(500).json({ error: '❌ Prediction failed' });
        }
    });
});

// Start server
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
