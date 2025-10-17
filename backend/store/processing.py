import uuid
from typing import Dict, Optional, Literal
from dataclasses import dataclass, field
from datetime import datetime


ProcessingType = Literal['stream', 'video_processing']


@dataclass
class Processing:
    type: ProcessingType
    isActive: bool
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    data: Optional[Dict] = None
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict:
        return {
            'type': self.type,
            'isActive': self.isActive,
            'id': self.id,
            'data': self.data,
            'created_at': self.created_at.isoformat()
        }
