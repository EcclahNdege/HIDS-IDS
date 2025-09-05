from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db, SystemLog, LogComment, User
from app.routers.auth import get_current_active_user
from app.schemas import LogCreate, LogResponse, LogCommentCreate

router = APIRouter()

@router.get("/", response_model=List[LogResponse])
async def get_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    level: str = Query(None),
    category: str = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get system logs"""
    query = select(SystemLog)
    
    if level:
        query = query.where(SystemLog.level == level)
    if category:
        query = query.where(SystemLog.category == category)
    
    query = query.order_by(SystemLog.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Get comments for each log
    log_responses = []
    for log in logs:
        comments_result = await db.execute(
            select(LogComment, User)
            .join(User, LogComment.user_id == User.id)
            .where(LogComment.log_id == log.id)
            .order_by(LogComment.created_at.asc())
        )
        comments_data = comments_result.all()
        
        comments = [
            {
                "id": str(comment.id),
                "userId": str(comment.user_id),
                "username": user.username,
                "comment": comment.comment,
                "timestamp": comment.created_at.isoformat()
            }
            for comment, user in comments_data
        ]
        
        log_responses.append(
            LogResponse(
                id=str(log.id),
                level=log.level,
                category=log.category,
                message=log.message,
                details=log.details,
                user_id=str(log.user_id) if log.user_id else None,
                created_at=log.created_at.isoformat(),
                comments=comments
            )
        )
    
    return log_responses

@router.post("/", response_model=LogResponse)
async def create_log(
    log_data: LogCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new log entry"""
    log = SystemLog(
        level=log_data.level,
        category=log_data.category,
        message=log_data.message,
        details=log_data.details,
        user_id=current_user.id
    )
    
    db.add(log)
    await db.commit()
    await db.refresh(log)
    
    return LogResponse(
        id=str(log.id),
        level=log.level,
        category=log.category,
        message=log.message,
        details=log.details,
        user_id=str(log.user_id) if log.user_id else None,
        created_at=log.created_at.isoformat(),
        comments=[]
    )

@router.get("/{log_id}", response_model=LogResponse)
async def get_log(
    log_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific log entry"""
    result = await db.execute(select(SystemLog).where(SystemLog.id == log_id))
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Get comments
    comments_result = await db.execute(
        select(LogComment, User)
        .join(User, LogComment.user_id == User.id)
        .where(LogComment.log_id == log.id)
        .order_by(LogComment.created_at.asc())
    )
    comments_data = comments_result.all()
    
    comments = [
        {
            "id": str(comment.id),
            "userId": str(comment.user_id),
            "username": user.username,
            "comment": comment.comment,
            "timestamp": comment.created_at.isoformat()
        }
        for comment, user in comments_data
    ]
    
    return LogResponse(
        id=str(log.id),
        level=log.level,
        category=log.category,
        message=log.message,
        details=log.details,
        user_id=str(log.user_id) if log.user_id else None,
        created_at=log.created_at.isoformat(),
        comments=comments
    )

@router.post("/{log_id}/comments")
async def add_log_comment(
    log_id: str,
    comment_data: LogCommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a comment to a log entry"""
    # Check if log exists
    result = await db.execute(select(SystemLog).where(SystemLog.id == log_id))
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    comment = LogComment(
        log_id=log_id,
        user_id=current_user.id,
        comment=comment_data.comment
    )
    
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    
    return {
        "id": str(comment.id),
        "userId": str(comment.user_id),
        "username": current_user.username,
        "comment": comment.comment,
        "timestamp": comment.created_at.isoformat()
    }