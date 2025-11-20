import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import axios from 'axios';

const ModelViewer = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef(new THREE.Scene());
    const modelRef = useRef<THREE.Object3D | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const placeholderRef = useRef<THREE.Object3D | null>(null);

    const [lightIntensity, setLightIntensity] = useState(1);
    const [isSpinning, setIsSpinning] = useState(true);
    const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 20, z: 35 });
    const [modelUrl, setModelUrl] = useState<string | null>(null);

    useEffect(() => {
        const scene = sceneRef.current;
        const container = mountRef.current;
        if (!container) return;

        // Camera setup (use container aspect)
        const { clientWidth: w, clientHeight: h } = container;
        const camera = new THREE.PerspectiveCamera(60, w / Math.max(h, 1), 0.1, 2000);
        camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setClearColor(0x000000);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Ambient light + directional fill light
        const ambientLight = new THREE.AmbientLight(0xffffff, lightIntensity * 0.8);
        ambientLightRef.current = ambientLight;
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        scene.add(dirLight);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 5;
        controls.maxDistance = 100;
        controlsRef.current = controls;

        let mounted = true;

        // Animation loop
        const animate = () => {
            if (!mounted) return;
            requestAnimationFrame(animate);
            if (modelRef.current && isSpinning) {
                modelRef.current.rotation.y += 0.01;
            }
            // gently spin placeholder if no model is present
            if (!modelRef.current && placeholderRef.current && isSpinning) {
                placeholderRef.current.rotation.y += 0.006;
            }
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Helpers: grid and axes for orientation
        const grid = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        grid.position.y = -1.5;
        scene.add(grid);

        const axes = new THREE.AxesHelper(5);
        scene.add(axes);

        // Placeholder test mesh in case no model is available
        const placeholderGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const placeholderMat = new THREE.MeshStandardMaterial({ color: 0x6ea8fe, metalness: 0.2, roughness: 0.6 });
        const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat);
        placeholder.position.set(0, 0, 0);
        placeholder.visible = true;
        scene.add(placeholder);
        placeholderRef.current = placeholder;

        // Resize handler
        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / Math.max(h, 1);
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            mounted = false;
            window.removeEventListener('resize', handleResize);
            controls.dispose();
            if (renderer.domElement && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
            scene.clear();
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

    // Update ambient light intensity when changed
    useEffect(() => {
        if (ambientLightRef.current) {
            ambientLightRef.current.intensity = lightIntensity;
        }
    }, [lightIntensity]);

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

                        // If a placeholder exists, remove it
                        if (placeholderRef.current) {
                            try { scene.remove(placeholderRef.current); } catch {}
                            placeholderRef.current = null;
                        }

                        // attempt to compute bounding box and normalize scale & center
                        try {
                            const box = new THREE.Box3().setFromObject(object as THREE.Object3D);
                            const size = box.getSize(new THREE.Vector3());
                            const maxDim = Math.max(size.x, size.y, size.z);
                            if (maxDim > 0) {
                                const scale = 4 / maxDim;
                                object.scale.setScalar(object.scale.x * scale);
                            }
                            const center = box.getCenter(new THREE.Vector3());
                            object.position.sub(center);
                        } catch (err) {
                            // ignore bounding errors
                        }

                        scene.add(object);
                        modelRef.current = object as THREE.Object3D;
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
                // show placeholder if loading failed
                if (placeholderRef.current) {
                    placeholderRef.current.visible = true;
                }
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
        if (controlsRef.current && cameraRef.current) {
            controlsRef.current.reset();
            cameraRef.current.position.set(0, 20, 35);
            cameraRef.current.lookAt(new THREE.Vector3(0, 0, 0));
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
        <div className="model-viewer" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
            <div className="canvas-area" ref={mountRef} />

            <div className="model-controls" style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <h3 style={{ margin: 0 }}>Controls</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn" onClick={resetCamera}>Reset Camera</button>
                        <button className="btn" onClick={zoomIn}>Zoom In</button>
                        <button className="btn" onClick={zoomOut}>Zoom Out</button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: 12, marginBottom: 6 }}>Light Intensity</label>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={lightIntensity}
                            onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                        />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="checkbox"
                            checked={isSpinning}
                            onChange={(e) => setIsSpinning(e.target.checked)}
                        />
                        <span>Spin Model</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ModelViewer;
