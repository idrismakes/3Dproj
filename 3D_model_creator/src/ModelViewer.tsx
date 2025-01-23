import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const ModelViewer = () => {
    const mountRef = useRef(null);
    const modelRef = useRef(null);
    const controlsRef = useRef(null);
    const [lightIntensity, setLightIntensity] = useState(1);
    const [isSpinning, setIsSpinning] = useState(true);

    useEffect(() => {
        const scene = new THREE.Scene();

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        // camera.position.set(0, 1, 25);

        const initialCameraPosition = { x: 0, y: 20, z: 35 }; // Move camera higher (y: 5)
        camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000);
        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }

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

        // Load FBX model
        const loader = new FBXLoader();
        loader.load(
            '/models/LowPolyCharacter.fbx',
            (object) => {
                modelRef.current = object;
                object.scale.set(0.02, 0.02, 0.02);
                object.position.set(0, -1, 0);

                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(object);
            },
            undefined,
            (error) => console.error('Error loading model:', error)
        );

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
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, [lightIntensity, isSpinning]);

    // Reset camera position
        const resetCamera = () => {
            if (controlsRef.current) {
                controlsRef.current.reset();
            }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            {/* Control Panel */}
            <div style={{ padding: '10px', backgroundColor: '#f4f4f4', width: '200px' }}>
                <h3>Controls</h3>
                <button onClick={resetCamera} style={{ marginBottom: '10px' }}>
                    Reset Camera
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

            {/* 3D Viewer */}
            <div ref={mountRef} style={{ flex: 1 }} />
        </div>
    );
};

export default ModelViewer;
