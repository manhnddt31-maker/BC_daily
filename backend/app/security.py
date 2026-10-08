"""Xác thực token nội bộ giữa Next.js và FastAPI."""

from hmac import compare_digest

from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials


def require_service_token(
    credentials: HTTPAuthorizationCredentials | None,
    expected_token: str,
) -> None:
    supplied = credentials.credentials if credentials is not None else ""
    scheme = credentials.scheme.lower() if credentials is not None else ""
    if scheme != "bearer" or not compare_digest(supplied, expected_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token dịch vụ không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )
