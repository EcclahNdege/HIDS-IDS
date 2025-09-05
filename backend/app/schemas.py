from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: str
    last_login: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

# Alert schemas
class AlertCreate(BaseModel):
    type: str
    severity: str
    title: str
    description: str
    source: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    description: str
    source: Optional[str] = None
    status: str
    assigned_to: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None

# Protected File schemas
class ProtectedFileCreate(BaseModel):
    path: str
    file_type: Optional[str] = "file"
    alert_on_read: Optional[bool] = True
    alert_on_write: Optional[bool] = True
    alert_on_delete: Optional[bool] = True
    auto_lock: Optional[bool] = False

class ProtectedFileResponse(BaseModel):
    id: str
    path: str
    file_type: str
    status: str
    access_attempts: int
    last_accessed: Optional[str] = None
    lock_reason: Optional[str] = None
    alert_on_read: bool
    alert_on_write: bool
    alert_on_delete: bool
    auto_lock: bool
    created_at: str

class ProtectedFileUpdate(BaseModel):
    status: Optional[str] = None
    lock_reason: Optional[str] = None
    alert_on_read: Optional[bool] = None
    alert_on_write: Optional[bool] = None
    alert_on_delete: Optional[bool] = None
    auto_lock: Optional[bool] = None

# Network Rule schemas
class NetworkRuleCreate(BaseModel):
    protocol: str
    port: Optional[str] = None
    action: str
    source: Optional[str] = None
    description: str

class NetworkRuleResponse(BaseModel):
    id: str
    protocol: str
    port: Optional[str] = None
    action: str
    source: Optional[str] = None
    description: str
    is_active: bool
    created_at: str

class NetworkRuleUpdate(BaseModel):
    action: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

# Log schemas
class LogCreate(BaseModel):
    level: str
    category: str
    message: str
    details: Optional[str] = None

class LogResponse(BaseModel):
    id: str
    level: str
    category: str
    message: str
    details: Optional[str] = None
    user_id: Optional[str] = None
    created_at: str
    comments: List[dict] = []

class LogCommentCreate(BaseModel):
    comment: str

# System Status schema
class SystemStatusResponse(BaseModel):
    cpu: float
    memory: float
    disk: float
    threatLevel: str
    uptime: str
    activeConnections: int
    blockedThreats: int
    quarantinedFiles: int
    timestamp: str