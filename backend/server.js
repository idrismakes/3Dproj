const express = require('express');
const { exec } = require('child_process');
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
const modelsDir = path.join(__dirname, 'models');
const processedImagesDir = path.join(__dirname, 'processed_images');

[uploadsDir, modelsDir, processedImagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true }); // Ensures parent directories are created if needed
        console.log(`Created directory: ${dir}`);
    }
});

// Set up multer for image uploads
const upload = multer({ dest: uploadsDir });

// Function to call Blender in headless mode
const runBlender = (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(inputFile)) {
            return reject("Error: Input Blender file does not exist.");
        }
        const command = `blender -b ${inputFile} --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='${outputFile}', export_format='GLB')"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Blender error: ${error.message}`);
                return reject(error.message);
            }
            if (stderr) console.error(`Blender stderr: ${stderr}`);
            resolve(stdout);
        });
    });
};

// Serve static files
app.use('/models', express.static(modelsDir));
app.use('/processed_images', express.static(processedImagesDir));
app.use(cors({
    origin: 'http://localhost:5173',  // Allow frontend requests
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

    exec(`python3 ${scriptPath} ${imagePaths.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error processing images: ${error.message}`);
            return res.status(500).json({ error: 'Image processing failed', details: error.message });
        }
        if (stderr) {
            console.error(`Python stderr: ${stderr}`);
        }

        const processedImages = stdout.trim().split('\n').filter(filename => filename);
        res.json({ message: 'Images processed successfully', processedImages });
    });
});

// API: Process model with Blender
app.post('/process-model', async (req, res) => {
    const inputFile = path.join(modelsDir, 'input-model.blend');
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Model file not found at ${inputFile}`);
        return res.status(400).json({ error: 'Model file does not exist. Upload a .blend model first.' });
}
    const outputFile = path.join(modelsDir, 'output-model.glb');

    if (!fs.existsSync(inputFile)) {
        return res.status(400).json({ error: 'Model file does not exist' });
    }

    try {
        await runBlender(inputFile, outputFile);
        res.json({ message: 'Model processed successfully', modelUrl: `http://localhost:5000/models/output-model.glb` });
    } catch (error) {
        res.status(500).json({ error: `Blender processing failed: ${error}` });
    }
});

// API: Get latest processed model
app.get('/latest-model', (req, res) => {
    const modelPath = path.join(modelsDir, 'output-model.glb');
    if (fs.existsSync(modelPath)) {
        res.json({ modelUrl: `http://localhost:5000/models/output-model.glb` });
    } else {
        res.status(404).json({ message: 'No model available' });
    }
});

// Start server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
