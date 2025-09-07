import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from dotenv import load_dotenv

load_dotenv()

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://securewatch:password@localhost:5432/securewatch")

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Base class for models
Base = declarative_base()

# Enums
class AlertType(enum.Enum):
    intrusion = "intrusion"
    file = "file"
    network = "network"

class AlertSeverity(enum.Enum):
    critical = "critical"
    warning = "warning"
    info = "info"

class AlertStatus(enum.Enum):
    active = "active"
    acknowledged = "acknowledged"
    resolved = "resolved"

class UserRole(enum.Enum):
    admin = "admin"
    user = "user"

class FileStatus(enum.Enum):
    protected = "protected"
    locked = "locked"
    authorized = "authorized"

class NetworkAction(enum.Enum):
    allow = "allow"
    deny = "deny"
    quarantine = "quarantine"

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.user)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    source = Column(String(100))
    status = Column(Enum(AlertStatus), default=AlertStatus.active)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ProtectedFile(Base):
    __tablename__ = "protected_files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    path = Column(String(500), nullable=False, unique=True)
    file_type = Column(String(20), default="file")  # file or directory
    status = Column(Enum(FileStatus), default=FileStatus.protected)
    access_attempts = Column(Integer, default=0)
    last_accessed = Column(DateTime(timezone=True))
    lock_reason = Column(Text)
    alert_on_read = Column(Boolean, default=True)
    alert_on_write = Column(Boolean, default=True)
    alert_on_delete = Column(Boolean, default=True)
    auto_lock = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NetworkRule(Base):
    __tablename__ = "network_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    protocol = Column(String(20), nullable=False)
    port = Column(String(20))
    action = Column(Enum(NetworkAction), nullable=False)
    source = Column(String(100))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QuarantinedPacket(Base):
    __tablename__ = "quarantined_packets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    protocol = Column(String(20), nullable=False)
    port = Column(Integer)
    size = Column(Integer)
    reason = Column(Text)
    status = Column(String(20), default="quarantined")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    level = Column(String(20), nullable=False)  # info, warning, error, critical
    category = Column(String(50), nullable=False)  # system, security, user, network
    message = Column(String(500), nullable=False)
    details = Column(Text)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LogComment(Base):
    __tablename__ = "log_comments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    log_id = Column(UUID(as_uuid=True), ForeignKey("system_logs.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SystemStatus(Base):
    __tablename__ = "system_status"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cpu_usage = Column(Integer)
    memory_usage = Column(Integer)
    disk_usage = Column(Integer)
    threat_level = Column(String(20))
    uptime = Column(String(50))
    active_connections = Column(Integer)
    blocked_threats = Column(Integer)
    quarantined_files = Column(Integer)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# Database session dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Initialize database
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)