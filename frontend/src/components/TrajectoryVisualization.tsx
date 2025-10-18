import React, { useEffect, useRef } from 'react';
import type { ProcessingPose } from '@/api';

interface TrajectoryVisualizationProps {
  trajectory: ProcessingPose[];
  currentPose?: number[][] | null;
  width?: number;
  height?: number;
}

/**
 * Простая 2D визуализация траектории (вид сверху)
 * Отображает траекторию камеры как линию с точками
 */
const TrajectoryVisualization: React.FC<TrajectoryVisualizationProps> = ({
  trajectory,
  currentPose,
  width = 400,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || trajectory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    // Извлекаем координаты X и Z (вид сверху)
    const points = trajectory.map(pose => ({
      x: pose.pose[0][3],
      z: pose.pose[2][3],
      frame: pose.frame
    }));

    // Добавляем текущую позицию, если есть
    if (currentPose && currentPose[0] && currentPose[2]) {
      points.push({
        x: currentPose[0][3],
        z: currentPose[2][3],
        frame: -1 // помечаем как текущую
      });
    }

    if (points.length === 0) return;

    // Находим границы для масштабирования
    const xs = points.map(p => p.x);
    const zs = points.map(p => p.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    // Добавляем padding
    const padding = 40;
    const rangeX = maxX - minX || 1;
    const rangeZ = maxZ - minZ || 1;
    const scale = Math.min(
      (width - 2 * padding) / rangeX,
      (height - 2 * padding) / rangeZ
    );

    // Функция для преобразования координат в пиксели
    const toScreenX = (x: number) => padding + (x - minX) * scale;
    const toScreenY = (z: number) => height - padding - (z - minZ) * scale;

    // Рисуем сетку
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * (width - 2 * padding);
      const y = padding + (i / 10) * (height - 2 * padding);
      
      // Вертикальные линии
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Горизонтальные линии
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Рисуем траекторию
    if (points.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const firstPoint = points[0];
      ctx.moveTo(toScreenX(firstPoint.x), toScreenY(firstPoint.z));
      
      for (let i = 1; i < points.length - (currentPose ? 1 : 0); i++) {
        ctx.lineTo(toScreenX(points[i].x), toScreenY(points[i].z));
      }
      
      ctx.stroke();
    }

    // Рисуем точки траектории
    points.forEach((point, index) => {
      const screenX = toScreenX(point.x);
      const screenY = toScreenY(point.z);
      
      // Разные цвета для разных типов точек
      if (point.frame === -1) {
        // Текущая позиция - большой красный круг
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Добавляем пульсирующее кольцо
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 10, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (index === 0) {
        // Стартовая позиция - зеленый круг
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        // Обычные точки - маленькие синие круги
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Добавляем легенду
    const legendY = height - 15;
    const legendItems = [
      { color: '#22c55e', label: 'Старт', x: 10 },
      { color: '#3b82f6', label: 'Траектория', x: 80 },
      { color: '#ef4444', label: 'Текущая', x: 180 }
    ];

    ctx.font = '12px sans-serif';
    legendItems.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.x, legendY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#6b7280';
      ctx.fillText(item.label, item.x + 10, legendY + 4);
    });

    // Добавляем оси координат
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.fillText('X', width - 25, height - padding + 25);
    ctx.fillText('Z', padding - 25, 25);

  }, [trajectory, currentPose, width, height]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-border rounded-lg bg-background"
      />
      <p className="text-xs text-muted-foreground mt-2">
        Траектория камеры (вид сверху, XZ плоскость)
      </p>
    </div>
  );
};

export default TrajectoryVisualization;
