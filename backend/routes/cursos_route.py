from fastapi import APIRouter, HTTPException, status
from typing import List

from models.database import get_supabase
from schema.schemas import CursoCreate, CursoUpdate, CursoResponse

router = APIRouter(prefix="/cursos", tags=["Cursos"])


@router.get("/", response_model=List[CursoResponse])
def get_cursos(skip: int = 0, limit: int = 100):
    result = get_supabase().table("cursos").select("*").range(skip, skip + limit - 1).execute()
    return result.data or []


@router.get("/{id_curso}", response_model=CursoResponse)
def get_curso(id_curso: int):
    result = get_supabase().table("cursos").select("*").eq("id_curso", id_curso).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return result.data


@router.post("/", response_model=CursoResponse, status_code=status.HTTP_201_CREATED)
def create_curso(body: CursoCreate):
    data = body.model_dump()
    if data.get("fecha_inicio"):
        data["fecha_inicio"] = str(data["fecha_inicio"])
    if data.get("fecha_fin"):
        data["fecha_fin"] = str(data["fecha_fin"])
    result = get_supabase().table("cursos").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Error al crear el curso")
    return result.data[0]


@router.put("/{id_curso}", response_model=CursoResponse)
def update_curso(id_curso: int, body: CursoUpdate):
    data = body.model_dump(exclude_unset=True, exclude_none=True)
    if "fecha_inicio" in data:
        data["fecha_inicio"] = str(data["fecha_inicio"])
    if "fecha_fin" in data:
        data["fecha_fin"] = str(data["fecha_fin"])
    result = get_supabase().table("cursos").update(data).eq("id_curso", id_curso).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return result.data[0]


@router.delete("/{id_curso}", status_code=status.HTTP_204_NO_CONTENT)
def delete_curso(id_curso: int):
    result = get_supabase().table("cursos").delete().eq("id_curso", id_curso).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Curso no encontrado")