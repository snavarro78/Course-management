from supabase import create_client, Client
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

_supabase_client: Client | None = None
_supabase_admin: Client | None = None


def get_supabase() -> Client:
    """Retorna el cliente Supabase con anon key (uso general)."""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("SUPABASE_URL y SUPABASE_KEY son requeridos en el .env")
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("✅ Supabase client inicializado")
    return _supabase_client


def get_supabase_admin() -> Client:
    """
    Retorna el cliente Supabase con service_role key.
    ⚠️  Solo usar en operaciones del servidor, NUNCA exponer al cliente.
    """
    global _supabase_admin
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY no está configurado en el .env")
    if _supabase_admin is None:
        _supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("✅ Supabase admin client inicializado")
    return _supabase_admin


def check_supabase_connection() -> bool:
    """Verifica que la conexión a Supabase esté activa."""
    try:
        client = get_supabase()
        client.table("personas").select("id_persona").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"❌ Error de conexión Supabase: {e}")
        return False