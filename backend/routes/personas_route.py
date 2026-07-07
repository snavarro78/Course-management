from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional

from models.database import get_supabase
from schema.schemas import PersonaCreate, PersonaUpdate, PersonaResponse
from middleware.security import hash_password

router = APIRouter(prefix="/personas", tags=["Personas"])


@router.get("/", response_model=List[PersonaResponse])
def get_personas(
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = Query(None, description="Buscar por nombre, apellidos o cédula")
):
    client = get_supabase()
    query = (
        client.table("personas")
        .select(
            "id_persona, cedula, nombre, apellidos, email, rol, "
            "direccion_regional_oficina, sexo, id_estrato, id_clase_puesto"
        )
    )
    if q:
        # Supabase permite OR con ilike para búsqueda insensible a mayúsculas
        query = query.or_(
            f"nombre.ilike.%{q}%,"
            f"apellidos.ilike.%{q}%,"
            f"cedula.ilike.%{q}%,"
            f"email.ilike.%{q}%"
        )
    result = query.range(skip, skip + limit - 1).execute()
    return result.data or []


@router.get("/{id_persona}", response_model=PersonaResponse)
def get_persona(id_persona: int):
    client = get_supabase()
    result = (
        client.table("personas")
        .select(
            "id_persona, cedula, nombre, apellidos, email, rol, "
            "direccion_regional_oficina, sexo, id_estrato, id_clase_puesto"
        )
        .eq("id_persona", id_persona)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    return result.data


@router.post("/", response_model=PersonaResponse, status_code=status.HTTP_201_CREATED)
def create_persona(body: PersonaCreate):
    client = get_supabase()
    data = body.model_dump()
    data["contra"] = hash_password(data["contra"])
    result = client.table("personas").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Error al crear la persona")
    p = result.data[0]
    p.pop("contra", None)
    return p


@router.put("/{id_persona}", response_model=PersonaResponse)
def update_persona(id_persona: int, body: PersonaUpdate):
    client = get_supabase()
    data = body.model_dump(exclude_unset=True, exclude_none=True)
    if "contra" in data:
        data["contra"] = hash_password(data["contra"])
    result = (
        client.table("personas")
        .update(data)
        .eq("id_persona", id_persona)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    p = result.data[0]
    p.pop("contra", None)
    return p


@router.delete("/{id_persona}", status_code=status.HTTP_204_NO_CONTENT)
def delete_persona(id_persona: int):
    client = get_supabase()
    result = client.table("personas").delete().eq("id_persona", id_persona).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Persona no encontrada")