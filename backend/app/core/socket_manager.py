import socketio
import asyncio
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User

logger = logging.getLogger(__name__)

# Khởi tạo Socket.IO Async Server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
)

@sio.on('connect')
async def connect(sid, environ, auth):
    """
    Xác thực User khi kết nối qua JWT trong `auth` dict.
    Nếu hợp lệ, join user vào room: user:{user.id}
    """
    if not auth or "token" not in auth:
        logger.warning(f"Socket connection rejected: No token provided. sid={sid}")
        raise socketio.exceptions.ConnectionRefusedError("Authentication failed")

    token = auth["token"]
    payload = decode_access_token(token)
    
    if payload is None:
        logger.warning(f"Socket connection rejected: Invalid or expired token. sid={sid}")
        raise socketio.exceptions.ConnectionRefusedError("Authentication failed")

    user_id = payload.get("user_id")
    if not user_id:
        logger.warning(f"Socket connection rejected: Invalid token payload. sid={sid}")
        raise socketio.exceptions.ConnectionRefusedError("Authentication failed")

    # Kiểm tra User trong DB
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.status != "ACTIVE":
            logger.warning(f"Socket connection rejected: User not found or inactive. sid={sid}")
            raise socketio.exceptions.ConnectionRefusedError("Authentication failed")
            
        # Join room specific to this user
        room_name = f"user:{user.id}"
        sio.enter_room(sid, room_name)
        
        # Có thể gắn thêm attribute vào session của socket nếu cần
        async with sio.session(sid) as session:
            session['user_id'] = user.id
            
        logger.info(f"Socket connected: user_id={user.id}, sid={sid}. Joined room: {room_name}")
        
    except Exception as e:
        logger.error(f"Error during socket connection: {str(e)}")
        raise socketio.exceptions.ConnectionRefusedError("Internal server error")
    finally:
        db.close()


@sio.on('disconnect')
async def disconnect(sid):
    try:
        # Lấy thông tin user_id từ session (nếu có)
        async with sio.session(sid) as session:
            user_id = session.get('user_id')
            if user_id:
                logger.info(f"Socket disconnected: user_id={user_id}, sid={sid}")
            else:
                logger.info(f"Socket disconnected: sid={sid}")
    except Exception:
        logger.info(f"Socket disconnected: sid={sid}")


def emit_socket_notification(user_id: int, payload: dict):
    """
    Helper dùng để gọi từ code Synchronous (ví dụ: các Service REST API của FastAPI).
    Tạo Task an toàn để Emit Socket.IO event trên Main Event Loop.
    """
    room = f"user:{user_id}"
    event = "notification:new"
    
    async def _emit():
        try:
            await sio.emit(event, payload, room=room)
            logger.info(f"Notification emitted to room {room}: type={payload.get('type')}")
        except Exception as e:
            logger.error(f"Failed to emit notification to {room}: {str(e)}")

    try:
        loop = asyncio.get_running_loop()
        # Chạy an toàn từ worker thread của FastAPI vào main event loop
        asyncio.run_coroutine_threadsafe(_emit(), loop)
    except RuntimeError:
        # Dự phòng: Nếu không có event loop (ví dụ khi chạy Unit Test độc lập)
        try:
            asyncio.run(_emit())
        except Exception as e:
             logger.error(f"Failed to run emit task: {str(e)}")
