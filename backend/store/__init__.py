from .processing import Processing, ProcessingType
from .store import ProcessingStore


_store_instance = None


def get_store() -> ProcessingStore:
    global _store_instance
    if _store_instance is None:
        _store_instance = ProcessingStore()
    return _store_instance


def create_store() -> ProcessingStore:
    return ProcessingStore()


__all__ = [
    'Processing',
    'ProcessingType',
    'ProcessingStore',
    'get_store',
    'create_store'
]
