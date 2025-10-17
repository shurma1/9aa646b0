from services.upload_service import upload_service, upload_service_with_progress
from typing import Tuple, AsyncGenerator, Dict


def upload_controller(file_data: bytes, filename: str) -> Tuple[str, str, str]:
    return upload_service(file_data, filename)


async def upload_controller_with_progress(
    file_data: bytes, 
    filename: str
) -> AsyncGenerator[Dict[str, any], None]:
    async for update in upload_service_with_progress(file_data, filename):
        yield update
