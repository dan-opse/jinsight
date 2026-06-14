from slowapi import Limiter
from slowapi.util import get_remote_address
import jwt


def get_user_id(request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            sub = payload.get("sub")
            if sub:
                return sub
        except jwt.PyJWTError:
            pass
    return get_remote_address(request)


limiter = Limiter(key_func=get_user_id)
