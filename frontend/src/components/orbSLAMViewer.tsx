import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

const OrbSlamViewer: React.FC = () => {
    const [mapPoints, setMapPoints] = useState<THREE.BufferGeometry | null>(null);
    const [trajectoryPoints, setTrajectoryPoints] = useState<THREE.Vector3[]>([]);

    useEffect(() => {
        // Загрузка точек карты
        fetch('/map_points.txt')
            .then(response => response.text())
            .then(text => {
                const positions: number[] = [];
                const lines = text.split('\n');
                lines.forEach(line => {
                    const [x, y, z] = line.trim().split(' ').map(Number);
                    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                        positions.push(x, y, z);
                    }
                });

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                setMapPoints(geometry);
            })
            .catch(error => console.error('Error loading map points:', error));

        // Загрузка траектории
        fetch('/trajectory.txt')
            .then(response => response.text())
            .then(text => {
                const points: THREE.Vector3[] = [];
                const lines = text.split('\n');
                lines.forEach(line => {
                    const parts = line.trim().split(' ').map(Number);
                    if (parts.length >= 4) { // timestamp, x, y, z, ...
                        const x = parts[1];
                        const y = parts[2];
                        const z = parts[3];
                        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                            points.push(new THREE.Vector3(x, y, z));
                        }
                    }
                });
                setTrajectoryPoints(points);
            })
            .catch(error => console.error('Error loading trajectory:', error));
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas camera={{ position: [0, 5, 10], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                {/* Облако точек */}
                {mapPoints && (
                    <Points geometry={mapPoints}>
                        <PointMaterial
                            color="white"
                            size={0.01}
                            sizeAttenuation={true}
                            depthWrite={false}
                        />
                    </Points>
                )}

                {/* Траектория как линия */}
                {trajectoryPoints.length > 0 && (
                    <Line
                        points={trajectoryPoints}
                        color="red"
                        lineWidth={2}
                    />
                )}

                {/* Оси координат */}
                <primitive object={new THREE.AxesHelper(1)} />

                {/* Контролы для орбиты */}
                <OrbitControls />
            </Canvas>
        </div>
    );
};

export default OrbSlamViewer;