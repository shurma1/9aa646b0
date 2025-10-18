from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from controllers.upload_controller import upload_controller, upload_controller_with_progress
from services.processing_service import start_processing
from store import get_store
import json


router = APIRouter()


@router.post("/upload")
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Загрузка видео файла и автоматический запуск обработки"""
    if file.content_type not in {"video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/x-matroska"}:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported content type. Use video/mp4, video/mpeg, video/quicktime, video/x-msvideo or video/x-matroska"
        )
    
    data = await file.read()
    
    try:
        # Загружаем файл
        file_path, unique_filename, file_id = upload_controller(data, file.filename)
        
        # Создаем запись в store для обработки
        store = get_store()
        processing = store.add(
            processing_type='video_processing',
            data={
                'file_id': file_id,
                'video_path': file_path,
                'filename': unique_filename,
                'original_filename': file.filename,
                'status': 'queued'
            }
        )
        
        processing_id = processing.id
        
        # Запускаем обработку в фоне
        async def run_processing():
            await start_processing(processing_id, file_path)
        
        if background_tasks:
            background_tasks.add_task(run_processing)
        
        return {
            "id": processing_id,
            "file_id": file_id,
            "filename": unique_filename,
            "path": file_path,
            "original_filename": file.filename,
            "size": len(data),
            "message": "File uploaded and processing started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/stream")
async def upload_video_with_progress(file: UploadFile = File(...)):
    """Загрузка видео с отображением прогресса через Server-Sent Events и автоматический запуск обработки"""
    if file.content_type not in {"video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/x-matroska"}:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported content type. Use video/mp4, video/mpeg, video/quicktime, video/x-msvideo or video/x-matroska"
        )
    
    data = await file.read()
    
    async def progress_generator():
        try:
            file_path = None
            file_id = None
            processing_id = None
            
            async for update in upload_controller_with_progress(data, file.filename):
                yield f"data: {json.dumps(update)}\n\n"
                
                # Когда загрузка завершена, запускаем обработку
                if update.get('type') == 'complete':
                    file_path = update.get('path')
                    file_id = update.get('id')
                    
                    # Создаем запись в store
                    store = get_store()
                    processing = store.add(
                        processing_type='video_processing',
                        data={
                            'file_id': file_id,
                            'video_path': file_path,
                            'filename': update.get('filename'),
                            'status': 'queued'
                        }
                    )
                    
                    processing_id = processing.id
                    
                    # Отправляем информацию о начале обработки
                    yield f"data: {json.dumps({'type': 'processing_started', 'processing_id': processing_id, 'file_id': file_id})}\n\n"
                    
                    # Запускаем обработку в фоне
                    import asyncio
                    asyncio.create_task(start_processing(processing_id, file_path))
                    
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    # NOTE:
    # Browsers may perform a CORS preflight (OPTIONS) request for this endpoint.
    # Although FastAPI's CORSMiddleware is configured globally, some clients have
    # reported missing CORS headers for streaming responses. We explicitly add
    # the standard CORS headers here to be resilient.
    # If you later restrict origins, replace '*' with the allowed origin(s).
    return StreamingResponse(
        progress_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            # Explicit CORS headers (normally added by middleware).
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.options("/upload/stream")
async def options_upload_stream():
    """Explicit OPTIONS handler to satisfy certain proxies/browsers that don't route through CORSMiddleware correctly for streaming endpoints."""
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "600",
    })
