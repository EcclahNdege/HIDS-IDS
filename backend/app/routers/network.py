from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.routers.auth import get_current_active_user, User
from app.services.firewall import UFWManager

router = APIRouter()
fw = UFWManager()

# ---------------------- Firewall Controls ----------------------

@router.get("/enable")
async def enable_firewall():
    return {"message": fw.enable()}

@router.get("/disable")
async def disable_firewall():
    return {"message": fw.disable()}

@router.get("/reload")
async def reload_firewall():
    return {"message": fw.reload()}

@router.get("/status")
async def firewall_status(verbose: bool = False):
    return {"message": fw.status(verbose=verbose).split("\n")[0]}

# ---------------------- Rules ----------------------

@router.get("/rules")
async def get_firewall_rules():
    """Return current firewall rules from UFW"""
    return fw.list_rules()

# ---- IP Rules ----
@router.post("/rules/ip/allow")
async def allow_ip(ip: str, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.allow_ip(ip)}

@router.post("/rules/ip/block")
async def block_ip(ip: str, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.block_ip(ip)}

@router.delete("/rules/ip")
async def remove_ip(ip: str, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.remove_ip(ip)}

# ---- Port Rules ----
@router.post("/rules/port/allow")
async def allow_port(port: int, proto: Optional[str] = None, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.allow_port(port, proto)}

@router.post("/rules/port/block")
async def block_port(port: int, proto: Optional[str] = None, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.block_port(port, proto)}

@router.delete("/rules/port")
async def remove_port(port: int, proto: Optional[str] = None, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.remove_port(port, proto)}

# ---- Protocol Rules ----
@router.post("/rules/protocol/allow")
async def allow_protocol(proto: str, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.allow_protocol(proto)}

@router.post("/rules/protocol/block")
async def block_protocol(proto: str, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.block_protocol(proto)}

@router.delete("/rules/protocol")
async def remove_protocol(proto: str, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.remove_protocol(proto)}

# ---- Global Rules ----
@router.post("/rules/allow_all")
async def allow_all(current_user: User = Depends(get_current_active_user)):
    return {"message": fw.allow_all()}

@router.post("/rules/deny_all")
async def deny_all(current_user: User = Depends(get_current_active_user)):
    return {"message": fw.deny_all()}

# ---- General Rule Removal ----
@router.delete("/rules/remove")
async def remove_rule(rule: str, current_user: User = Depends(get_current_active_user)):
    return {"message": fw.remove_rule(rule)}
