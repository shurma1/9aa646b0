import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { pollProcessingStatus } from '@/api/uploadApi';
import CombinedVisualization from '@/components/CombinedVisualization';
import { API_CONFIG } from '@/api/config';
import type { ProcessingResponse, ProcessingCompleteResponse } from '@/api';

const ProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'processing' | 'complete' | 'error'>('loading');
  const [processingData, setProcessingData] = useState<ProcessingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoFrame, setCurrentVideoFrame] = useState<number>(0);
  
  // Construct video URL from API config
  const videoUrl = id ? `${API_CONFIG.baseURL}/processing/${id}/video` : '';
	
	
	useEffect(() => {
		console.log('processingData', processingData)
	}, [processingData]);
  
  useEffect(() => {
    if (!id) {
      setError('ID обработки не указан');
      setStatus('error');
      return;
    }

    const pollingControl = pollProcessingStatus(
      id,
      (response) => {
        setProcessingData(response);

        if (response.type === 'progress') {
          setStatus('processing');
        } else if (response.type === 'complete') {
          setStatus('complete');
        } else if (response.type === 'error') {
          setStatus('error');
          setError(response.error);
        }
      },
      2000 // polling interval
    );

    return () => {
      pollingControl.stop();
    };
  }, [id]);

  const renderTrajectoryPoints = () => {
    if (!processingData || processingData.type !== 'complete') {
      return null;
    }

    const completeData = processingData as ProcessingCompleteResponse;

    return (
      <>
        {/* Визуализация завершённой траектории */}
        <div className="mt-6">
          <CombinedVisualization
            trajectory={completeData.trajectory}
            allMapPoints={completeData.all_map_points}
            showGrid={true}
            videoUrl={videoUrl}
            currentFrame={currentVideoFrame}
            points2D={completeData.keypoints_2d}
            videoWidth={1920}
            videoHeight={1080}
            threeDHeight="500px"
            canvasHeight="500px"
          />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Точки траектории</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <Typography.p className="text-sm text-muted-foreground">
                Всего точек: {completeData.trajectory.length}
              </Typography.p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(completeData.trajectory, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `trajectory_${id}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Скачать JSON
                </button>
                <button
                  onClick={() => {
                    navigate('/');
                  }}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Загрузить новый файл
                </button>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-3">
              {completeData.trajectory.map((point, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Typography.p className="font-mono font-semibold">
                      Точка {index + 1} / Кадр {point.frame}
                    </Typography.p>
                  </div>
                  
                  <div className="bg-background p-3 rounded border border-border">
                    <Typography.p className="text-xs font-mono text-muted-foreground mb-2">
                      Матрица позы 4x4:
                    </Typography.p>
                    <pre className="text-xs font-mono overflow-x-auto">
                      {point.pose.map((row, rowIndex) => (
                        <div key={rowIndex} className="leading-relaxed">
                          [{row.map(val => val.toFixed(6).padStart(10)).join(', ')}]
                        </div>
                      ))}
                    </pre>
                  </div>

                  {/* Дополнительная информация о позиции */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-background p-2 rounded border border-border">
                      <span className="text-muted-foreground">X:</span>{' '}
                      <span className="font-mono">{point.pose[0][3].toFixed(3)}</span>
                    </div>
                    <div className="bg-background p-2 rounded border border-border">
                      <span className="text-muted-foreground">Y:</span>{' '}
                      <span className="font-mono">{point.pose[1][3].toFixed(3)}</span>
                    </div>
                    <div className="bg-background p-2 rounded border border-border">
                      <span className="text-muted-foreground">Z:</span>{' '}
                      <span className="font-mono">{point.pose[2][3].toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      </>
    );
  };

  return (
    <div className="w-full py-8 px-4">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Обработка видео</h1>
          <p className="text-muted-foreground mt-2">
            ID обработки: <span className="font-mono text-xs">{id}</span>
          </p>
        </div>

        {/* Статус обработки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {status === 'loading' && (
                <>
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <span>Загрузка информации...</span>
                </>
              )}
              {status === 'processing' && (
                <>
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <span>Обработка видео...</span>
                </>
              )}
              {status === 'complete' && (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span>Обработка завершена</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <span>Ошибка обработки</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <Typography.p className="text-muted-foreground">
                Получение информации о статусе обработки...
              </Typography.p>
            )}

            {/* Pre-render 3D and Video components during loading */}
            {status === 'loading' && id && (
              <div className="mt-4">
                <CombinedVisualization
                  trajectory={[]}
                  currentPose={undefined}
                  trackedPoints={[]}
                  allMapPoints={[]}
                  showGrid={true}
                  videoUrl={videoUrl}
                  currentFrame={0}
                  points2D={[]}
                  videoWidth={1920}
                  videoHeight={1080}
                  threeDHeight="400px"
                  canvasHeight="400px"
                />
              </div>
            )}

            {status === 'processing' && processingData && processingData.type === 'progress' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Typography.p className="text-sm text-muted-foreground">Обработано кадров</Typography.p>
                    <Typography.p className="text-2xl font-bold">
                      {processingData.processed_frames} / {processingData.total_frames}
                    </Typography.p>
                  </div>
                  <div>
                    <Typography.p className="text-sm text-muted-foreground">Прогресс</Typography.p>
                    <Typography.p className="text-2xl font-bold">
                      {processingData.progress}%
                    </Typography.p>
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${processingData.progress}%` }}
                  />
                </div>

                {/* Дополнительная информация о трекинге */}
                {processingData.tracked_points_count !== undefined && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
                    {/* Текущий кадр */}
                    <div className="text-center p-3 bg-muted/30 rounded-lg border border-border">
                      <Typography.p className="text-xs text-muted-foreground mb-1">
                        Текущий кадр
                      </Typography.p>
                      <Typography.p className="text-xl font-bold text-purple-600">
                        {processingData.processed_frames}
                      </Typography.p>
                    </div>

                    {/* Отслеживаемые точки */}
                    <div className="text-center p-3 bg-muted/30 rounded-lg border border-border">
                      <Typography.p className="text-xs text-muted-foreground mb-1">
                        Отслеживаемые точки
                      </Typography.p>
                      <Typography.p className={`text-xl font-bold ${
                        processingData.tracked_points_count > 50 ? 'text-green-600' :
                        processingData.tracked_points_count > 15 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {processingData.tracked_points_count}
                      </Typography.p>
                    </div>

                    {/* Точки траектории */}
                    <div className="text-center p-3 bg-muted/30 rounded-lg border border-border">
                      <Typography.p className="text-xs text-muted-foreground mb-1">
                        Точек траектории
                      </Typography.p>
                      <Typography.p className="text-xl font-bold text-blue-600">
                        {processingData.trajectory?.length || 0}
                      </Typography.p>
                    </div>

                    {/* 3D точки карты */}
                    <div className="text-center p-3 bg-muted/30 rounded-lg border border-border">
                      <Typography.p className="text-xs text-muted-foreground mb-1">
                        3D точки карты
                      </Typography.p>
                      <Typography.p className="text-xl font-bold text-cyan-600">
                        {processingData.all_map_points?.length || 0}
                      </Typography.p>
                    </div>

                    {/* 2D точки (keypoints) */}
                    <div className="text-center p-3 bg-muted/30 rounded-lg border border-border">
                      <Typography.p className="text-xs text-muted-foreground mb-1">
                        2D ключевые точки
                      </Typography.p>
                      <Typography.p className="text-xl font-bold text-orange-600">
                        {processingData.keypoints_2d?.length || 0}
                      </Typography.p>
                    </div>
                  </div>
                )}

                {/* Debug информация */}
                {processingData && (
                  <details className="mt-4">
                    <summary className="cursor-pointer p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <span className="font-medium text-sm">
                        🔧 Debug информация
                      </span>
                    </summary>
                    <div className="mt-2 p-4 bg-muted/30 rounded-lg border border-border">
                      <pre className="text-xs font-mono overflow-x-auto">
                        {JSON.stringify({
                          type: processingData.type,
                          processed_frames: processingData.processed_frames,
                          total_frames: processingData.total_frames,
                          progress: processingData.progress,
                          tracked_points_count: processingData.tracked_points_count,
                          trajectory_length: processingData.trajectory?.length || 0,
                          tracked_points_3d: processingData.tracked_points?.length || 0,
                          all_map_points_count: processingData.all_map_points?.length || 0,
                          keypoints_2d_count: processingData.keypoints_2d?.length || 0,
                          has_current_pose: !!processingData.current_pose,
                        }, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}

                {/* Текущая позиция камеры */}
                {processingData.current_pose && (
                  <div className="mt-4">
                    <details className="group">
                      <summary className="cursor-pointer p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <span className="font-medium text-sm">
                          Текущая позиция камеры (кадр {processingData.processed_frames})
                        </span>
                      </summary>
                      <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border">
                        {/* Координаты (из последнего столбца матрицы 4x4) */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 bg-background rounded border border-border">
                            <Typography.p className="text-xs text-muted-foreground">X</Typography.p>
                            <Typography.p className="font-mono text-sm font-bold">
                              {processingData.current_pose[0][3]?.toFixed(3) || '0.000'}
                            </Typography.p>
                          </div>
                          <div className="text-center p-2 bg-background rounded border border-border">
                            <Typography.p className="text-xs text-muted-foreground">Y</Typography.p>
                            <Typography.p className="font-mono text-sm font-bold">
                              {processingData.current_pose[1][3]?.toFixed(3) || '0.000'}
                            </Typography.p>
                          </div>
                          <div className="text-center p-2 bg-background rounded border border-border">
                            <Typography.p className="text-xs text-muted-foreground">Z</Typography.p>
                            <Typography.p className="font-mono text-sm font-bold">
                              {processingData.current_pose[2][3]?.toFixed(3) || '0.000'}
                            </Typography.p>
                          </div>
                        </div>
                        
                        {/* Полная матрица */}
                        <Typography.p className="text-xs text-muted-foreground mb-2">
                          Матрица преобразования 4x4:
                        </Typography.p>
                        <pre className="text-xs font-mono overflow-x-auto bg-background p-2 rounded border border-border">
                          {processingData.current_pose.map((row, rowIndex) => (
                            <div key={rowIndex} className="leading-relaxed">
                              [{row.map(val => (val || 0).toFixed(6).padStart(10)).join(', ')}]
                            </div>
                          ))}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}

                {/* Визуализация траектории в реальном времени */}
                <div className="mt-4">
                  <CombinedVisualization
                    trajectory={processingData.trajectory}
                    currentPose={processingData.current_pose}
                    trackedPoints={processingData.tracked_points}
                    allMapPoints={processingData.all_map_points}
                    showGrid={true}
                    videoUrl={videoUrl}
                    currentFrame={processingData.processed_frames || 0}
                    points2D={processingData.keypoints_2d}
                    videoWidth={1920}
                    videoHeight={1080}
                    threeDHeight="400px"
                    canvasHeight="400px"
                  />
                </div>

                <Typography.p className="text-xs text-muted-foreground text-center">
                  Обработка может занять несколько минут в зависимости от размера видео...
                </Typography.p>
              </div>
            )}

            {status === 'complete' && processingData && processingData.type === 'complete' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Typography.p className="text-sm text-muted-foreground">Всего кадров</Typography.p>
                    <Typography.p className="text-2xl font-bold">
                      {processingData.total_frames}
                    </Typography.p>
                  </div>
                  <div className="text-center">
                    <Typography.p className="text-sm text-muted-foreground">Обработано</Typography.p>
                    <Typography.p className="text-2xl font-bold">
                      {processingData.processed_frames}
                    </Typography.p>
                  </div>
                  <div className="text-center">
                    <Typography.p className="text-sm text-muted-foreground">Точек траектории</Typography.p>
                    <Typography.p className="text-2xl font-bold text-green-600">
                      {processingData.trajectory.length}
                    </Typography.p>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-4">
                <Typography.p className="text-red-600 mb-4">{error}</Typography.p>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Вернуться на главную
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Отображение точек траектории */}
        {status === 'complete' && renderTrajectoryPoints()}
      </div>
    </div>
  );
};

export default ProcessingPage;
