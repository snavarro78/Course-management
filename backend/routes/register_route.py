from fastapi import APIRouter, HTTPException, status

from models.database import get_supabase
from schema.schemas import PersonaCreate, PersonaResponse
from middleware.security import hash_password

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=PersonaResponse, status_code=status.HTTP_201_CREATED)
def register(body: PersonaCreate):
    """Registra una nueva persona con contraseña hasheada."""
    client = get_supabase()

    # Verificar que el email no exista
    existing = (
        client.table("personas")
        .select("id_persona")
        .eq("email", body.email)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El email ya está registrado",
        )

    # Verificar que la cédula no exista
    existing_cedula = (
        client.table("personas")
        .select("id_persona")
        .eq("cedula", body.cedula)
        .execute()
    )
    if existing_cedula.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La cédula ya está registrada",
        )

    # Preparar datos con contraseña hasheada
    data = body.model_dump()
    data["contra"] = hash_password(data["contra"])

    result = client.table("personas").insert(data).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al registrar la persona",
        )

    return result.data[0]