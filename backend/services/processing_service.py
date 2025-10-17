import asyncio
import cv2
import os
import tempfile
import re
from pathlib import Path
from typing import Optional
from store import get_store
from lib.orb_slam.orb_slam import OrbslamMonoRunner


def _generate_temp_config(width: int, height: int, fps: float, processing_id: str) -> Optional[str]:
    """
    Генерирует временный конфигурационный файл на основе параметров видео.
    
    Args:
        width: Ширина видео
        height: Высота видео
        fps: FPS видео
        processing_id: ID обработки для уникального имени
        
    Returns:
        Путь к временному конфигу или None при ошибке
    """
    try:
        # Путь к шаблону конфига
        template_path = Path(__file__).parent.parent / "lib" / "orb_slam" / "config.yaml"
        
        if not template_path.exists():
            print(f"[ERROR] Template config not found: {template_path}")
            return None
        
        # Читаем шаблон
        with open(template_path, 'r') as f:
            content = f.read()
        
        # Вычисляем параметры калибровки камеры
        # Предполагаем FOV около 60 градусов
        focal_length = max(width, height) * 1.2
        cx = width / 2.0
        cy = height / 2.0
        
        # Заменяем параметры
        content = re.sub(r'Camera1\.fx:\s*[\d.]+', f'Camera1.fx: {focal_length}', content)
        content = re.sub(r'Camera1\.fy:\s*[\d.]+', f'Camera1.fy: {focal_length}', content)
        content = re.sub(r'Camera1\.cx:\s*[\d.]+', f'Camera1.cx: {cx}', content)
        content = re.sub(r'Camera1\.cy:\s*[\d.]+', f'Camera1.cy: {cy}', content)
        
        # Убираем искажения для упрощения
        content = re.sub(r'Camera1\.k1:\s*[\d.\-eE]+', 'Camera1.k1: 0.0', content)
        content = re.sub(r'Camera1\.k2:\s*[\d.\-eE]+', 'Camera1.k2: 0.0', content)
        content = re.sub(r'Camera1\.p1:\s*[\d.\-eE]+', 'Camera1.p1: 0.0', content)
        content = re.sub(r'Camera1\.p2:\s*[\d.\-eE]+', 'Camera1.p2: 0.0', content)
        
        # Заменяем размеры видео
        content = re.sub(r'Camera\.width:\s*\d+', f'Camera.width: {width}', content)
        content = re.sub(r'Camera\.height:\s*\d+', f'Camera.height: {height}', content)
        content = re.sub(r'Camera\.fps:\s*\d+', f'Camera.fps: {int(fps)}', content)
        
        # Устанавливаем newWidth и newHeight равными оригинальным (без ресайза)
        content = re.sub(r'Camera\.newWidth:\s*\d+', f'Camera.newWidth: {width}', content)
        content = re.sub(r'Camera\.newHeight:\s*\d+', f'Camera.newHeight: {height}', content)
        
        # Создаем временный файл
        temp_dir = Path(__file__).parent.parent / "lib" / "orb_slam"
        temp_config_path = temp_dir / f"config_temp_{processing_id}.yaml"
        
        with open(temp_config_path, 'w') as f:
            f.write(content)
        
        print(f"[INFO] Generated temp config: {temp_config_path}")
        print(f"[INFO] Camera params: fx={focal_length}, fy={focal_length}, cx={cx}, cy={cy}")
        
        return str(temp_config_path)
        
    except Exception as e:
        print(f"[ERROR] Failed to generate temp config: {e}")
        return None


async def start_processing(processing_id: str, video_path: str) -> Optional[str]:
    """
    Асинхронная обработка видео через ORB-SLAM3.
    
    Args:
        processing_id: ID обработки в store
        video_path: Путь к видеофайлу
        
    Returns:
        ID обработки в store или None при ошибке
    """
    store = get_store()
    
    # Проверяем существование записи в store
    processing = store.get(processing_id)
    if not processing:
        print(f"[ERROR] Processing {processing_id} not found in store")
        return None
    
    # Проверяем существование файла
    video_file = Path(video_path)
    if not video_file.exists():
        print(f"[ERROR] Video file not found: {video_path}")
        store.update_data(processing_id, {
            'status': 'failed',
            'error': f'Video file not found: {video_path}'
        })
        return None
    
    # Получаем параметры видео
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"[ERROR] Cannot open video: {video_path}")
        store.update_data(processing_id, {
            'status': 'failed',
            'error': f'Cannot open video: {video_path}'
        })
        return None
    
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    
    # Обновляем запись в store с параметрами видео
    store.update_data(processing_id, {
        'width': width,
        'height': height,
        'fps': fps,
        'total_frames': total_frames,
        'processed_frames': 0,
        'trajectory': [],
        'current_pose': None,
        'tracked_points_count': 0,
        'status': 'initializing'
    })
    
    print(f"[INFO] Starting processing {processing_id} for video: {video_path}")
    
    # Создаем временный конфиг для этого видео
    temp_config_path = None
    
    try:
        # Генерируем временный конфиг на основе параметров видео
        temp_config_path = _generate_temp_config(width, height, fps, processing_id)
        
        if not temp_config_path or not Path(temp_config_path).exists():
            print(f"[ERROR] Failed to generate temp config")
            store.update_data(processing_id, {
                'status': 'failed',
                'error': 'Failed to generate temporary config file'
            })
            return None
        
        print(f"[DEBUG] Created temp config: {temp_config_path}")
        
        # Инициализируем ORB-SLAM с временным конфигом
        runner = OrbslamMonoRunner(str(temp_config_path))
        runner.open_video(str(video_path))
        
        store.update_data(processing_id, {'status': 'processing'})
        
        # Обрабатываем видео покадрово
        lost_tracking_count = 0
        max_lost_frames = 50  # Максимум кадров без трекинга перед остановкой
        
        while True:
            ret, info = runner.process_frame()
            
            if not ret:
                print(f"[INFO] Finished processing video {processing_id}")
                break
            
            # Обновляем данные в store
            update_data = {
                'processed_frames': runner.frame_idx,
                'status': 'processing'
            }
            
            if info:
                # Трекинг успешен
                tracked_points = len(info['points']) if info['points'] is not None else 0
                update_data['current_pose'] = info['pose'].tolist() if info['pose'] is not None else None
                update_data['tracked_points_count'] = tracked_points
                
                # Проверяем количество точек
                if tracked_points < 15:
                    lost_tracking_count += 1
                    print(f"[WARNING] Frame {info['frame']:05d} - Low tracking quality: {tracked_points} points")
                else:
                    lost_tracking_count = 0  # Сбрасываем счетчик при хорошем трекинге
                
                # Добавляем позицию в траекторию только если есть достаточно точек
                if info['pose'] is not None and tracked_points >= 15:
                    trajectory = store.get(processing_id).data.get('trajectory', [])
                    trajectory.append({
                        'frame': info['frame'],
                        'pose': info['pose'].tolist()
                    })
                    update_data['trajectory'] = trajectory
                
                if tracked_points >= 15:
                    print(f"[Frame {info['frame']:05d}] Tracking OK - {tracked_points} points")
            else:
                # Трекинг потерян
                lost_tracking_count += 1
                print(f"[Frame {runner.frame_idx:05d}] Tracking LOST")
            
            # Проверяем, не потерян ли трекинг надолго
            if lost_tracking_count >= max_lost_frames:
                print(f"[WARNING] Tracking lost for {lost_tracking_count} frames. Stopping processing.")
                update_data['status'] = 'completed_with_warnings'
                update_data['warning'] = f'Tracking lost after frame {runner.frame_idx - max_lost_frames}'
                store.update_data(processing_id, update_data)
                break
            
            store.update_data(processing_id, update_data)
            
            # Даем возможность другим задачам выполняться
            await asyncio.sleep(0)
        
        # Завершаем обработку
        runner.stop()
        store.update_data(processing_id, {'status': 'completed'})
        store.set_active(processing_id, False)
        
        # Удаляем временный конфиг
        if temp_config_path and Path(temp_config_path).exists():
            try:
                os.remove(temp_config_path)
                print(f"[INFO] Removed temp config: {temp_config_path}")
            except Exception as e:
                print(f"[WARNING] Failed to remove temp config: {e}")
        
        return processing_id
        
    except Exception as e:
        print(f"[ERROR] Processing failed: {e}")
        store.update_data(processing_id, {
            'status': 'failed',
            'error': str(e)
        })
        store.set_active(processing_id, False)
        
        # Удаляем временный конфиг при ошибке
        if temp_config_path and Path(temp_config_path).exists():
            try:
                os.remove(temp_config_path)
                print(f"[INFO] Removed temp config after error: {temp_config_path}")
            except Exception as e:
                print(f"[WARNING] Failed to remove temp config: {e}")
        
        return None