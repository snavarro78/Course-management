from fastapi import APIRouter, HTTPException, status
from typing import List

from models.database import get_supabase
from schema.schemas import (
    ClasePuestoCreate, ClasePuestoUpdate, ClasePuestoResponse,
    EstratoCreate, EstratoUpdate, EstratoResponse,
)

# ─── Clases de Puesto ─────────────────────────────────────────────────────────
clases_router = APIRouter(prefix="/clases-puesto", tags=["Clases de Puesto"])


@clases_router.get("/", response_model=List[ClasePuestoResponse])
def get_clases():
    result = get_supabase().table("clases_puesto").select("*").execute()
    return result.data or []


@clases_router.get("/{id_clase_puesto}", response_model=ClasePuestoResponse)
def get_clase(id_clase_puesto: int):
    result = get_supabase().table("clases_puesto").select("*").eq("id_clase_puesto", id_clase_puesto).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Clase de puesto no encontrada")
    return result.data


@clases_router.post("/", response_model=ClasePuestoResponse, status_code=201)
def create_clase(body: ClasePuestoCreate):
    result = get_supabase().table("clases_puesto").insert(body.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Error al crear")
    return result.data[0]


@clases_router.put("/{id_clase_puesto}", response_model=ClasePuestoResponse)
def update_clase(id_clase_puesto: int, body: ClasePuestoUpdate):
    data = body.model_dump(exclude_unset=True, exclude_none=True)
    result = get_supabase().table("clases_puesto").update(data).eq("id_clase_puesto", id_clase_puesto).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Clase de puesto no encontrada")
    return result.data[0]


@clases_router.delete("/{id_clase_puesto}", status_code=204)
def delete_clase(id_clase_puesto: int):
    result = get_supabase().table("clases_puesto").delete().eq("id_clase_puesto", id_clase_puesto).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Clase de puesto no encontrada")


# ─── Estratos ─────────────────────────────────────────────────────────────────
estratos_router = APIRouter(prefix="/estratos", tags=["Estratos"])


@estratos_router.get("/", response_model=List[EstratoResponse])
def get_estratos():
    result = get_supabase().table("estratos").select("*").execute()
    return result.data or []


@estratos_router.get("/{id_estrato}", response_model=EstratoResponse)
def get_estrato(id_estrato: int):
    result = get_supabase().table("estratos").select("*").eq("id_estrato", id_estrato).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Estrato no encontrado")
    return result.data


@estratos_router.post("/", response_model=EstratoResponse, status_code=201)
def create_estrato(body: EstratoCreate):
    result = get_supabase().table("estratos").insert(body.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Error al crear")
    return result.data[0]


@estratos_router.put("/{id_estrato}", response_model=EstratoResponse)
def update_estrato(id_estrato: int, body: EstratoUpdate):
    data = body.model_dump(exclude_unset=True, exclude_none=True)
    result = get_supabase().table("estratos").update(data).eq("id_estrato", id_estrato).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Estrato no encontrado")
    return result.data[0]


@estratos_router.delete("/{id_estrato}", status_code=204)
def delete_estrato(id_estrato: int):
    result = get_supabase().table("estratos").delete().eq("id_estrato", id_estrato).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Estrato no encontrado")