const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

app.use(express.json());

// Directory where models are stored
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir);
}

// Function to call Blender in headless mode
const runBlender = (inputFile, outputFile) => {
    return new Promise((resolve, reject) => {
        const command = `blender -b ${inputFile} --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='${outputFile}', export_format='GLB')"`; // Export as GLB
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Blender: ${error.message}`);
                reject(`Error executing Blender: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Blender stderr: ${stderr}`);
            }
            resolve(stdout);
        });
    });
};

// Serve static models
app.use('/models', express.static(modelsDir));

// Root endpoint
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// API to process model
app.post('/process-model', async (req, res) => {
    const inputFile = '/path/to/your/model.blend'; // Update this with your actual model path
    const outputFile = path.join(modelsDir, 'output-model.glb'); // Output GLTF model

    try {
        await runBlender(inputFile, outputFile);
        res.json({ message: 'Model processed successfully', modelUrl: `http://localhost:5000/models/output-model.glb` });
    } catch (error) {
        res.status(500).json({ message: 'Error processing model', error });
    }
});

// API to get the latest processed model
app.get('/latest-model', (req, res) => {
    const modelPath = path.join(modelsDir, 'output-model.glb');

    if (fs.existsSync(modelPath)) {
        res.json({ modelUrl: `http://localhost:5000/models/output-model.glb` });
    } else {
        res.status(404).json({ message: 'No model available' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
