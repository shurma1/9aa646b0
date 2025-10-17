import os
import uuid
from typing import Tuple, AsyncGenerator, Dict


UPLOAD_DIR = "uploads"
CHUNK_SIZE = 1024 * 1024


async def upload_service_with_progress(
    file_data: bytes, 
    filename: str
) -> AsyncGenerator[Dict[str, any], None]:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_extension = os.path.splitext(filename)[1]
    file_id = str(uuid.uuid4())
    unique_filename = f"{file_id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    total_size = len(file_data)
    uploaded = 0
    
    with open(file_path, "wb") as f:
        while uploaded < total_size:
            chunk_end = min(uploaded + CHUNK_SIZE, total_size)
            f.write(file_data[uploaded:chunk_end])
            uploaded = chunk_end
            
            progress = int((uploaded / total_size) * 100)
            yield {
                "type": "progress",
                "progress": progress,
                "uploaded": uploaded,
                "total": total_size
            }
    
    yield {
        "type": "complete",
        "id": file_id,
        "filename": unique_filename,
        "path": file_path,
        "size": total_size
    }


def upload_service(file_data: bytes, filename: str) -> Tuple[str, str, str]:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_extension = os.path.splitext(filename)[1]
    file_id = str(uuid.uuid4())
    unique_filename = f"{file_id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_data)
    
    return file_path, unique_filename, file_id
