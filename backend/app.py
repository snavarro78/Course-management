from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
import logging
import time
import os

load_dotenv()

APP_NAME        = os.getenv("APP_NAME", "Backend API")
APP_VERSION     = os.getenv("APP_VERSION", "1.0.0")
DEBUG           = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")]

from models.database import check_supabase_connection

# ─── Routers ──────────────────────────────────────────────────────────────────
from routes.login_route import router as login_router
from routes.register_route import router as register_router
from routes.personas_route import router as personas_router
from routes.cursos_route import router as cursos_router
from routes.matriculas_route import router as matriculas_router
from routes.catalogos_route import clases_router, estratos_router
from routes.curso_mediadores_route import router as curso_mediadores_router
from routes.carga_masiva_route import router as carga_masiva_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ─── Lifecycle ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Iniciando {APP_NAME} v{APP_VERSION}")
    ok = check_supabase_connection()
    if not ok:
        logger.warning("⚠️  No se pudo verificar la conexión a Supabase")
    else:
        logger.info("✅ Supabase conectado correctamente")
    yield
    logger.info("🛑 Aplicación detenida")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    debug=DEBUG,
    lifespan=lifespan,
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# ─── Rate limit handler ───────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# ─── Middleware: Logging de requests ─────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response


# ─── Middleware: Cabeceras de seguridad ───────────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ─── Manejador global de errores ─────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Error no manejado en {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Error interno del servidor"},
    )


# ─── Registrar routers ────────────────────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(login_router,            prefix=PREFIX)
app.include_router(register_router,         prefix=PREFIX)
app.include_router(personas_router,         prefix=PREFIX)
app.include_router(cursos_router,           prefix=PREFIX)
app.include_router(matriculas_router,       prefix=PREFIX)
app.include_router(clases_router,           prefix=PREFIX)
app.include_router(estratos_router,         prefix=PREFIX)
app.include_router(curso_mediadores_router, prefix=PREFIX)
app.include_router(carga_masiva_router,     prefix=PREFIX)


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
@limiter.limit("30/minute")
def health_check(request: Request):
    db_ok = check_supabase_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "app": APP_NAME,
        "version": APP_VERSION,
        "supabase": "connected" if db_ok else "disconnected",
    }