import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const ModelViewer = () => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const modelRef = useRef<THREE.Object3D | null>(null); // Store model reference

    useEffect(() => {
        const scene = new THREE.Scene();

        // Set up camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 1, 25); // Move camera farther back

        // Set up WebGL renderer
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Add renderer to the DOM
        if (mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
        }

        // Add lighting
        const light = new THREE.AmbientLight(0xffffff, 1);
        scene.add(light);

        // Load the FBX model
        const loader = new FBXLoader();
        loader.load(
            '/models/LowPolyCharacter.fbx',
            (object) => {
                // Store the model reference
                modelRef.current = object;

                // Adjust scale and position of the model
                object.scale.set(0.02, 0.02, 0.02);
                object.position.set(0, -1, 0);

                // Traverse the model's children to apply shadows if necessary
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Add the model to the scene
                scene.add(object);
            },
            undefined,
            (error) => {
                console.error('An error occurred while loading the model:', error);
            }
        );

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            if (modelRef.current) {
                // Make the model spin by rotating it around the Y-axis
                modelRef.current.rotation.y += 0.01; // Adjust speed of spin here
            }

            // Render the scene
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup on component unmount
        return () => {
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div id="model-container" ref={mountRef} />;
};

export default ModelViewer;
