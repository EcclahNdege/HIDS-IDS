from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_

from app.database import get_db, Alert, AlertType, AlertSeverity, AlertStatus
from app.routers.auth import get_current_active_user, User
from app.schemas import AlertCreate, AlertResponse, AlertUpdate

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get alerts with optional filtering"""
    query = select(Alert)
    
    # Apply filters
    conditions = []
    if alert_type:
        conditions.append(Alert.type == AlertType(alert_type))
    if severity:
        conditions.append(Alert.severity == AlertSeverity(severity))
    if status:
        conditions.append(Alert.status == AlertStatus(status))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    return [
        AlertResponse(
            id=str(alert.id),
            type=alert.type.value,
            severity=alert.severity.value,
            title=alert.title,
            description=alert.description,
            source=alert.source,
            status=alert.status.value,
            assigned_to=str(alert.assigned_to) if alert.assigned_to else None,
            created_at=alert.created_at.isoformat(),
            updated_at=alert.updated_at.isoformat() if alert.updated_at else None
        )
        for alert in alerts
    ]

@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_data: AlertCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new alert"""
    alert = Alert(
        type=AlertType(alert_data.type),
        severity=AlertSeverity(alert_data.severity),
        title=alert_data.title,
        description=alert_data.description,
        source=alert_data.source,
        status=AlertStatus.active
    )
    
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    return AlertResponse(
        id=str(alert.id),
        type=alert.type.value,
        severity=alert.severity.value,
        title=alert.title,
        description=alert.description,
        source=alert.source,
        status=alert.status.value,
        assigned_to=str(alert.assigned_to) if alert.assigned_to else None,
        created_at=alert.created_at.isoformat(),
        updated_at=alert.updated_at.isoformat() if alert.updated_at else None
    )

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific alert"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return AlertResponse(
        id=str(alert.id),
        type=alert.type.value,
        severity=alert.severity.value,
        title=alert.title,
        description=alert.description,
        source=alert.source,
        status=alert.status.value,
        assigned_to=str(alert.assigned_to) if alert.assigned_to else None,
        created_at=alert.created_at.isoformat(),
        updated_at=alert.updated_at.isoformat() if alert.updated_at else None
    )

@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    alert_update: AlertUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an alert"""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    update_data = {}
    if alert_update.status:
        update_data["status"] = AlertStatus(alert_update.status)
    if alert_update.assigned_to:
        update_data["assigned_to"] = alert_update.assigned_to
    
    if update_data:
        await db.execute(
            update(Alert).where(Alert.id == alert_id).values(**update_data)
        )
        await db.commit()
        await db.refresh(alert)
    
    return AlertResponse(
        id=str(alert.id),
        type=alert.type.value,
        severity=alert.severity.value,
        title=alert.title,
        description=alert.description,
        source=alert.source,
        status=alert.status.value,
        assigned_to=str(alert.assigned_to) if alert.assigned_to else None,
        created_at=alert.created_at.isoformat(),
        updated_at=alert.updated_at.isoformat() if alert.updated_at else None
    )

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Acknowledge an alert"""
    await db.execute(
        update(Alert)
        .where(Alert.id == alert_id)
        .values(status=AlertStatus.acknowledged, assigned_to=current_user.id)
    )
    await db.commit()
    
    return {"message": "Alert acknowledged"}

@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Resolve an alert"""
    await db.execute(
        update(Alert)
        .where(Alert.id == alert_id)
        .values(status=AlertStatus.resolved, assigned_to=current_user.id)
    )
    await db.commit()
    
    return {"message": "Alert resolved"}