import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const ModelViewer = () => {
    const mountRef = useRef(null);

    // Test

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Add lighting
        const light = new THREE.AmbientLight(0xffffff, 1);
        scene.add(light);

        // Load the FBX model
        const loader = new FBXLoader();
        loader.load(
            '/models/pots_the_raccoon/Pots - Production.fbx', 
            (object) => {
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(object);
            }, 
            undefined, 
            (error) => {
                console.error(`An error occurred while loading this model:`, error);
            }
        )

        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);

        }
        animate();

        return () => mountRef.current.removeChild(renderer.domElement);


    }, []);

    return <div ref = {mountRef} />;

};

export default ModelViewer;