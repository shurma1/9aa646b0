import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import type { ProcessingCompleteResponse } from '@/api';

interface ProcessingResultsProps {
  result: ProcessingCompleteResponse;
  onReset?: () => void;
}

const ProcessingResults: React.FC<ProcessingResultsProps> = ({ result, onReset }) => {
  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (frames: number, fps: number = 30): string => {
    const seconds = frames / fps;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Обработка завершена успешно
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Typography.p className="font-medium text-muted-foreground">Статус</Typography.p>
              <Typography.p className="capitalize">{result.status}</Typography.p>
            </div>
            <div>
              <Typography.p className="font-medium text-muted-foreground">ID файла</Typography.p>
              <Typography.p className="font-mono text-xs">{result.id}</Typography.p>
            </div>
            <div>
              <Typography.p className="font-medium text-muted-foreground">Всего кадров</Typography.p>
              <Typography.p>{result.total_frames}</Typography.p>
            </div>
            <div>
              <Typography.p className="font-medium text-muted-foreground">Обработано кадров</Typography.p>
              <Typography.p>{result.processed_frames}</Typography.p>
            </div>
            <div>
              <Typography.p className="font-medium text-muted-foreground">Точек траектории</Typography.p>
              <Typography.p>{result.trajectory.length}</Typography.p>
            </div>
            <div>
              <Typography.p className="font-medium text-muted-foreground">Длительность</Typography.p>
              <Typography.p>{formatDuration(result.total_frames)}</Typography.p>
            </div>
          </div>
          
          {onReset && (
            <div className="pt-4 border-t">
              <button
                onClick={onReset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Обработать новый файл
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Данные траектории</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Typography.p className="text-sm text-muted-foreground">
                Показаны первые 5 точек из {result.trajectory.length}
              </Typography.p>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.trajectory.slice(0, 5).map((point, index) => (
                <details key={index} className="group">
                  <summary className="cursor-pointer p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <span className="font-mono text-sm">
                      Кадр {point.frame} - Матрица позы 4x4
                    </span>
                  </summary>
                  <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                    <pre className="text-xs font-mono overflow-x-auto">
                      {point.pose.map((row, rowIndex) => (
                        <div key={rowIndex}>
                          [{row.map(val => val.toFixed(6)).join(', ')}]
                        </div>
                      ))}
                    </pre>
                  </div>
                </details>
              ))}
            </div>
            
            {result.trajectory.length > 5 && (
              <Typography.p className="text-xs text-muted-foreground text-center">
                ... и еще {result.trajectory.length - 5} точек
              </Typography.p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Экспорт данных</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(result, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `trajectory_${result.id}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Скачать как JSON
          </button>
          
          <button
            onClick={() => {
              // Создаем CSV с данными траектории
              const csvHeader = 'frame,x,y,z,qw,qx,qy,qz\n';
              const csvData = result.trajectory.map(point => {
                // Извлекаем позицию и поворот из матрицы 4x4
                const x = point.pose[0][3];
                const y = point.pose[1][3];
                const z = point.pose[2][3];
                
                // Упрощенное извлечение кватерниона (для демонстрации)
                const qw = Math.sqrt(1 + point.pose[0][0] + point.pose[1][1] + point.pose[2][2]) / 2;
                const qx = (point.pose[2][1] - point.pose[1][2]) / (4 * qw);
                const qy = (point.pose[0][2] - point.pose[2][0]) / (4 * qw);
                const qz = (point.pose[1][0] - point.pose[0][1]) / (4 * qw);
                
                return `${point.frame},${x},${y},${z},${qw},${qx},${qy},${qz}`;
              }).join('\n');
              
              const fullCsv = csvHeader + csvData;
              const dataBlob = new Blob([fullCsv], {type: 'text/csv'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `trajectory_${result.id}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Скачать как CSV
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingResults;