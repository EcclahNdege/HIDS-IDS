from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.database import get_db, ProtectedFile, FileStatus
from app.routers.auth import get_current_active_user, User
from app.schemas import ProtectedFileCreate, ProtectedFileResponse, ProtectedFileUpdate

router = APIRouter()

@router.get("/protected", response_model=List[ProtectedFileResponse])
async def get_protected_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: str = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get protected files"""
    query = select(ProtectedFile)
    
    if status:
        query = query.where(ProtectedFile.status == FileStatus(status))
    
    query = query.order_by(ProtectedFile.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    files = result.scalars().all()
    
    return [
        ProtectedFileResponse(
            id=str(file.id),
            path=file.path,
            file_type=file.file_type,
            status=file.status.value,
            access_attempts=file.access_attempts,
            last_accessed=file.last_accessed.isoformat() if file.last_accessed else None,
            lock_reason=file.lock_reason,
            alert_on_read=file.alert_on_read,
            alert_on_write=file.alert_on_write,
            alert_on_delete=file.alert_on_delete,
            auto_lock=file.auto_lock,
            created_at=file.created_at.isoformat()
        )
        for file in files
    ]

@router.post("/protected", response_model=ProtectedFileResponse)
async def add_protected_file(
    file_data: ProtectedFileCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a file to protection"""
    # Check if file already exists
    result = await db.execute(select(ProtectedFile).where(ProtectedFile.path == file_data.path))
    existing_file = result.scalar_one_or_none()
    
    if existing_file:
        raise HTTPException(status_code=400, detail="File is already protected")
    
    protected_file = ProtectedFile(
        path=file_data.path,
        file_type=file_data.file_type,
        status=FileStatus.protected,
        alert_on_read=file_data.alert_on_read,
        alert_on_write=file_data.alert_on_write,
        alert_on_delete=file_data.alert_on_delete,
        auto_lock=file_data.auto_lock
    )
    
    db.add(protected_file)
    await db.commit()
    await db.refresh(protected_file)
    
    return ProtectedFileResponse(
        id=str(protected_file.id),
        path=protected_file.path,
        file_type=protected_file.file_type,
        status=protected_file.status.value,
        access_attempts=protected_file.access_attempts,
        last_accessed=protected_file.last_accessed.isoformat() if protected_file.last_accessed else None,
        lock_reason=protected_file.lock_reason,
        alert_on_read=protected_file.alert_on_read,
        alert_on_write=protected_file.alert_on_write,
        alert_on_delete=protected_file.alert_on_delete,
        auto_lock=protected_file.auto_lock,
        created_at=protected_file.created_at.isoformat()
    )

@router.get("/protected/{file_id}", response_model=ProtectedFileResponse)
async def get_protected_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific protected file"""
    result = await db.execute(select(ProtectedFile).where(ProtectedFile.id == file_id))
    file = result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="Protected file not found")
    
    return ProtectedFileResponse(
        id=str(file.id),
        path=file.path,
        file_type=file.file_type,
        status=file.status.value,
        access_attempts=file.access_attempts,
        last_accessed=file.last_accessed.isoformat() if file.last_accessed else None,
        lock_reason=file.lock_reason,
        alert_on_read=file.alert_on_read,
        alert_on_write=file.alert_on_write,
        alert_on_delete=file.alert_on_delete,
        auto_lock=file.auto_lock,
        created_at=file.created_at.isoformat()
    )

@router.patch("/protected/{file_id}", response_model=ProtectedFileResponse)
async def update_protected_file(
    file_id: str,
    file_update: ProtectedFileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a protected file"""
    result = await db.execute(select(ProtectedFile).where(ProtectedFile.id == file_id))
    file = result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="Protected file not found")
    
    update_data = {}
    if file_update.status:
        update_data["status"] = FileStatus(file_update.status)
    if file_update.lock_reason is not None:
        update_data["lock_reason"] = file_update.lock_reason
    if file_update.alert_on_read is not None:
        update_data["alert_on_read"] = file_update.alert_on_read
    if file_update.alert_on_write is not None:
        update_data["alert_on_write"] = file_update.alert_on_write
    if file_update.alert_on_delete is not None:
        update_data["alert_on_delete"] = file_update.alert_on_delete
    if file_update.auto_lock is not None:
        update_data["auto_lock"] = file_update.auto_lock
    
    if update_data:
        await db.execute(
            update(ProtectedFile).where(ProtectedFile.id == file_id).values(**update_data)
        )
        await db.commit()
        await db.refresh(file)
    
    return ProtectedFileResponse(
        id=str(file.id),
        path=file.path,
        file_type=file.file_type,
        status=file.status.value,
        access_attempts=file.access_attempts,
        last_accessed=file.last_accessed.isoformat() if file.last_accessed else None,
        lock_reason=file.lock_reason,
        alert_on_read=file.alert_on_read,
        alert_on_write=file.alert_on_write,
        alert_on_delete=file.alert_on_delete,
        auto_lock=file.auto_lock,
        created_at=file.created_at.isoformat()
    )

@router.delete("/protected/{file_id}")
async def remove_protected_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove file from protection"""
    result = await db.execute(select(ProtectedFile).where(ProtectedFile.id == file_id))
    file = result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="Protected file not found")
    
    await db.execute(delete(ProtectedFile).where(ProtectedFile.id == file_id))
    await db.commit()
    
    return {"message": "File removed from protection"}

@router.post("/protected/{file_id}/lock")
async def lock_file(
    file_id: str,
    reason: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Lock a protected file"""
    await db.execute(
        update(ProtectedFile)
        .where(ProtectedFile.id == file_id)
        .values(status=FileStatus.locked, lock_reason=reason)
    )
    await db.commit()
    
    return {"message": "File locked successfully"}

@router.post("/protected/{file_id}/unlock")
async def unlock_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlock a protected file"""
    await db.execute(
        update(ProtectedFile)
        .where(ProtectedFile.id == file_id)
        .values(status=FileStatus.authorized, lock_reason=None)
    )
    await db.commit()
    
    return {"message": "File unlocked successfully"}