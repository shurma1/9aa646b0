import React from 'react';
import FilePickerCard from '@/components/FilePickerCard';
import type { UploadResponse } from '@/api';

const UploadPage: React.FC = () => {
  const handleFileSelected = (file: File) => {
    console.log('File selected:', file.name);
  };

  const handleUploadComplete = (result: UploadResponse) => {
    console.log('Upload complete:', result);
    if (result.type === 'complete') {
      console.log(`File uploaded with ID: ${result.id}`);
      // Перенаправление происходит автоматически в FilePickerCard
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Загрузка и обработка видео</h1>
          <p className="text-muted-foreground mt-2">
            Загрузите видеофайл для анализа траектории движения
          </p>
        </div>
        
        <div className="flex justify-center">
          <FilePickerCard
            onFileSelected={handleFileSelected}
            onUploadComplete={handleUploadComplete}
          />
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Поддерживаемые форматы: MP4, AVI, MOV, WebM</p>
          <p>Максимальный размер файла: 500 МБ</p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;