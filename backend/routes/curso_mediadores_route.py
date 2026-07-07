from fastapi import APIRouter, HTTPException, status
from typing import List

from models.database import get_supabase
from schema.schemas import CursoMediadorCreate, CursoMediadorResponse

router = APIRouter(prefix="/curso-mediadores", tags=["Curso Mediadores"])


@router.get("/", response_model=List[CursoMediadorResponse])
def get_curso_mediadores():
    client = get_supabase()
    result = client.table("curso_mediadores").select("*").execute()
    return result.data or []


@router.get("/curso/{id_curso}", response_model=List[CursoMediadorResponse])
def get_mediadores_por_curso(id_curso: int):
    """Devuelve todos los mediadores asignados a un curso."""
    client = get_supabase()
    result = (
        client.table("curso_mediadores")
        .select("*")
        .eq("id_curso", id_curso)
        .execute()
    )
    return result.data or []


@router.get("/mediador/{id_persona}", response_model=List[CursoMediadorResponse])
def get_cursos_por_mediador(id_persona: int):
    """Devuelve todos los cursos asignados a un mediador."""
    client = get_supabase()
    result = (
        client.table("curso_mediadores")
        .select("*")
        .eq("id_persona", id_persona)
        .execute()
    )
    return result.data or []


@router.post("/", response_model=CursoMediadorResponse, status_code=status.HTTP_201_CREATED)
def asignar_mediador(body: CursoMediadorCreate):
    """Asigna un mediador a un curso. Máximo 4 mediadores por curso."""
    client = get_supabase()

    # Verificar que la persona existe y tiene rol mediador
    persona = (
        client.table("personas")
        .select("id_persona, rol")
        .eq("id_persona", body.id_persona)
        .single()
        .execute()
    )
    if not persona.data:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    if persona.data["rol"] != "mediador":
        raise HTTPException(status_code=400, detail="La persona no tiene rol de mediador")

    # Verificar que no exceda 4 mediadores por curso
    count_result = (
        client.table("curso_mediadores")
        .select("id_curso_mediador")
        .eq("id_curso", body.id_curso)
        .execute()
    )
    if len(count_result.data or []) >= 4:
        raise HTTPException(status_code=400, detail="El curso ya tiene el máximo de 4 mediadores")

    # Verificar que no esté ya asignado
    dup = (
        client.table("curso_mediadores")
        .select("id_curso_mediador")
        .eq("id_curso", body.id_curso)
        .eq("id_persona", body.id_persona)
        .execute()
    )
    if dup.data:
        raise HTTPException(status_code=400, detail="Este mediador ya está asignado a este curso")

    result = client.table("curso_mediadores").insert(body.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Error al asignar mediador")
    return result.data[0]


@router.delete("/{id_curso_mediador}", status_code=status.HTTP_204_NO_CONTENT)
def remover_mediador(id_curso_mediador: int):
    """Remueve un mediador de un curso."""
    client = get_supabase()
    result = (
        client.table("curso_mediadores")
        .delete()
        .eq("id_curso_mediador", id_curso_mediador)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")