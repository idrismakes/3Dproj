import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import axios from 'axios';

const ModelViewer = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef(new THREE.Scene());
    const modelRef = useRef<THREE.Object3D | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

    const [lightIntensity, setLightIntensity] = useState(1);
    const [isSpinning, setIsSpinning] = useState(true);
    const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 20, z: 35 });
    const [modelUrl, setModelUrl] = useState<string | null>(null);

    useEffect(() => {
        const scene = sceneRef.current;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000);
        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }
        rendererRef.current = renderer;

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, lightIntensity);
        scene.add(ambientLight);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 50;
        controlsRef.current = controls;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            if (modelRef.current && isSpinning) {
                modelRef.current.rotation.y += 0.01;
            }
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (renderer.domElement) {
                mountRef.current?.removeChild(renderer.domElement);
            }
        };
    }, [isSpinning]);

    // Fetch the latest processed model from backend
    useEffect(() => {
        const fetchModelUrl = async () => {
            try {
                const response = await axios.get('http://localhost:5000/latest-model');
                setModelUrl(response.data.modelUrl);
            } catch (error) {
                console.error('Error fetching model URL:', error);
            }
        };

        fetchModelUrl();
    }, []);

    // Load model when the URL updates
    useEffect(() => {
        if (modelUrl) {
            loadModel(modelUrl);
        }
    }, [modelUrl]);

    // Function to load models
    const loadModel = (modelUrl: string) => {
        const scene = sceneRef.current;

        // Remove previous model
        if (modelRef.current) {
            scene.remove(modelRef.current);
            modelRef.current = null;
        }

        const fileExtension = modelUrl.split('.').pop()?.toLowerCase();

        const loader =
            fileExtension === 'fbx' ? new FBXLoader() :
            fileExtension === 'gltf' || fileExtension === 'glb' ? new GLTFLoader() :
            null;

        if (!loader) {
            console.error(`Unsupported model format: ${fileExtension}`);
            return;
        }

        loader.load(
            modelUrl,
            (object) => {
                if (fileExtension === 'gltf' || fileExtension === 'glb') {
                    object = object.scene; // GLTF models have a `scene` property
                }

                object.scale.set(0.02, 0.02, 0.02);
                object.position.set(0, -1, 0);

                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(object);
                modelRef.current = object;
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    };

    const zoomIn = () => {
        setCameraPosition((prev) => ({
            ...prev,
            z: Math.max(prev.z - 1, 5),
        }));
    };

    const zoomOut = () => {
        setCameraPosition((prev) => ({
            ...prev,
            z: Math.min(prev.z + 1, 50),
        }));
    };

    const resetCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
            setCameraPosition({ x: 0, y: 20, z: 35 });
        }
    };

    // Update camera position when state changes
    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        }
    }, [cameraPosition]);

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ padding: '10px', backgroundColor: '#f4f4f4', width: '200px' }}>
                <h3>Controls</h3>
                <button onClick={resetCamera} style={{ marginBottom: '10px' }}>
                    Reset Camera
                </button>
                <button onClick={zoomIn} style={{ marginBottom: '10px' }}>
                    Zoom In
                </button>
                <button onClick={zoomOut} style={{ marginBottom: '10px' }}>
                    Zoom Out
                </button>
                <div>
                    <label>Light Intensity</label>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={lightIntensity}
                        onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                    />
                </div>
                <div>
                    <label>
                        <input
                            type="checkbox"
                            checked={isSpinning}
                            onChange={(e) => setIsSpinning(e.target.checked)}
                        />
                        Spin Model
                    </label>
                </div>
            </div>

            <div ref={mountRef} style={{ flex: 1 }} />
        </div>
    );
};

export default ModelViewer;
