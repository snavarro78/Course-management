from fastapi import APIRouter, HTTPException, UploadFile, File
import csv
import io

from models.database import get_supabase
from middleware.security import hash_password

router = APIRouter(prefix="/carga-masiva", tags=["Carga Masiva"])


def limpiar(v):
    """Limpia espacios y retorna None si está vacío."""
    if v is None:
        return None
    v = str(v).strip()
    return v if v else None


def normalizar_col(k):
    """Normaliza nombres de columna a minúsculas sin tildes ni espacios."""
    k = k.lower().strip()
    for a, b in [("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u"),(" ","_"),("(",""),(")","")]:
        k = k.replace(a, b)
    return k


# Mapeo flexible de nombres de columna del Excel al campo interno
MAPEO_COLUMNAS = {
    # cédula
    "cedula": "cedula",
    "numero_de_id": "cedula",
    "numero_id": "cedula",
    "id": "cedula",
    "n_id": "cedula",
    # nombre
    "nombre": "nombre",
    # apellidos
    "apellido(s)": "apellidos",
    "apellidos": "apellidos",
    "apellido": "apellidos",
    # email
    "direccion_email": "email",
    "email": "email",
    "correo": "email",
    "correo_electronico": "email",
    # dirección regional
    "ciudad": "direccion_regional",
    "direccion_regional": "direccion_regional",
    "direccion": "direccion_regional",
    "region": "direccion_regional",
    # sexo
    "sexo": "sexo",
    "genero": "sexo",
    # estrato
    "estrato": "estrato",
    # clase de puesto
    "clase_puesto": "clase_puesto",
    "clase_de_puesto": "clase_puesto",
    "clase": "clase_puesto",
    # estado
    "estado": "estado",
}


def mapear_fila(fila_raw: dict) -> dict:
    """Convierte las columnas del Excel al formato interno."""
    resultado = {}
    for k, v in fila_raw.items():
        norm = normalizar_col(k)
        campo = MAPEO_COLUMNAS.get(norm)
        if campo:
            resultado[campo] = limpiar(v)
    return resultado


async def leer_csv(archivo: UploadFile) -> list:
    """Lee y decodifica el archivo CSV, retorna lista de filas mapeadas."""
    contenido = await archivo.read()
    for enc in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
        try:
            texto = contenido.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(status_code=400, detail="No se pudo leer el archivo. Guárdalo como CSV UTF-8.")
    reader = csv.DictReader(io.StringIO(texto))
    return [mapear_fila(fila) for fila in reader]


@router.post("/previsualizar/{id_curso}")
async def previsualizar_carga(
    id_curso: int,
    archivo: UploadFile = File(...),
):
    """
    Lee el archivo sin guardar nada.
    Retorna cuáles personas ya están aprobadas en el curso y cuáles son nuevas.
    """
    client = get_supabase()

    # Verificar curso
    curso_res = client.table("cursos").select("id_curso, nombre_curso, consecutivo").eq("id_curso", id_curso).execute()
    if not curso_res.data:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    curso = curso_res.data[0]

    filas = await leer_csv(archivo)

    # Matrículas aprobadas del curso
    mat_res = (
        client.table("matriculas")
        .select("id_persona")
        .eq("id_curso", id_curso)
        .eq("estado", "aprobado")
        .execute()
    )
    ids_aprobados = {m["id_persona"] for m in (mat_res.data or [])}

    ya_aprobadas = []
    nuevas = []
    cedulas_invalidas = []

    for fila in filas:
        cedula_raw = fila.get("cedula") or ""
        cedula = "".join(filter(str.isdigit, cedula_raw))
        nombre = fila.get("nombre") or ""
        apellidos = fila.get("apellidos") or ""

        if not cedula:
            cedulas_invalidas.append(cedula_raw or "(vacía)")
            continue

        # Buscar persona en BD por cédula
        per = client.table("personas").select("id_persona, nombre, apellidos, cedula").eq("cedula", cedula).execute()

        if per.data:
            persona = per.data[0]
            id_persona = persona["id_persona"]
            nombre_bd = f"{persona['nombre']} {persona['apellidos']}"
            if id_persona in ids_aprobados:
                ya_aprobadas.append({
                    "cedula": cedula,
                    "nombre": nombre_bd,
                })
            else:
                nuevas.append({
                    "cedula": cedula,
                    "nombre": nombre_bd,
                    "es_nueva_persona": False,
                })
        else:
            # Persona no existe aún — sería nueva
            nuevas.append({
                "cedula": cedula,
                "nombre": f"{nombre} {apellidos}".strip() or "Sin nombre",
                "es_nueva_persona": True,
            })

    return {
        "curso": f"{curso['consecutivo']} — {curso['nombre_curso']}",
        "total_en_archivo": len(filas),
        "ya_aprobadas": ya_aprobadas,
        "total_ya_aprobadas": len(ya_aprobadas),
        "nuevas": nuevas,
        "total_nuevas": len(nuevas),
        "cedulas_invalidas": cedulas_invalidas,
        "total_invalidas": len(cedulas_invalidas),
    }


@router.post("/matriculas/{id_curso}")
async def carga_masiva_matriculas(
    id_curso: int,
    archivo: UploadFile = File(...),
):
    """
    Recibe un CSV/Excel exportado como CSV con las columnas del sistema IDP.
    Columnas reconocidas: Nombre de cursos, Consecutivo, Número de ID, Dirección Email,
    Nombre, Apellido(s), Ciudad (→ dirección regional), Sexo, Estrato, Clase_Puesto
    - Si la persona existe por cédula → actualiza sus datos y la matricula
    - Si no existe → la crea con rol usuario y contraseña temporal
    - Si ya está matriculada → actualiza el estado
    """
    client = get_supabase()

    # Verificar curso
    curso = client.table("cursos").select("id_curso").eq("id_curso", id_curso).execute()
    if not curso.data:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    # Leer archivo
    contenido = await archivo.read()
    for enc in ("utf-8-sig", "utf-8", "latin-1", "cp1252"):
        try:
            texto = contenido.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(status_code=400, detail="No se pudo leer el archivo. Guárdalo como CSV UTF-8.")

    reader = csv.DictReader(io.StringIO(texto))

    resultados = {
        "procesados": 0,
        "creados": 0,
        "matriculados": 0,
        "actualizados": 0,
        "errores": [],
    }

    # Catálogos precargados (nombre → id)
    estratos_db = {
        e["nombre_estrato"].lower().strip(): e["id_estrato"]
        for e in (client.table("estratos").select("*").execute().data or [])
    }
    clases_db = {
        c["nombre_clase"].lower().strip(): c["id_clase_puesto"]
        for c in (client.table("clases_puesto").select("*").execute().data or [])
    }

    for i, fila_raw in enumerate(reader, start=2):
        datos = mapear_fila(fila_raw)

        # Cédula obligatoria
        cedula_raw = datos.get("cedula") or ""
        cedula = "".join(filter(str.isdigit, cedula_raw))
        if not cedula:
            resultados["errores"].append(f"Fila {i}: cédula vacía o inválida (valor: {repr(cedula_raw)})")
            continue

        # Estado
        estado_raw = (datos.get("estado") or "aprobado").lower().strip()
        estado = estado_raw if estado_raw in ("aprobado", "desaprobado") else "aprobado"

        # Datos de persona
        nombre = datos.get("nombre") or "Sin nombre"
        apellidos = datos.get("apellidos") or "—"
        email = datos.get("email") or None
        sexo = datos.get("sexo") or None
        direccion = datos.get("direccion_regional") or None

        estrato_raw = (datos.get("estrato") or "").lower().strip()
        clase_raw = (datos.get("clase_puesto") or "").lower().strip()
        id_estrato = estratos_db.get(estrato_raw) if estrato_raw else None
        id_clase = clases_db.get(clase_raw) if clase_raw else None

        try:
            resultados["procesados"] += 1

            # Buscar persona por cédula
            per = client.table("personas").select("id_persona").eq("cedula", cedula).execute()

            if per.data:
                id_persona = per.data[0]["id_persona"]
                # Actualizar datos opcionales
                upd = {}
                if nombre and nombre != "Sin nombre": upd["nombre"] = nombre
                if apellidos and apellidos != "—": upd["apellidos"] = apellidos
                if email: upd["email"] = email
                if sexo: upd["sexo"] = sexo
                if direccion: upd["direccion_regional_oficina"] = direccion
                if id_estrato: upd["id_estrato"] = id_estrato
                if id_clase: upd["id_clase_puesto"] = id_clase
                if upd:
                    client.table("personas").update(upd).eq("id_persona", id_persona).execute()
            else:
                # Crear persona nueva
                nueva = {
                    "cedula": cedula,
                    "nombre": nombre,
                    "apellidos": apellidos,
                    "email": email,
                    "contra": hash_password(f"Idp@{cedula[:4]}"),
                    "rol": "usuario",
                    "sexo": sexo,
                    "direccion_regional_oficina": direccion,
                    "id_estrato": id_estrato,
                    "id_clase_puesto": id_clase,
                }
                res = client.table("personas").insert(nueva).execute()
                if not res.data:
                    resultados["errores"].append(f"Fila {i}: error al crear persona cédula {cedula}")
                    continue
                id_persona = res.data[0]["id_persona"]
                resultados["creados"] += 1

            # Matrícula
            mat = (
                client.table("matriculas")
                .select("id_matricula")
                .eq("id_persona", id_persona)
                .eq("id_curso", id_curso)
                .execute()
            )
            if mat.data:
                client.table("matriculas").update({"estado": estado}).eq("id_matricula", mat.data[0]["id_matricula"]).execute()
                resultados["actualizados"] += 1
            else:
                client.table("matriculas").insert({
                    "id_persona": id_persona,
                    "id_curso": id_curso,
                    "estado": estado
                }).execute()
                resultados["matriculados"] += 1

        except Exception as e:
            resultados["errores"].append(f"Fila {i} (cédula {cedula}): {str(e)}")

    return resultados