import React, { useState } from 'react';
import FilePickerCard from '@/components/FilePickerCard';
import ProcessingResults from '@/components/ProcessingResults';
import type { UploadResponse, ProcessingResponse, ProcessingCompleteResponse } from '@/api';

const VideoProcessingPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingCompleteResponse | null>(null);

  const handleFileSelected = (file: File) => {
    console.log('File selected:', file.name);
    setSelectedFile(file);
    // Сброс предыдущих результатов при выборе нового файла
    setUploadResult(null);
    setProcessingResult(null);
  };

  const handleUploadComplete = (result: UploadResponse) => {
    console.log('Upload complete:', result);
    setUploadResult(result);
  };

  const handleProcessingComplete = (result: ProcessingResponse) => {
    console.log('Processing update:', result);
    if (result.type === 'complete') {
      setProcessingResult(result);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setProcessingResult(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Анализ траектории движения</h1>
          <p className="text-muted-foreground mt-2">
            Загрузите видеофайл для автоматического анализа траектории камеры с помощью ORB-SLAM3
          </p>
        </div>
        
        {/* Компонент загрузки файла или результаты */}
        {processingResult ? (
          <ProcessingResults 
            result={processingResult} 
            onReset={handleReset}
          />
        ) : (
          <div className="flex justify-center">
            <FilePickerCard
              onFileSelected={handleFileSelected}
              onUploadComplete={handleUploadComplete}
              onProcessingComplete={handleProcessingComplete}
            />
          </div>
        )}
        
        {/* Информация о процессе */}
        {!processingResult && (
          <div className="bg-muted/30 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Как это работает:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-medium">Загрузка файла</h4>
                <p className="text-muted-foreground">
                  Видеофайл загружается на сервер с отображением прогресса в реальном времени
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-medium">Обработка ORB-SLAM3</h4>
                <p className="text-muted-foreground">
                  Алгоритм анализирует каждый кадр и строит траекторию движения камеры в 3D пространстве
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-medium">Результат</h4>
                <p className="text-muted-foreground">
                  Получение матриц поз для каждого кадра с возможностью экспорта в JSON или CSV
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Технические требования */}
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">Поддерживаемые форматы:</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• MP4 (рекомендуется)</li>
              <li>• AVI</li>
              <li>• MOV</li>
              <li>• WebM</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Технические требования:</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Максимальный размер: 500 МБ</li>
              <li>• Разрешение: до 1920x1080</li>
              <li>• Стабильное освещение предпочтительно</li>
              <li>• Четкие визуальные особенности в кадре</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProcessingPage;