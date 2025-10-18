import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ProcessingPose } from '@/api';

// Флаг для отладки - отключает отрисовку Three.js
const disableRender3dDebug = false;

interface OrbSlam3DVisualizationProps {
  trajectory: ProcessingPose[];
  currentPose?: number[][] | null;
  trackedPoints?: Array<{ x: number; y: number; z: number }>; // Current tracked points (highlighted)
  allMapPoints?: Array<{ x: number; y: number; z: number }>; // All accumulated map points
  showGrid?: boolean;
}

// Компонент для отображения камеры
const Camera3D: React.FC<{ pose: number[][]; isCurrent?: boolean }> = ({ pose, isCurrent = false }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (meshRef.current && pose) {
      // Создаём матрицу 4x4 из pose
      const matrix = new THREE.Matrix4();
      matrix.set(
        pose[0][0], pose[0][1], pose[0][2], pose[0][3],
        pose[1][0], pose[1][1], pose[1][2], pose[1][3],
        pose[2][0], pose[2][1], pose[2][2], pose[2][3],
        pose[3]?.[0] || 0, pose[3]?.[1] || 0, pose[3]?.[2] || 0, pose[3]?.[3] || 1
      );
      
      // Применяем трансформацию
      meshRef.current.position.setFromMatrixPosition(matrix);
      meshRef.current.quaternion.setFromRotationMatrix(matrix);
    }
  }, [pose]);

  return (
    <group ref={meshRef}>
      {/* Пирамида камеры */}
      <mesh>
        <coneGeometry args={[0.05, 0.1, 4]} />
        <meshStandardMaterial
          color={isCurrent ? '#ef4444' : '#3b82f6'}
          emissive={isCurrent ? '#dc2626' : '#2563eb'}
          emissiveIntensity={isCurrent ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Оси координат камеры (X-красный, Y-зелёный, Z-синий) */}
      <Line
        points={[[0, 0, 0], [0.1, 0, 0]]}
        color="red"
        lineWidth={2}
      />
      <Line
        points={[[0, 0, 0], [0, 0.1, 0]]}
        color="green"
        lineWidth={2}
      />
      <Line
        points={[[0, 0, 0], [0, 0, 0.1]]}
        color="blue"
        lineWidth={2}
      />
      
      {/* Пульсирующий эффект для текущей камеры */}
      {isCurrent && <PulsingRing />}
    </group>
  );
};

// Пульсирующее кольцо для текущей позиции
const PulsingRing: React.FC = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.3;
      ringRef.current.scale.set(scale, scale, scale);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      if (material.opacity !== undefined) {
        material.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
      }
    }
  });
  
  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[0.1, 0.01, 16, 32]} />
      <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
    </mesh>
  );
};

// Траектория (линия соединяющая позиции камеры)
const TrajectoryLine: React.FC<{ trajectory: ProcessingPose[] }> = ({ trajectory }) => {
  const points = useMemo(() => {
    return trajectory.map(pose =>
      new THREE.Vector3(pose.pose[0][3], pose.pose[1][3], pose.pose[2][3])
    );
  }, [trajectory]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color="#3b82f6"
      lineWidth={2}
    />
  );
};

// ORB точки (feature points)
const OrbPoints: React.FC<{
  points: Array<{ x: number; y: number; z: number }>;
  color?: string;
  size?: number;
  opacity?: number;
}> = ({ points, color = '#22c55e', size = 0.02, opacity = 0.8 }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    
    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [points]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={size}
        color={color}
        sizeAttenuation
        transparent
        opacity={opacity}
      />
    </points>
  );
};

// Стартовая позиция (зелёная сфера)
const StartMarker: React.FC<{ pose: number[][] }> = ({ pose }) => {
  return (
    <mesh position={[pose[0][3], pose[1][3], pose[2][3]]}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color="#22c55e"
        emissive="#16a34a"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
};

// Информационная панель
const InfoPanel: React.FC<{
  trajectoryLength: number;
  currentFrame?: number;
  trackedPointsCount?: number;
  allMapPointsCount?: number;
}> = ({ trajectoryLength, currentFrame, trackedPointsCount, allMapPointsCount }) => {
  return (
    <Html position={[0, 2, 0]} center>
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs space-y-1 min-w-[200px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Траектория:</span>
          <span className="font-bold text-blue-600">{trajectoryLength} точек</span>
        </div>
        {currentFrame !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Текущий кадр:</span>
            <span className="font-bold">{currentFrame}</span>
          </div>
        )}
        {trackedPointsCount !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Отслеживается:</span>
            <span className={`font-bold ${
              trackedPointsCount > 50 ? 'text-green-600' :
              trackedPointsCount > 15 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {trackedPointsCount}
            </span>
          </div>
        )}
        {allMapPointsCount !== undefined && allMapPointsCount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Точек карты:</span>
            <span className="font-bold text-gray-500">{allMapPointsCount}</span>
          </div>
        )}
        <div className="pt-2 border-t border-border space-y-1 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Старт</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Траектория</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Текущая</span>
          </div>
          {allMapPointsCount !== undefined && allMapPointsCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Карта (все)</span>
            </div>
          )}
          {trackedPointsCount !== undefined && trackedPointsCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span>Активные</span>
            </div>
          )}
        </div>
      </div>
    </Html>
  );
};

// Главный компонент сцены
const Scene: React.FC<OrbSlam3DVisualizationProps> = ({
  trajectory,
  currentPose,
  trackedPoints,
  allMapPoints,
  showGrid = true
}) => {
  return (
    <>
      {/* Освещение */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* Сетка */}
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#9ca3af"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {/* Оси координат мира */}
      <axesHelper args={[1]} />

      {/* Траектория */}
      {trajectory.length > 0 && (
        <>
          <TrajectoryLine trajectory={trajectory} />
          
          {/* Стартовая позиция */}
          <StartMarker pose={trajectory[0].pose} />
          
          {/* Камеры по траектории (каждую 10-ю для производительности) */}
          {trajectory
            .filter((_, index) => index % 10 === 0 || index === trajectory.length - 1)
            .map((point) => (
              <Camera3D key={`cam-${point.frame}`} pose={point.pose} />
            ))
          }
        </>
      )}

      {/* Текущая позиция камеры */}
      {currentPose && (
        <Camera3D pose={currentPose} isCurrent />
      )}

      {/* Все точки карты (серые, маленькие) */}
      {allMapPoints && allMapPoints.length > 0 && (
        <OrbPoints
          points={allMapPoints}
          color="#9ca3af"
          size={0.015}
          opacity={0.4}
        />
      )}

      {/* Текущие отслеживаемые точки (зелёные, яркие, крупнее) */}
      {trackedPoints && trackedPoints.length > 0 && (
        <OrbPoints
          points={trackedPoints}
          color="#22c55e"
          size={0.025}
          opacity={0.9}
        />
      )}

      {/* Информационная панель */}
      <InfoPanel
        trajectoryLength={trajectory.length}
        currentFrame={trajectory.length > 0 ? trajectory[trajectory.length - 1].frame : undefined}
        trackedPointsCount={trackedPoints?.length}
        allMapPointsCount={allMapPoints?.length}
      />

      {/* Управление камерой */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={0.5}
        maxDistance={50}
      />
    </>
  );
};

// Главный экспортируемый компонент
const OrbSlam3DVisualization: React.FC<OrbSlam3DVisualizationProps> = (props) => {
  // Если включен флаг отладки - не рендерим Three.js
  if (disableRender3dDebug) {
    return (
      <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500 rounded-lg p-4 text-yellow-200">
          <div className="text-lg font-bold mb-2">🔧 Режим отладки</div>
          <div className="text-sm">3D визуализация отключена (disableRender3dDebug = true)</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [3, 3, 3], fov: 60 }}
        className="bg-gradient-to-b from-slate-900 to-slate-800"
      >
        <Scene {...props} />
      </Canvas>
      
      {/* Подсказки управления */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2 text-xs text-muted-foreground">
        <div>🖱️ ЛКМ - Вращение</div>
        <div>🖱️ ПКМ - Перемещение</div>
        <div>🖱️ Колесо - Приближение</div>
      </div>
    </div>
  );
};

export default OrbSlam3DVisualization;
