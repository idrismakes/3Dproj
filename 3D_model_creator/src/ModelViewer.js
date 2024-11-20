import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ModelViewer = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGL3DRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);

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