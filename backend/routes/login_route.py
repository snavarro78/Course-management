from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from dotenv import load_dotenv
import os

from models.database import get_supabase
from schema.schemas import LoginRequest, TokenResponse
from middleware.security import verify_password, create_access_token

load_dotenv()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    """
    Autentica a una persona y devuelve un JWT.
    Busca por email en la tabla personas y verifica la contraseña.
    """
    # Validar dominio del correo
    if not body.email.endswith("@mep.go.cr"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Solo se permiten correos institucionales @mep.go.cr",
        )

    client = get_supabase()

    # Buscar persona por email
    result = (
        client.table("personas")
        .select("id_persona, email, contra, rol, nombre")
        .eq("email", body.email)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    persona = result.data

    # Solo admin y sub_admin pueden iniciar sesión
    if persona["rol"] not in ("admin", "sub_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. No tienes permisos para ingresar al sistema.",
        )

    # Verificar contraseña
    if not verify_password(body.password, persona["contra"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Crear token
    expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
    token = create_access_token(
        data={
            "sub": str(persona["id_persona"]),
            "email": persona["email"],
            "rol": persona["rol"],
        },
        expires_delta=timedelta(minutes=expire_minutes),
    )

    return TokenResponse(
        access_token=token,
        expires_in=expire_minutes * 60,
        rol=persona["rol"],
    )


@router.post("/logout", tags=["Autenticación"])
def logout():
    """
    El logout en JWT se maneja del lado del cliente eliminando el token.
    Para invalidación server-side, implementar una blocklist en Supabase.
    """
    return {"message": "Sesión cerrada. Elimina el token del cliente."}