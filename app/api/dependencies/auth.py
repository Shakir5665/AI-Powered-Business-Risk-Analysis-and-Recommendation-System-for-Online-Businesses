import time
from uuid import UUID
from typing import Optional, Dict, Tuple
from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.api.dependencies.database import get_db
from app.repositories.user_repository import UserRepository
from app.security.jwt import decode_access_token, InvalidTokenError
from app.models.user import User

security_scheme = HTTPBearer(auto_error=False)

# In-memory TTL cache to eliminate 260ms remote DB round-trips on rapid requests & polling
_USER_CACHE: Dict[UUID, Tuple[User, float]] = {}
_USER_CACHE_TTL = 60.0  # 60 seconds


def invalidate_user_cache(user_id: UUID):
    """Invalidates cached user session upon password change or account status change."""
    _USER_CACHE.pop(user_id, None)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency enforcing JWT authentication and returning the current User entity.
    Checks Authorization Bearer header, access_token cookie, or query parameter.
    Uses a 60s in-memory TTL cache to bypass blocking remote DB queries on status polling.
    """
    token: Optional[str] = None

    if credentials and credentials.credentials:
        token = credentials.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")
    elif "token" in request.query_params:
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise InvalidTokenError("Subject claim (sub) missing from token.")

        user_uuid = UUID(user_id_str)
    except (InvalidTokenError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(err),
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = time.time()
    cached = _USER_CACHE.get(user_uuid)
    if cached:
        cached_user, expire_at = cached
        if now < expire_at:
            return cached_user

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_uuid)
    if not user or not user.is_active:
        _USER_CACHE.pop(user_uuid, None)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account not found or disabled.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Clean old cache keys periodically
    if len(_USER_CACHE) > 500:
        expired = [k for k, (_, exp) in _USER_CACHE.items() if now >= exp]
        for k in expired:
            _USER_CACHE.pop(k, None)

    _USER_CACHE[user_uuid] = (user, now + _USER_CACHE_TTL)
    return user

