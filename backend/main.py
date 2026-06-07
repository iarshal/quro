"""
Quro Shield — FastAPI Backend Server
Multi-device facial recognition with DeepFace + Supabase.
WebSocket-powered QR login for desktop authentication.

Run with: uvicorn main:app --reload --port 8000
"""

import os
import uuid
import json
import base64
import hashlib
import secrets
import asyncio
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Optional

import bcrypt
import jwt
import numpy as np
from PIL import Image
from dotenv import load_dotenv

# MUST be placed before any TF imports to prevent Apple Silicon Uvicorn segfaults.
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ─── Configuration ───────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "quro-shield-dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24
FACE_MATCH_THRESHOLD = 0.28  # Very strict ArcFace cosine threshold; lower false-accept risk.
FACE_MATCH_MARGIN = 0.06  # Best match must clearly beat the next closest stored face.
FACE_DUPLICATE_THRESHOLD = 0.30

# SMTP Email Configuration
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")  # Your Gmail address
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")  # Gmail App Password
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

# In-memory OTP store: { email: { "code": "123456", "expires": datetime } }
otp_store: dict[str, dict] = {}

# ─── Real Supabase Only (No Mocks) ──────────────────
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env. "
        "Get your keys from: Supabase Dashboard → Settings → API"
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
print("✅ Supabase client initialized successfully.")

app = FastAPI(title="Quro Shield API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Warmup Keras Models ──────────────────────────────
print("Warming up ML engines (ArcFace 512D — 99.4% accuracy)...")
try:
    from deepface import DeepFace
    # Warm up ArcFace (512D). This downloads the model on first run.
    DeepFace.build_model("ArcFace")
    print("✅ ArcFace 512D ML Engine warmed and ready.")
except Exception as e:
    print(f"⚠️ ML warmup failed: {e}")

# ─── WebSocket QR Session Registry ───────────────────

qr_ws_connections: dict[str, WebSocket] = {}

# ─── Real-Time Chat WebSocket Registry ───────────────
# Maps user_id -> active WebSockets for real-time messaging + call signaling.
# A user can be signed in on multiple phones/browsers, so calls must fan out.
chat_ws_connections: dict[str, list[WebSocket]] = {}



def send_otp_email(to_email: str, code: str, purpose: str = "Registration") -> bool:
    """Send a verification code email using SMTP."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"⚠️ SMTP not configured. OTP for {to_email}: {code}")
        return True  # Still return True so dev flow works

    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f'Quro Shield <{SMTP_EMAIL}>'
        msg['To'] = to_email
        msg['Subject'] = f'Quro Verification Code for {purpose}'

        html_body = f"""
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #111; margin: 0;">Quro Shield</h1>
                <p style="font-size: 14px; color: #9CA3AF; margin: 8px 0 0;">Secure Identity Authentication</p>
            </div>
            <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 16px; padding: 32px; text-align: center;">
                <p style="font-size: 14px; color: #6B7280; margin: 0 0 16px;">Your verification code for <strong>{purpose}</strong>:</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #111; padding: 16px 0; font-family: monospace;">{code}</div>
                <p style="font-size: 12px; color: #9CA3AF; margin: 16px 0 0;">This code expires in 5 minutes. Do not share it with anyone.</p>
            </div>
            <p style="font-size: 11px; color: #D1D5DB; text-align: center; margin-top: 24px;">If you didn't request this code, please ignore this email.</p>
        </div>
        """

        text_body = f"Your Quro Shield verification code for {purpose}: {code}\nThis code expires in 5 minutes."

        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())

        print(f"✅ OTP email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send OTP email: {e}")
        return False


# ─── Helpers ─────────────────────────────────────────

def generate_quro_id() -> str:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "".join(secrets.choice(chars) for _ in range(6))


def generate_unique_quro_id(max_attempts: int = 20) -> str:
    for _ in range(max_attempts):
        quro_id = generate_quro_id()
        existing = supabase.table("users").select("id").eq("quro_id", quro_id).limit(1).execute()
        if not existing.data:
            return quro_id
    raise HTTPException(status_code=500, detail="Could not generate a unique Quro ID. Please retry.")


def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()


def verify_pin(pin: str, hashed: str) -> bool:
    return bcrypt.checkpw(pin.encode(), hashed.encode())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_jwt(user_id: str, quro_id: str) -> str:
    payload = {
        "sub": user_id,
        "quro_id": quro_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session token")


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.split(" ", 1)[1]
    payload = decode_jwt(token)
    return payload


def base64_to_image(b64_string: str) -> Image.Image:
    """Convert a base64 image string to a PIL Image."""
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_string)
    return Image.open(BytesIO(img_bytes))


def get_face_embedding(b64_image: str) -> list[float]:
    """
    Generate a 512-dim face embedding from a base64 image using DeepFace.
    Uses the ArcFace model for state-of-the-art 99.40%+ accuracy.
    """
    from deepface import DeepFace

    img = base64_to_image(b64_image)
    temp_path = f"/tmp/quro_face_{uuid.uuid4().hex[:8]}.jpg"
    img.save(temp_path, "JPEG")

    try:
        result = DeepFace.represent(
            img_path=temp_path,
            model_name="ArcFace", # State-of-the-art 512D model
            enforce_detection=True,
            detector_backend="mtcnn", # Keep MTCNN for robust face alignment
        )
        if not result:
            raise ValueError("No face detected in the image")
        embedding = result[0]["embedding"]
        return embedding
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def cosine_distance(a: list[float], b: list[float]) -> float:
    """Compute cosine distance between two embeddings. 0 = identical, 2 = opposite."""
    if len(a) != len(b):
        return 2.0 # Incompatible embedding dimensions (e.g., mixing Facenet and ArcFace)
    a_np = np.array(a)
    b_np = np.array(b)
    dot = np.dot(a_np, b_np)
    norm_a = np.linalg.norm(a_np)
    norm_b = np.linalg.norm(b_np)
    if norm_a == 0 or norm_b == 0:
        return 2.0
    similarity = dot / (norm_a * norm_b)
    return 1.0 - similarity


def validate_liveness_proof(proof: dict, *, require_mouth: bool = True) -> None:
    """Reject direct image-only face auth. Client must complete live challenges first."""
    if not isinstance(proof, dict) or proof.get("completed") is not True:
        raise HTTPException(status_code=400, detail="Live face verification is required")

    challenges = proof.get("challenges")
    duration_ms = proof.get("durationMs", 0)
    created_at = proof.get("createdAt")

    if not isinstance(challenges, list):
        raise HTTPException(status_code=400, detail="Invalid liveness proof")

    challenge_set = set(challenges)
    has_mouth = "mouth" in challenge_set

    if require_mouth and not has_mouth:
        raise HTTPException(status_code=400, detail="Liveness challenge incomplete")

    try:
        duration_value = int(duration_ms)
    except Exception:
        duration_value = 0

    if duration_value < 500:
        raise HTTPException(status_code=400, detail="Liveness challenge completed too quickly")

    try:
        created = datetime.fromisoformat(str(created_at).replace("Z", "+00:00"))
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age = abs((datetime.now(timezone.utc) - created).total_seconds())
        if age > 600:
            raise HTTPException(status_code=400, detail="Liveness proof expired")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid liveness timestamp")


def find_best_face_match(current_embedding: list[float], users: list[dict]) -> tuple[Optional[dict], float, float]:
    """Return best user, best distance, and second-best distance for confidence margin checks."""
    best_match = None
    best_distance = float("inf")
    second_best_distance = float("inf")

    for user in users:
        stored = user.get("face_embedding")
        if not stored:
            continue
        dist = cosine_distance(current_embedding, stored)
        if dist < best_distance:
            second_best_distance = best_distance
            best_distance = dist
            best_match = user
        elif dist < second_best_distance:
            second_best_distance = dist

    return best_match, best_distance, second_best_distance


def face_match_is_confident(best_distance: float, second_best_distance: float) -> bool:
    if best_distance > FACE_MATCH_THRESHOLD:
        return False
    if second_best_distance == float("inf"):
        return True
    return (second_best_distance - best_distance) >= FACE_MATCH_MARGIN


# ─── Request/Response Models ─────────────────────────

class RegisterRequest(BaseModel):
    face_image: str
    liveness_proof: dict
    display_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    gender: Optional[str] = None
    birthday: Optional[str] = None


class LoginFaceRequest(BaseModel):
    face_image: str
    liveness_proof: dict


class LoginQuroIdRequest(BaseModel):
    quro_id: str
    password: str


class LoginPhonePasswordRequest(BaseModel):
    phone: str
    password: str


class LoginGoogleRequest(BaseModel):
    access_token: str


class QrLoginConfirmRequest(BaseModel):
    qr_session_token: str


class SendMessageRequest(BaseModel):
    conversation_id: str
    content: str
    content_type: str = "text"
    media_url: Optional[str] = None


class PostStatusRequest(BaseModel):
    text: Optional[str] = None
    image_url: Optional[str] = None


class OTPSendRequest(BaseModel):
    email: str
    purpose: str = "Registration"


class OTPVerifyRequest(BaseModel):
    email: str
    code: str


# ─── OTP Routes ──────────────────────────────────────

@app.post("/api/otp/send")
async def send_otp(req: OTPSendRequest):
    """Generate a 6-digit OTP and email it to the user."""
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    # Rate limit: don't allow resend within 60 seconds
    if email in otp_store:
        existing = otp_store[email]
        cooldown_end = existing.get("sent_at", datetime.min) + timedelta(seconds=60)
        if datetime.now() < cooldown_end:
            remaining = int((cooldown_end - datetime.now()).total_seconds())
            raise HTTPException(status_code=429, detail=f"Please wait {remaining}s before requesting a new code")

    code = "".join([str(random.randint(0, 9)) for _ in range(6)])
    otp_store[email] = {
        "code": code,
        "expires": datetime.now() + timedelta(minutes=5),
        "sent_at": datetime.now(),
    }

    success = send_otp_email(email, code, req.purpose)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send verification email")

    return {"success": True, "message": f"Verification code sent to {email}"}


@app.post("/api/otp/verify")
async def verify_otp(req: OTPVerifyRequest):
    """Verify the OTP code for the given email."""
    email = req.email.strip().lower()
    code = req.code.strip()

    if email not in otp_store:
        raise HTTPException(status_code=400, detail="No verification code was sent to this email")

    stored = otp_store[email]
    if datetime.now() > stored["expires"]:
        del otp_store[email]
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one")

    if stored["code"] != code:
        raise HTTPException(status_code=400, detail="Invalid code")

    # Valid! Clean up
    del otp_store[email]
    return {"success": True, "verified": True}


# ─── Auth Routes ─────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "quro-shield-api", "version": "2.0.0"}


@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    """Register a new user with facial biometrics."""
    validate_liveness_proof(req.liveness_proof, require_mouth=True)

    try:
        embedding = get_face_embedding(req.face_image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face processing failed: {str(e)}")

    existing = supabase.table("users").select("id, quro_id, face_embedding").execute()
    if existing.data:
        duplicate, duplicate_distance, _ = find_best_face_match(embedding, existing.data)
        if duplicate and duplicate_distance <= FACE_DUPLICATE_THRESHOLD:
            raise HTTPException(
                status_code=409,
                detail="This face is already registered to another Quro account"
            )

    quro_id = generate_unique_quro_id()
    password_hashed = hash_password(req.password)
    # Keep the legacy pin_hash column populated until the database schema is migrated.
    pin_hashed = hash_pin(req.password)

    user_data = {
        "quro_id": quro_id,
        "display_name": req.display_name,
        "email": req.email,
        "phone": req.phone,
        "gender": req.gender,
        "birthday": req.birthday,
        "pin_hash": pin_hashed,
        "password_hash": password_hashed,
        "face_embedding": embedding,
        "avatar_url": "/default-avatar.jpg",
        "verified": True,
    }

    result = supabase.table("users").insert(user_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = result.data[0]
    token = create_jwt(user["id"], quro_id)

    supabase.table("sessions").insert({
        "user_id": user["id"],
        "token": token,
        "device_info": "registration",
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
    }).execute()

    return {
        "quro_id": quro_id,
        "session_token": token,
        "display_name": req.display_name,
        "avatar_url": user.get("avatar_url"),
    }


@app.post("/api/auth/login/face")
async def login_face(req: LoginFaceRequest):
    """Authenticate via facial recognition. Searches all users for a match."""
    validate_liveness_proof(req.liveness_proof, require_mouth=True)

    try:
        current_embedding = get_face_embedding(req.face_image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Face processing failed: {str(e)}")

    result = supabase.table("users").select("id, quro_id, display_name, avatar_url, face_embedding").execute()
    if not result.data:
        return {"matched": False, "distance": 2.0}

    best_match, best_distance, second_best_distance = find_best_face_match(current_embedding, result.data)

    if best_match and face_match_is_confident(best_distance, second_best_distance):
        token = create_jwt(best_match["id"], best_match["quro_id"])

        print(
            f"[ArcFace] Accepted {best_match['quro_id']}: "
            f"distance={best_distance:.4f}, second={second_best_distance:.4f}"
        )

        supabase.table("sessions").insert({
            "user_id": best_match["id"],
            "token": token,
            "device_info": "face_login",
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
        }).execute()

        return {
            "matched": True,
            "quro_id": best_match["quro_id"],
            "session_token": token,
            "display_name": best_match["display_name"],
            "avatar_url": best_match.get("avatar_url"),
            "distance": float(best_distance),
            "second_distance": None if second_best_distance == float("inf") else float(second_best_distance),
        }

    safe_distance = 2.0 if best_distance == float("inf") else float(best_distance)
    safe_second = None if second_best_distance == float("inf") else float(second_best_distance)
    return {"matched": False, "distance": safe_distance, "second_distance": safe_second}


@app.post("/api/auth/login/quro-id")
async def login_quro_id(req: LoginQuroIdRequest):
    """Fallback login using Quro ID + password."""
    result = supabase.table("users").select("*").eq("quro_id", req.quro_id.upper()).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Quro ID not found")

    user = result.data[0]
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_jwt(user["id"], user["quro_id"])

    supabase.table("sessions").insert({
        "user_id": user["id"],
        "token": token,
        "device_info": "quro_id_login",
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
    }).execute()

    return {
        "quro_id": user["quro_id"],
        "session_token": token,
        "display_name": user["display_name"],
        "avatar_url": user.get("avatar_url"),
    }


@app.post("/api/auth/login/password")
async def login_phone_password(req: LoginPhonePasswordRequest):
    """Fallback login using phone number + password."""
    normalized_phone = req.phone.strip()
    result = supabase.table("users").select("*").eq("phone", normalized_phone).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Phone number not found")

    user = result.data[0]
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_jwt(user["id"], user["quro_id"])

    supabase.table("sessions").insert({
        "user_id": user["id"],
        "token": token,
        "device_info": "phone_password_login",
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
    }).execute()

    return {
        "quro_id": user["quro_id"],
        "session_token": token,
        "display_name": user["display_name"],
        "avatar_url": user.get("avatar_url"),
    }


@app.post("/api/auth/login/google")
async def login_google(req: LoginGoogleRequest):
    """Exchange a verified Supabase Google session for a Quro backend session."""
    try:
        auth_user = supabase.auth.get_user(req.access_token)
        supa_user = getattr(auth_user, "user", None)
        email = getattr(supa_user, "email", None)
    except Exception as e:
        print(f"[Google Login] Supabase token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Google session could not be verified")

    if not email:
        raise HTTPException(status_code=400, detail="Google account email is missing")

    result = supabase.table("users").select("*").eq("email", email.strip().lower()).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No Quro account is bound to this Google email")

    user = result.data[0]
    token = create_jwt(user["id"], user["quro_id"])

    supabase.table("sessions").insert({
        "user_id": user["id"],
        "token": token,
        "device_info": "google_login",
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
    }).execute()

    return {
        "quro_id": user["quro_id"],
        "session_token": token,
        "display_name": user["display_name"],
        "avatar_url": user.get("avatar_url"),
    }


# ─── OTP Recovery ────────────────────────────────────

@app.post("/api/auth/otp/send")
async def send_otp(req: OTPSendRequest):
    """Send a 6-digit OTP to the user's email for account recovery."""
    # Check if user exists with this email
    result = supabase.table("users").select("id, email").eq("email", req.email).execute()
    if not result.data:
        # Don't reveal if email exists or not for security
        return {"sent": True, "message": "If an account exists, a code was sent."}

    # Generate OTP
    otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    # Store OTP in DB
    supabase.table("otp_codes").insert({
        "email": req.email,
        "code": otp_code,
        "expires_at": expires_at,
        "used": False,
    }).execute()

    # In production, send via email service (SendGrid, Resend, etc.)
    # For now, log it (dev mode)
    print(f"📧 OTP for {req.email}: {otp_code}")

    return {"sent": True, "message": "Verification code sent to your email."}


@app.post("/api/auth/otp/verify")
async def verify_otp(req: OTPVerifyRequest):
    """Verify a 6-digit OTP and create a session."""
    # Find the most recent unused OTP for this email
    result = supabase.table("otp_codes").select("*").eq(
        "email", req.email
    ).eq("code", req.token).eq("used", False).order(
        "created_at", desc=True
    ).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid or expired code")

    otp_row = result.data[0]

    # Check expiry
    expires = datetime.fromisoformat(otp_row["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=401, detail="Code expired. Request a new one.")

    # Mark as used
    supabase.table("otp_codes").update({"used": True}).eq("id", otp_row["id"]).execute()

    # Find the user
    user_result = supabase.table("users").select("id, quro_id, display_name, avatar_url").eq("email", req.email).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = user_result.data[0]
    token = create_jwt(user["id"], user["quro_id"])

    supabase.table("sessions").insert({
        "user_id": user["id"],
        "token": token,
        "device_info": "otp_recovery",
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
    }).execute()

    return {
        "verified": True,
        "quro_id": user["quro_id"],
        "session_token": token,
        "display_name": user["display_name"],
        "avatar_url": user.get("avatar_url"),
    }


# ─── QR Login WebSocket ─────────────────────────────

@app.post("/api/auth/qr/create")
async def create_qr_session():
    """Desktop calls this to get a QR session token to display."""
    session_token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

    supabase.table("qr_sessions").insert({
        "session_token": session_token,
        "status": "pending",
        "expires_at": expires_at,
    }).execute()

    return {"qr_session_token": session_token, "expires_at": expires_at}


@app.websocket("/ws/qr/{session_token}")
async def qr_login_websocket(websocket: WebSocket, session_token: str):
    await websocket.accept()
    qr_ws_connections[session_token] = websocket

    try:
        await websocket.send_json({"type": "connected", "status": "waiting"})

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=300)
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "expired"})
                break
    except WebSocketDisconnect:
        pass
    finally:
        qr_ws_connections.pop(session_token, None)


@app.post("/api/auth/login/qr")
async def confirm_qr_login(req: QrLoginConfirmRequest, user=Depends(get_current_user)):
    result = supabase.table("qr_sessions").select("*").eq("session_token", req.qr_session_token).eq("status", "pending").execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="QR session not found or expired")

    user_result = supabase.table("users").select("id, quro_id, display_name, avatar_url").eq("id", user["sub"]).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user_info = user_result.data[0]
    desktop_token = create_jwt(user_info["id"], user_info["quro_id"])

    supabase.table("sessions").insert({
        "user_id": user_info["id"],
        "token": desktop_token,
        "device_info": "qr_desktop_login",
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat(),
    }).execute()

    supabase.table("qr_sessions").update({
        "status": "authenticated",
        "user_id": user_info["id"],
    }).eq("session_token", req.qr_session_token).execute()

    ws = qr_ws_connections.get(req.qr_session_token)
    if ws:
        try:
            await ws.send_json({
                "type": "authenticated",
                "quro_id": user_info["quro_id"],
                "session_token": desktop_token,
                "display_name": user_info["display_name"],
                "avatar_url": user_info.get("avatar_url"),
            })
        except Exception:
            pass

    return {"authenticated": True}


# ─── User Routes ─────────────────────────────────────

@app.get("/api/user/profile")
async def get_profile(user=Depends(get_current_user)):
    result = supabase.table("users").select(
        "id, quro_id, display_name, email, phone, gender, birthday, avatar_url, bio, verified, created_at"
    ).eq("id", user["sub"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdatePasswordRequest(BaseModel):
    password: str


@app.put("/api/user/profile")
async def update_profile(req: UpdateProfileRequest, user=Depends(get_current_user)):
    """Update the current user's profile fields."""
    update_data = {}
    if req.display_name is not None:
        update_data["display_name"] = req.display_name.strip()
    if req.bio is not None:
        update_data["bio"] = req.bio.strip()
    if req.email is not None:
        update_data["email"] = req.email.strip()
    if req.phone is not None:
        update_data["phone"] = req.phone.strip()
    if req.gender is not None:
        update_data["gender"] = req.gender
    if req.birthday is not None:
        update_data["birthday"] = req.birthday
    if req.avatar_url is not None:
        update_data["avatar_url"] = req.avatar_url

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("users").update(update_data).eq("id", user["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    return result.data[0]


@app.put("/api/user/password")
async def update_password(req: UpdatePasswordRequest, user=Depends(get_current_user)):
    password = req.password.strip()
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    password_hash = hash_password(password)
    pin_hash = hash_pin(password)

    result = supabase.table("users").update({
        "password_hash": password_hash,
        "pin_hash": pin_hash,
    }).eq("id", user["sub"]).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update password")

    return {"updated": True}


@app.delete("/api/user/delete")
async def delete_account(user=Depends(get_current_user)):
    """Permanently delete the user's account and all associated data."""
    profile = supabase.table("users").select("quro_id").eq("id", user["sub"]).execute()
    quro_id = profile.data[0]["quro_id"] if profile.data else None

    # Delete known dependent rows directly; cascades can still handle anything missed.
    supabase.table("messages").delete().eq("sender_id", user["sub"]).execute()
    supabase.table("messages").delete().eq("receiver_id", user["sub"]).execute()
    if quro_id:
        supabase.table("messages").delete().eq("receiver_id", quro_id).execute()
        supabase.table("qr_sessions").delete().eq("user_id", user["sub"]).execute()
    supabase.table("statuses").delete().eq("user_id", user["sub"]).execute()
    supabase.table("sessions").delete().eq("user_id", user["sub"]).execute()
    result = supabase.table("users").delete().eq("id", user["sub"]).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to delete account")
    return {"deleted": True}

# ─── Chat Routes ─────────────────────────────────────

@app.post("/api/chat/send")
async def send_message(req: SendMessageRequest, user=Depends(get_current_user)):
    msg = {
        "conversation_id": req.conversation_id,
        "sender_id": user["sub"],
        "receiver_id": req.conversation_id,
        "content": req.content,
        "content_type": req.content_type,
        "media_url": req.media_url,
        "status": "sent",
    }
    result = supabase.table("messages").insert(msg).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send message")
    return result.data[0]


@app.get("/api/chat/messages/{conversation_id}")
async def get_messages(conversation_id: str, user=Depends(get_current_user)):
    result = supabase.table("messages").select("*").eq(
        "conversation_id", conversation_id
    ).order("created_at", desc=False).execute()
    return result.data or []


# ─── Status Routes ───────────────────────────────────

@app.post("/api/status/post")
async def post_status(req: PostStatusRequest, user=Depends(get_current_user)):
    status = {
        "user_id": user["sub"],
        "text": req.text,
        "image_url": req.image_url,
    }
    result = supabase.table("statuses").insert(status).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to post status")
    return result.data[0]


@app.get("/api/status/feed")
async def get_feed(user=Depends(get_current_user)):
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    result = supabase.table("statuses").select(
        "*, users(display_name, avatar_url, quro_id)"
    ).gte("created_at", cutoff).order("created_at", desc=True).execute()
    return result.data or []


# ─── Real-Time Chat WebSocket Hub ────────────────────

@app.websocket("/ws/chat/{user_id}")
async def chat_websocket(websocket: WebSocket, user_id: str, token: str = ""):
    """
    Persistent WebSocket for real-time messaging + call signaling.
    
    Message types handled:
      - message: Chat message → forwarded to recipient + stored in Supabase
      - read_receipt: Mark messages as read → forwarded to sender
      - call_offer/call_answer/ice_candidate/call_reject/call_end: WebRTC signaling
      - ping: Keep-alive
    """
    await websocket.accept()
    chat_ws_connections.setdefault(user_id, []).append(websocket)
    total_connections = sum(len(conns) for conns in chat_ws_connections.values())
    print(f"🟢 User {user_id} connected to chat hub. Online users: {len(chat_ws_connections)}, sockets: {total_connections}")

    # Notify contacts this user is online
    try:
        await broadcast_presence(user_id, True)
    except Exception:
        pass

    try:
        while True:
            raw = await websocket.receive_text()
            if raw == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type", "")

            # ── Chat Message ──────────────────────────
            if msg_type == "message":
                recipient_id = data.get("to", "")
                content = data.get("content", "")
                content_type = data.get("content_type", "text")
                msg_id = data.get("id", str(uuid.uuid4()))
                timestamp = data.get("timestamp", datetime.now(timezone.utc).isoformat())

                # Store in Supabase
                try:
                    db_msg = {
                        "id": msg_id,
                        "conversation_id": recipient_id,
                        "sender_id": user_id,
                        "receiver_id": recipient_id,
                        "content": content,
                        "content_type": content_type,
                        "status": "sent",
                    }
                    supabase.table("messages").insert(db_msg).execute()
                except Exception as e:
                    print(f"⚠️ Failed to store message: {e}")

                # Forward to recipient if online
                recipient_connections = list(chat_ws_connections.get(recipient_id, []))
                if recipient_connections:
                    delivered = False
                    try:
                        for recipient_ws in recipient_connections:
                            await recipient_ws.send_json({
                                "type": "message",
                                "id": msg_id,
                                "from": user_id,
                                "content": content,
                                "content_type": content_type,
                                "timestamp": timestamp,
                                "status": "delivered",
                            })
                            delivered = True
                    except Exception:
                        pass

                    if delivered:
                        # Confirm delivery to sender
                        await websocket.send_json({
                            "type": "delivery_receipt",
                            "id": msg_id,
                            "status": "delivered",
                        })
                    else:
                        await websocket.send_json({
                            "type": "delivery_receipt",
                            "id": msg_id,
                            "status": "sent",
                        })
                else:
                    # Recipient offline — message stays in DB as "sent"
                    await websocket.send_json({
                        "type": "delivery_receipt",
                        "id": msg_id,
                        "status": "sent",
                    })

            # ── Read Receipt ──────────────────────────
            elif msg_type == "read_receipt":
                target_user = data.get("to", "")
                target_connections = list(chat_ws_connections.get(target_user, []))
                if target_connections:
                    try:
                        for target_ws in target_connections:
                            await target_ws.send_json({
                                "type": "read_receipt",
                                "from": user_id,
                                "timestamp": data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                            })
                    except Exception:
                        pass
                # Update messages in DB
                try:
                    supabase.table("messages").update({"status": "read"}).eq(
                        "sender_id", target_user
                    ).eq("receiver_id", user_id).neq("status", "read").execute()
                except Exception:
                    pass

            # ── WebRTC Call Signaling ─────────────────
            elif msg_type in ("call_offer", "call_answer", "ice_candidate", "call_reject", "call_end"):
                target_user = data.get("to", "")
                target_connections = list(chat_ws_connections.get(target_user, []))
                
                # Filter out the sender's own websocket UNLESS they are explicitly calling themselves (for testing)
                if target_user != user_id:
                    target_connections = [ws for ws in target_connections if ws is not websocket]

                if target_connections:
                    forward_data = {**data, "from": user_id}
                    forward_data.pop("to", None)
                    for target_ws in list(target_connections):
                        try:
                            await target_ws.send_json(forward_data)
                        except Exception:
                            pass

                    if msg_type == "call_answer":
                        for sibling_ws in [
                            ws for ws in chat_ws_connections.get(user_id, [])
                            if ws is not websocket
                        ]:
                            try:
                                await sibling_ws.send_json({
                                    "type": "call_answered_elsewhere",
                                    "from": target_user,
                                })
                            except Exception:
                                pass
                else:
                    # Target not online — can't call
                    if msg_type == "call_offer":
                        await websocket.send_json({
                            "type": "call_unavailable",
                            "reason": "No other active device is online for this contact",
                        })

            # ── Typing Indicator ──────────────────────
            elif msg_type == "typing":
                target_user = data.get("to", "")
                target_connections = list(chat_ws_connections.get(target_user, []))
                if target_connections:
                    try:
                        for target_ws in target_connections:
                            await target_ws.send_json({
                                "type": "typing",
                                "from": user_id,
                            })
                    except Exception:
                        pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"⚠️ Chat WS error for {user_id}: {e}")
    finally:
        connections = chat_ws_connections.get(user_id, [])
        chat_ws_connections[user_id] = [ws for ws in connections if ws is not websocket]
        if not chat_ws_connections[user_id]:
            chat_ws_connections.pop(user_id, None)
            try:
                await broadcast_presence(user_id, False)
            except Exception:
                pass
        total_connections = sum(len(conns) for conns in chat_ws_connections.values())
        print(f"🔴 User {user_id} disconnected. Online users: {len(chat_ws_connections)}, sockets: {total_connections}")


async def broadcast_presence(user_id: str, is_online: bool):
    """Notify all connected users about someone's presence change."""
    msg = {"type": "presence", "user_id": user_id, "online": is_online}
    for uid, connections in list(chat_ws_connections.items()):
        if uid != user_id:
            for ws in list(connections):
                try:
                    await ws.send_json(msg)
                except Exception:
                    pass


# ─── Friend / Contact Lookup ────────────────────────

@app.get("/api/user/lookup/{quro_id}")
async def lookup_user(quro_id: str):
    """Look up a user by their Quro ID (for adding friends via QR)."""
    result = supabase.table("users").select(
        "quro_id, display_name, avatar_url, gender, verified"
    ).eq("quro_id", quro_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]


@app.get("/api/user/online/{user_id}")
async def check_online(user_id: str):
    """Check if a user is currently online."""
    return {"online": user_id in chat_ws_connections}


# ─── Run ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
