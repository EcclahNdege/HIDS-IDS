from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.database import get_db, NetworkRule, QuarantinedPacket, NetworkAction
from app.routers.auth import get_current_active_user, User
from app.schemas import NetworkRuleCreate, NetworkRuleResponse, NetworkRuleUpdate

router = APIRouter()

@router.get("/rules", response_model=List[NetworkRuleResponse])
async def get_network_rules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: bool = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get network rules"""
    query = select(NetworkRule)
    
    if is_active is not None:
        query = query.where(NetworkRule.is_active == is_active)
    
    query = query.order_by(NetworkRule.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    rules = result.scalars().all()
    
    return [
        NetworkRuleResponse(
            id=str(rule.id),
            protocol=rule.protocol,
            port=rule.port,
            action=rule.action.value,
            source=rule.source,
            description=rule.description,
            is_active=rule.is_active,
            created_at=rule.created_at.isoformat()
        )
        for rule in rules
    ]

@router.post("/rules", response_model=NetworkRuleResponse)
async def create_network_rule(
    rule_data: NetworkRuleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new network rule"""
    rule = NetworkRule(
        protocol=rule_data.protocol,
        port=rule_data.port,
        action=NetworkAction(rule_data.action),
        source=rule_data.source,
        description=rule_data.description,
        is_active=True
    )
    
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    
    return NetworkRuleResponse(
        id=str(rule.id),
        protocol=rule.protocol,
        port=rule.port,
        action=rule.action.value,
        source=rule.source,
        description=rule.description,
        is_active=rule.is_active,
        created_at=rule.created_at.isoformat()
    )

@router.get("/rules/{rule_id}", response_model=NetworkRuleResponse)
async def get_network_rule(
    rule_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific network rule"""
    result = await db.execute(select(NetworkRule).where(NetworkRule.id == rule_id))
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Network rule not found")
    
    return NetworkRuleResponse(
        id=str(rule.id),
        protocol=rule.protocol,
        port=rule.port,
        action=rule.action.value,
        source=rule.source,
        description=rule.description,
        is_active=rule.is_active,
        created_at=rule.created_at.isoformat()
    )

@router.patch("/rules/{rule_id}", response_model=NetworkRuleResponse)
async def update_network_rule(
    rule_id: str,
    rule_update: NetworkRuleUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a network rule"""
    result = await db.execute(select(NetworkRule).where(NetworkRule.id == rule_id))
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Network rule not found")
    
    update_data = {}
    if rule_update.action:
        update_data["action"] = NetworkAction(rule_update.action)
    if rule_update.is_active is not None:
        update_data["is_active"] = rule_update.is_active
    if rule_update.description:
        update_data["description"] = rule_update.description
    
    if update_data:
        await db.execute(
            update(NetworkRule).where(NetworkRule.id == rule_id).values(**update_data)
        )
        await db.commit()
        await db.refresh(rule)
    
    return NetworkRuleResponse(
        id=str(rule.id),
        protocol=rule.protocol,
        port=rule.port,
        action=rule.action.value,
        source=rule.source,
        description=rule.description,
        is_active=rule.is_active,
        created_at=rule.created_at.isoformat()
    )

@router.delete("/rules/{rule_id}")
async def delete_network_rule(
    rule_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a network rule"""
    result = await db.execute(select(NetworkRule).where(NetworkRule.id == rule_id))
    rule = result.scalar_one_or_none()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Network rule not found")
    
    await db.execute(delete(NetworkRule).where(NetworkRule.id == rule_id))
    await db.commit()
    
    return {"message": "Network rule deleted"}

@router.get("/quarantined")
async def get_quarantined_packets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get quarantined packets"""
    query = select(QuarantinedPacket).order_by(QuarantinedPacket.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    packets = result.scalars().all()
    
    return [
        {
            "id": str(packet.id),
            "source": packet.source,
            "destination": packet.destination,
            "protocol": packet.protocol,
            "port": packet.port,
            "size": packet.size,
            "reason": packet.reason,
            "status": packet.status,
            "timestamp": packet.created_at.isoformat()
        }
        for packet in packets
    ]

@router.post("/quarantined/{packet_id}/release")
async def release_quarantined_packet(
    packet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Release a quarantined packet"""
    await db.execute(
        update(QuarantinedPacket)
        .where(QuarantinedPacket.id == packet_id)
        .values(status="released")
    )
    await db.commit()
    
    return {"message": "Packet released"}

@router.delete("/quarantined/{packet_id}")
async def delete_quarantined_packet(
    packet_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a quarantined packet"""
    await db.execute(delete(QuarantinedPacket).where(QuarantinedPacket.id == packet_id))
    await db.commit()
    
    return {"message": "Packet deleted"}