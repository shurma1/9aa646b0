from typing import Dict, List, Optional
from .processing import Processing, ProcessingType


class ProcessingStore:
    def __init__(self):
        self._store: Dict[str, Processing] = {}
    
    def add(self, processing_type: ProcessingType, data: Optional[Dict] = None) -> Processing:
        processing = Processing(
            type=processing_type,
            isActive=True,
            data=data or {}
        )
        self._store[processing.id] = processing
        return processing
    
    def get(self, processing_id: str) -> Optional[Processing]:
        return self._store.get(processing_id)
    
    def get_all(self) -> List[Processing]:
        return list(self._store.values())
    
    def get_active(self) -> List[Processing]:
        return [p for p in self._store.values() if p.isActive]
    
    def get_by_type(self, processing_type: ProcessingType) -> List[Processing]:
        return [p for p in self._store.values() if p.type == processing_type]
    
    def update(self, processing_id: str, **kwargs) -> Optional[Processing]:
        processing = self._store.get(processing_id)
        if processing:
            for key, value in kwargs.items():
                if hasattr(processing, key):
                    setattr(processing, key, value)
        return processing
    
    def update_data(self, processing_id: str, data: Dict) -> Optional[Processing]:
        processing = self._store.get(processing_id)
        if processing:
            if processing.data is None:
                processing.data = data
            else:
                processing.data.update(data)
        return processing
    
    def set_active(self, processing_id: str, is_active: bool) -> Optional[Processing]:
        return self.update(processing_id, isActive=is_active)
    
    def delete(self, processing_id: str) -> bool:
        if processing_id in self._store:
            del self._store[processing_id]
            return True
        return False
    
    def clear(self):
        self._store.clear()
    
    def count(self) -> int:
        return len(self._store)
    
    def count_active(self) -> int:
        return len(self.get_active())
