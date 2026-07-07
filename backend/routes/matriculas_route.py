from fastapi import APIRouter, HTTPException, status
from typing import List

from models.database import get_supabase
from schema.schemas import MatriculaCreate, MatriculaUpdate, MatriculaResponse

router = APIRouter(prefix="/matriculas", tags=["Matrículas"])


@router.get("/", response_model=List[MatriculaResponse])
def get_matriculas(skip: int = 0, limit: int = 5000):
    client = get_supabase()
    # Traer matrículas
    mat_result = (
        client.table("matriculas")
        .select("*")
        .range(skip, skip + limit - 1)
        .execute()
    )
    matriculas = mat_result.data or []
    if not matriculas:
        return []

    # Traer personas únicas referenciadas
    ids = list({m["id_persona"] for m in matriculas})
    per_result = (
        client.table("personas")
        .select("id_persona, cedula, nombre, apellidos, email, rol")
        .in_("id_persona", ids)
        .execute()
    )
    personas_map = {p["id_persona"]: p for p in (per_result.data or [])}

    # Combinar
    for m in matriculas:
        m["personas"] = personas_map.get(m["id_persona"])

    return matriculas


@router.get("/curso/{id_curso}", response_model=List[MatriculaResponse])
def get_matriculas_by_curso(id_curso: int):
    """Devuelve todas las matrículas de un curso específico con datos de la persona."""
    client = get_supabase()
    result = (
        client.table("matriculas")
        .select("*, personas(id_persona, cedula, nombre, apellidos, email, rol)")
        .eq("id_curso", id_curso)
        .execute()
    )
    return result.data or []


@router.get("/{id_matricula}", response_model=MatriculaResponse)
def get_matricula(id_matricula: int):
    result = get_supabase().table("matriculas").select("*").eq("id_matricula", id_matricula).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")
    return result.data


@router.get("/persona/{id_persona}", response_model=List[MatriculaResponse])
def get_matriculas_by_persona(id_persona: int):
    result = get_supabase().table("matriculas").select("*").eq("id_persona", id_persona).execute()
    return result.data or []


@router.post("/", response_model=MatriculaResponse, status_code=status.HTTP_201_CREATED)
def create_matricula(body: MatriculaCreate):
    client = get_supabase()
    existing = (
        client.table("matriculas")
        .select("id_matricula")
        .eq("id_persona", body.id_persona)
        .eq("id_curso", body.id_curso)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="La persona ya está matriculada en este curso")
    result = client.table("matriculas").insert(body.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Error al crear la matrícula")
    return result.data[0]


@router.put("/{id_matricula}", response_model=MatriculaResponse)
def update_matricula(id_matricula: int, body: MatriculaUpdate):
    data = body.model_dump(exclude_unset=True, exclude_none=True)
    result = get_supabase().table("matriculas").update(data).eq("id_matricula", id_matricula).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")
    return result.data[0]


@router.delete("/{id_matricula}", status_code=status.HTTP_204_NO_CONTENT)
def delete_matricula(id_matricula: int):
    result = get_supabase().table("matriculas").delete().eq("id_matricula", id_matricula).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Matrícula no encontrada")