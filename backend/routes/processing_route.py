from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from store import get_store
from services.processing_service import start_processing
import json
import asyncio
from pathlib import Path


router = APIRouter()


@router.post("/processing/start/{file_id}")
async def start_video_processing(file_id: str, background_tasks: BackgroundTasks):
    """
    Запускает обработку загруженного видео через ORB-SLAM3.
    
    Args:
        file_id: ID загруженного файла
        
    Returns:
        processing_id: ID созданной обработки в store
    """
    store = get_store()
    
    # Ищем файл в папке uploads
    uploads_dir = Path("uploads")
    video_files = list(uploads_dir.glob(f"{file_id}.*"))
    
    if not video_files:
        raise HTTPException(status_code=404, detail=f"Video file with id {file_id} not found")
    
    video_path = str(video_files[0])
    
    # Создаем предварительную запись в store для получения processing_id
    processing = store.add(
        processing_type='video_processing',
        data={
            'file_id': file_id,
            'video_path': video_path,
            'status': 'queued'
        }
    )
    
    processing_id = processing.id
    
    # Запускаем обработку в фоне с использованием processing_id
    async def run_processing():
        await start_processing(processing_id, video_path)
    
    background_tasks.add_task(run_processing)
    
    return {
        "message": "Processing started",
        "processing_id": processing_id,
        "file_id": file_id,
        "video_path": video_path
    }


@router.get("/processing/{id}")
async def get_processing_data(id: str):
    """
    Получение данных обработки в реальном времени через Server-Sent Events.
    Возвращает текущие координаты, траекторию и статус обработки.
    """
    store = get_store()
    processing = store.get(id)
    
    if not processing:
        raise HTTPException(status_code=404, detail=f"Processing with id {id} not found")
    
    async def data_generator():
        last_frame = -1
        
        while True:
            processing = store.get(id)
            
            if not processing:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Processing not found'})}\n\n"
                break
            
            data = processing.data or {}
            current_frame = data.get('processed_frames', 0)
            
            # Отправляем обновление только если есть новые данные
            if current_frame > last_frame:
                update = {
                    'type': 'update',
                    'id': processing.id,
                    'status': data.get('status', 'unknown'),
                    'processed_frames': current_frame,
                    'total_frames': data.get('total_frames', 0),
                    'current_pose': data.get('current_pose'),
                    'tracked_points_count': data.get('tracked_points_count', 0),
                    'trajectory': data.get('trajectory', []),
                    'progress': (current_frame / data.get('total_frames', 1)) * 100 if data.get('total_frames', 0) > 0 else 0
                }
                
                yield f"data: {json.dumps(update)}\n\n"
                last_frame = current_frame
            
            # Если обработка завершена или провалилась, отправляем финальное сообщение
            if data.get('status') in ['completed', 'failed']:
                final_message = {
                    'type': 'complete' if data.get('status') == 'completed' else 'error',
                    'id': processing.id,
                    'status': data.get('status'),
                    'processed_frames': current_frame,
                    'total_frames': data.get('total_frames', 0),
                    'trajectory': data.get('trajectory', []),
                    'error': data.get('error')
                }
                yield f"data: {json.dumps(final_message)}\n\n"
                break
            
            # Ждем перед следующей проверкой
            await asyncio.sleep(0.1)
    
    return StreamingResponse(
        data_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
