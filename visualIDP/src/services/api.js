const BASE_URL = 'http://127.0.0.1:8000/api/v1'

// ─── Helper: extrae mensaje legible de errores Pydantic ─────────────────────
function parseError(data, fallback) {
  if (!data.detail) return fallback
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail.map(e => e.msg || JSON.stringify(e)).join(' | ')
  }
  return fallback
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al iniciar sesión'))
  return data
}

// ─── Personas ─────────────────────────────────────────────────────────────────
export async function getPersonas(skip = 0, limit = 100, q = '') {
  const params = new URLSearchParams({ skip, limit })
  if (q) params.append('q', q)
  const res = await fetch(`${BASE_URL}/personas/?${params}`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al obtener personas'))
  return data
}

export async function getPersonaById(id) {
  const res = await fetch(`${BASE_URL}/personas/${id}`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Persona no encontrada'))
  return data
}

// ─── Cursos ───────────────────────────────────────────────────────────────────
export async function getCursos(skip = 0, limit = 100) {
  const res = await fetch(`${BASE_URL}/cursos/?skip=${skip}&limit=${limit}`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al obtener cursos'))
  return data
}

export async function getCursoById(id) {
  const res = await fetch(`${BASE_URL}/cursos/${id}`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Curso no encontrado'))
  return data
}

export async function createCurso(body) {
  const res = await fetch(`${BASE_URL}/cursos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al crear curso'))
  return data
}

export async function updateCurso(id, body) {
  const res = await fetch(`${BASE_URL}/cursos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al actualizar curso'))
  return data
}

export async function deleteCurso(id) {
  const res = await fetch(`${BASE_URL}/cursos/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(parseError(data, 'Error al eliminar curso'))
  }
  return true
}

// ─── Matrículas ───────────────────────────────────────────────────────────────
export async function getMatriculas(skip = 0, limit = 100) {
  const res = await fetch(`${BASE_URL}/matriculas/?skip=${skip}&limit=${limit}`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al obtener matrículas'))
  return data
}

export async function getMatriculasByCurso(matriculas, idCurso) {
  // Filtra del lado del cliente por id_curso
  return matriculas.filter(m => m.id_curso === idCurso)
}

export async function createMatricula(body) {
  const res = await fetch(`${BASE_URL}/matriculas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al crear matrícula'))
  return data
}

export async function updateMatricula(id, body) {
  const res = await fetch(`${BASE_URL}/matriculas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al actualizar matrícula'))
  return data
}

export async function deleteMatricula(id) {
  const res = await fetch(`${BASE_URL}/matriculas/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(parseError(data, 'Error al eliminar matrícula'))
  }
  return true
}

// ─── Personas (crear/editar) ───────────────────────────────────────────────────
export async function createPersona(body) {
  const res = await fetch(`${BASE_URL}/personas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al crear persona'))
  return data
}

export async function updatePersona(id, body) {
  const res = await fetch(`${BASE_URL}/personas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al actualizar persona'))
  return data
}

export async function deletePersona(id) {
  const res = await fetch(`${BASE_URL}/personas/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(parseError(data, 'Error al eliminar persona'))
  }
  return true
}

// ─── Curso Mediadores ─────────────────────────────────────────────────────────
export async function getCursoMediadores() {
  const res = await fetch(`${BASE_URL}/curso-mediadores/`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al obtener mediadores'))
  return data
}

export async function getMediadoresPorCurso(idCurso) {
  const res = await fetch(`${BASE_URL}/curso-mediadores/curso/${idCurso}`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al obtener mediadores del curso'))
  return data
}

export async function asignarMediador(body) {
  const res = await fetch(`${BASE_URL}/curso-mediadores/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al asignar mediador'))
  return data
}

export async function removerMediador(id) {
  const res = await fetch(`${BASE_URL}/curso-mediadores/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(parseError(data, 'Error al remover mediador'))
  }
  return true
}

// ─── Catálogos ────────────────────────────────────────────────────────────────
export async function getEstratos() {
  const res = await fetch(`${BASE_URL}/estratos/`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al obtener estratos'))
  return data
}

export async function getClasesPuesto() {
  const res = await fetch(`${BASE_URL}/clases-puesto/`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al obtener clases de puesto'))
  return data
}

// ─── Carga masiva ─────────────────────────────────────────────────────────────
export async function previsualizarCarga(idCurso, archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const res = await fetch(`${BASE_URL}/carga-masiva/previsualizar/${idCurso}`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al previsualizar'))
  return data
}

export async function cargaMasivaMatriculas(idCurso, archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const res = await fetch(`${BASE_URL}/carga-masiva/matriculas/${idCurso}`, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error en carga masiva'))
  return data
}

// ─── Reporte por persona ──────────────────────────────────────────────────────
export async function getMatriculasByPersona(idPersona) {
  const res = await fetch(`${BASE_URL}/matriculas/persona/${idPersona}`)
  const data = await res.json()
  if (!res.ok) throw new Error(parseError(data, 'Error al obtener matrículas de persona'))
  return data
}