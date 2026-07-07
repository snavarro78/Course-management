import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCursos, getPersonas, getMatriculas, createMatricula, updateMatricula, deleteMatricula, cargaMasivaMatriculas, previsualizarCarga } from '../services/api'
import Sidebar from '../Components/Sidebar'
import '../styles/Home.css'
import '../styles/Modal.css'

export default function Matriculas() {
  const navigate = useNavigate()
  const [cursos, setCursos] = useState([])
  const [matriculas, setMatriculas] = useState([])
  const [loading, setLoading] = useState(true)
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null)
  const [modal, setModal] = useState(false)
  const [editingMatricula, setEditingMatricula] = useState(null)
  const [form, setForm] = useState({ id_persona: '', id_curso: '', estado: 'aprobado' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Búsqueda por cédula
  const [cedulaBusqueda, setCedulaBusqueda] = useState('')
  const [personaEncontrada, setPersonaEncontrada] = useState(null)
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)

  // Confirmar quitar aprobado
  const [quitarModal, setQuitarModal] = useState({ open: false, matricula: null })

  // Carga masiva
  const [cargaModal, setCargaModal] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [resultadoCarga, setResultadoCarga] = useState(null)
  const [archivoCarga, setArchivoCarga] = useState(null)
  const [previsualizacion, setPrevisualizacion] = useState(null)
  const [paso, setPaso] = useState(1) // 1=subir archivo, 2=confirmar

  const fetchAll = async () => {
    try {
      const [c, m] = await Promise.all([getCursos(), getMatriculas()])
      setCursos(c)
      setMatriculas(m)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  const rol = localStorage.getItem('rol') || 'usuario'
  const esAdmin = rol === 'admin'

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    fetchAll()
  }, [])

  // ── Datos del curso seleccionado ──────────────────────────────────────────
  // Matrículas del curso con datos de persona embebidos
  const matriculasCurso = cursoSeleccionado
    ? matriculas.filter(m => m.id_curso === cursoSeleccionado.id_curso)
    : []

  const aprobadosCurso = matriculasCurso.filter(m => m.estado === 'aprobado')

  // Obtener nombre de persona desde personas embebidas o fallback
  const getNombre = (m) => {
    if (m.personas) return `${m.personas.nombre} ${m.personas.apellidos}`
    return `ID ${m.id_persona}`
  }
  const getCedula = (m) => m.personas?.cedula || '—'
  const getEmail = (m) => m.personas?.email || '—'

  const filteredMatriculas = aprobadosCurso.filter(m => {
    const texto = `${getNombre(m)} ${getCedula(m)} ${getEmail(m)}`.toLowerCase()
    return texto.includes(search.toLowerCase())
  })

  // ── Buscar por cédula ─────────────────────────────────────────────────────
  const buscarPorCedula = async () => {
    if (!cedulaBusqueda.trim()) {
      setErrorBusqueda('Ingresa una cédula para buscar')
      return
    }
    setBuscando(true)
    setPersonaEncontrada(null)
    setErrorBusqueda('')
    try {
      const resultados = await getPersonas(0, 5, cedulaBusqueda.trim())
      const persona = resultados.find(p => p.cedula === cedulaBusqueda.trim())
      if (persona) {
        // Verificar si ya está matriculada en este curso
        const yaMatriculada = matriculasCurso.find(m => m.id_persona === persona.id_persona)
        if (yaMatriculada) {
          setErrorBusqueda(`⚠️ Esta persona ya está registrada en este curso como "${yaMatriculada.estado}"`)
        } else {
          setPersonaEncontrada(persona)
          setForm(f => ({ ...f, id_persona: persona.id_persona }))
        }
      } else {
        setErrorBusqueda('No se encontró ninguna persona con esa cédula')
      }
    } catch {
      setErrorBusqueda('Error al buscar la persona')
    } finally {
      setBuscando(false)
    }
  }

  // ── Modales ───────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingMatricula(null)
    setForm({ id_persona: '', id_curso: cursoSeleccionado?.id_curso || '', estado: 'aprobado' })
    setCedulaBusqueda('')
    setPersonaEncontrada(null)
    setErrorBusqueda('')
    setError('')
    setModal(true)
  }

  const openEdit = (m) => {
    setEditingMatricula(m)
    setForm({ id_persona: m.id_persona, id_curso: m.id_curso, estado: m.estado || 'aprobado' })
    setError('')
    setModal(true)
  }

  const handleSubmit = async () => {
    if (!editingMatricula && !personaEncontrada) {
      setError('Debes buscar y seleccionar una persona por cédula')
      return
    }
    if (!form.id_persona || !form.id_curso) {
      setError('Persona y curso son obligatorios')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingMatricula) {
        await updateMatricula(editingMatricula.id_matricula, { estado: form.estado })
      } else {
        await createMatricula({
          id_persona: parseInt(form.id_persona),
          id_curso: parseInt(form.id_curso),
          estado: form.estado,
        })
      }
      setModal(false)
      fetchAll()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleQuitar = async () => {
    if (!quitarModal.matricula) return
    try {
      await deleteMatricula(quitarModal.matricula.id_matricula)
      setQuitarModal({ open: false, matricula: null })
      fetchAll()
    } catch (e) {
      alert(e.message)
    }
  }

  // ── Descargar PDF ─────────────────────────────────────────────────────────
  const descargarPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()
    const fecha = new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })

    doc.setFillColor(0, 56, 118)
    doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(200, 149, 42)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('IDP — Instituto de Desarrollo Profesional', 14, 11)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Ministerio de Educación Pública', 14, 18)
    doc.text(`Generado: ${fecha}`, 14, 24)

    doc.setTextColor(0, 56, 118)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Reporte de Personas Aprobadas', 14, 40)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(`Curso: ${cursoSeleccionado.nombre_curso}`, 14, 48)
    doc.text(`Consecutivo: ${cursoSeleccionado.consecutivo}`, 14, 54)
    doc.text(`Período: ${cursoSeleccionado.fecha_inicio || 'Sin fecha'} — ${cursoSeleccionado.fecha_fin || 'Sin fecha'}`, 14, 60)
    doc.text(`Total aprobados: ${aprobadosCurso.length}`, 14, 66)

    doc.setDrawColor(200, 149, 42)
    doc.setLineWidth(0.5)
    doc.line(14, 70, 196, 70)

    const filas = aprobadosCurso.map((m, i) => [
      i + 1,
      getNombre(m),
      getCedula(m),
      getEmail(m),
      m.estado === 'aprobado' ? 'Aprobado' : 'Desaprobado',
    ])

    autoTable(doc, {
      startY: 74,
      head: [['#', 'Nombre completo', 'Cédula', 'Correo', 'Estado']],
      body: filas,
      headStyles: { fillColor: [0, 56, 118], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [232, 238, 248] },
      bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 4: { halign: 'center' } },
      margin: { left: 14, right: 14 },
    })

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Página ${i} de ${pageCount} — IDP Sistema de Capacitaciones`, 14, doc.internal.pageSize.height - 8)
    }

    doc.save(`aprobados_${cursoSeleccionado.consecutivo}_${new Date().toISOString().slice(0,10)}.pdf`)
  }

  const handlePrevisualizar = async () => {
    if (!archivoCarga) return
    setCargando(true)
    setPrevisualizacion(null)
    try {
      const prev = await previsualizarCarga(cursoSeleccionado.id_curso, archivoCarga)
      setPrevisualizacion(prev)
      setPaso(2)
    } catch (e) {
      setResultadoCarga({ error: e.message })
    } finally {
      setCargando(false)
    }
  }

  const handleCargaMasiva = async () => {
    if (!archivoCarga) return
    setCargando(true)
    setResultadoCarga(null)
    try {
      const resultado = await cargaMasivaMatriculas(cursoSeleccionado.id_curso, archivoCarga)
      setResultadoCarga(resultado)
      setPrevisualizacion(null)
      setArchivoCarga(null)
      setPaso(1)
      fetchAll()
    } catch (e) {
      setResultadoCarga({ error: e.message })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="home-wrapper">
      <Sidebar />
      <main className="home-main">
        <header className="home-header">
          <div>
            <h1>Matrículas</h1>
            <p>{cursoSeleccionado ? `Aprobados: ${cursoSeleccionado.nombre_curso}` : 'Selecciona un curso'}</p>
          </div>
          {cursoSeleccionado && (
            <div className="home-header-actions">
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Buscar persona..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {esAdmin && (
                <>
                  <button className="btn-primary" onClick={openNew}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Agregar aprobado
                  </button>
                  <button className="btn-primary" style={{ background: '#1a7a4a' }}
                    onClick={() => { setCargaModal(true); setResultadoCarga(null); setArchivoCarga(null) }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Carga masiva
                  </button>
                </>
              )}
              <button className="btn-pdf" onClick={descargarPDF} disabled={aprobadosCurso.length === 0}
                title={aprobadosCurso.length === 0 ? 'No hay aprobados para descargar' : 'Descargar PDF'}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/>
                </svg>
                Descargar PDF
              </button>
              <button className="btn-secondary" onClick={() => { setCursoSeleccionado(null); setSearch('') }}>
                ← Volver a cursos
              </button>
            </div>
          )}
        </header>

        <div className="home-content">
          {loading ? (
            <div className="home-loading"><div className="spinner" /><p>Cargando...</p></div>
          ) : !cursoSeleccionado ? (
            <>
              <div className="section-header">
                <h2>Selecciona un curso para ver sus aprobados</h2>
              </div>
              <div className="cursos-grid">
                {cursos.map(c => {
                  const aprobados = matriculas.filter(m => m.id_curso === c.id_curso && m.estado === 'aprobado').length
                  return (
                    <div key={c.id_curso} className="curso-card" onClick={() => { setCursoSeleccionado(c); setSearch('') }}>
                      <div className="curso-card-header">
                        <span className="badge badge-usuario">{c.consecutivo}</span>
                        <span className="curso-aprobados">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {aprobados} aprobado{aprobados !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <h3>{c.nombre_curso}</h3>
                      <p>{c.fecha_inicio || 'Sin fecha'} — {c.fecha_fin || 'Sin fecha'}</p>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Persona</th><th>Cédula</th><th>Correo</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatriculas.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign:'center', padding:'40px', color:'#6b7280'}}>
                      No hay personas aprobadas en este curso
                    </td></tr>
                  ) : filteredMatriculas.map(m => (
                    <tr key={m.id_matricula}>
                      <td>
                        <div className="avatar-cell">
                          <div className="avatar">
                            {m.personas?.nombre?.charAt(0)}{m.personas?.apellidos?.charAt(0)}
                          </div>
                          <strong>{getNombre(m)}</strong>
                        </div>
                      </td>
                      <td>{getCedula(m)}</td>
                      <td className="td-email">{getEmail(m)}</td>
                      <td><span className="badge badge-green">{m.estado}</span></td>
                      <td>
                        {esAdmin && (
                          <div className="action-btns">
                            <button className="btn-icon btn-edit" onClick={() => openEdit(m)} title="Editar estado">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button className="btn-icon btn-delete" onClick={() => setQuitarModal({ open: true, matricula: m })} title="Quitar aprobado">
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Modal Agregar/Editar ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMatricula ? 'Editar matrícula' : 'Agregar persona aprobada'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-body">
              {!editingMatricula && (
                <>
                  <div className="field-group">
                    <label>Buscar por cédula *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" value={cedulaBusqueda}
                        onChange={e => { setCedulaBusqueda(e.target.value); setPersonaEncontrada(null); setErrorBusqueda('') }}
                        placeholder="Ej: 305250652"
                        onKeyDown={e => e.key === 'Enter' && buscarPorCedula()}
                        style={{ flex: 1 }} />
                      <button className="btn-primary" onClick={buscarPorCedula} disabled={buscando} style={{ whiteSpace: 'nowrap' }}>
                        {buscando ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                    {errorBusqueda && (
                      <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '4px' }}>{errorBusqueda}</p>
                    )}
                  </div>
                  {personaEncontrada && (
                    <div style={{
                      background: 'var(--idp-azul-claro)', border: '1px solid var(--border)',
                      borderRadius: '10px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                      <div className="avatar" style={{ flexShrink: 0 }}>
                        {personaEncontrada.nombre?.charAt(0)}{personaEncontrada.apellidos?.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--idp-azul)', display: 'block' }}>
                          {personaEncontrada.nombre} {personaEncontrada.apellidos}
                        </strong>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Cédula: {personaEncontrada.cedula} · {personaEncontrada.email || 'Sin correo'}
                        </span>
                      </div>
                      <span className={`badge badge-${personaEncontrada.rol}`} style={{ marginLeft: 'auto' }}>
                        {personaEncontrada.rol}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="field-group">
                <label>Estado</label>
                <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                  <option value="aprobado">Aprobado</option>
                  <option value="desaprobado">Desaprobado</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Guardando...' : editingMatricula ? 'Guardar cambios' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Carga Masiva ── */}
      {cargaModal && (
        <div className="modal-overlay" onClick={() => { setCargaModal(false); setPaso(1); setPrevisualizacion(null); setResultadoCarga(null) }}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📂 Carga masiva — {paso === 1 ? 'Paso 1: Seleccionar archivo' : 'Paso 2: Confirmar carga'}</h2>
              <button className="modal-close" onClick={() => { setCargaModal(false); setPaso(1); setPrevisualizacion(null); setResultadoCarga(null) }}>✕</button>
            </div>

            <div className="modal-body">
              {/* ── PASO 1: Subir archivo ── */}
              {paso === 1 && !resultadoCarga && (
                <>
                  <div style={{ background: 'var(--idp-azul-claro)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: 'var(--idp-azul)' }}>
                    <strong>Columnas reconocidas:</strong><br/>
                    <code>Número de ID</code> · <code>Nombre</code> · <code>Apellido(s)</code> · <code>Dirección Email</code> · <code>Ciudad</code> · <code>Sexo</code> · <code>Estrato</code> · <code>Clase_Puesto</code>
                  </div>
                  <div className="field-group">
                    <label>Seleccionar archivo (CSV)</label>
                    <input type="file" accept=".csv,.xlsx,.xls"
                      onChange={e => { setArchivoCarga(e.target.files[0]); setResultadoCarga(null) }}
                      style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', width: '100%' }} />
                  </div>
                  {archivoCarga && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      📄 {archivoCarga.name} ({(archivoCarga.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                  {resultadoCarga?.error && <div className="modal-error">{resultadoCarga.error}</div>}
                </>
              )}

              {/* ── PASO 2: Previsualización ── */}
              {paso === 2 && previsualizacion && !resultadoCarga && (
                <>
                  <div style={{ background: 'var(--idp-azul-claro)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: 'var(--idp-azul)', marginBottom: '4px' }}>
                    <strong>Curso:</strong> {previsualizacion.curso}<br/>
                    <strong>Total en archivo:</strong> {previsualizacion.total_en_archivo} personas
                  </div>

                  {/* Nuevas */}
                  <div style={{ background: '#ecfdf5', border: '1px solid #b7deca', borderRadius: '8px', padding: '12px 16px', fontSize: '13px' }}>
                    <strong style={{ color: '#1a7a4a' }}>✅ {previsualizacion.total_nuevas} personas se agregarán al curso</strong>
                    {previsualizacion.nuevas.filter(p => p.es_nueva_persona).length > 0 && (
                      <p style={{ marginTop: '4px', color: '#1a7a4a' }}>
                        ({previsualizacion.nuevas.filter(p => p.es_nueva_persona).length} de ellas serán creadas como nuevas personas en el sistema)
                      </p>
                    )}
                  </div>

                  {/* Ya aprobadas */}
                  {previsualizacion.total_ya_aprobadas > 0 && (
                    <div style={{ background: '#fdf3dc', border: '1px solid rgba(200,149,42,0.3)', borderRadius: '8px', padding: '12px 16px', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--idp-dorado)' }}>⚠️ {previsualizacion.total_ya_aprobadas} personas ya están aprobadas en este curso y NO se procesarán:</strong>
                      <ul style={{ margin: '8px 0 0 16px', fontSize: '12px', color: '#7a5a10' }}>
                        {previsualizacion.ya_aprobadas.slice(0, 8).map((p, i) => (
                          <li key={i}>{p.nombre} — {p.cedula}</li>
                        ))}
                        {previsualizacion.ya_aprobadas.length > 8 && (
                          <li>...y {previsualizacion.ya_aprobadas.length - 8} más</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Cédulas inválidas */}
                  {previsualizacion.total_invalidas > 0 && (
                    <div style={{ background: '#fdf0ef', border: '1px solid #f5c6c3', borderRadius: '8px', padding: '12px 16px', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--danger)' }}>❌ {previsualizacion.total_invalidas} filas con cédula inválida o vacía se omitirán</strong>
                    </div>
                  )}
                </>
              )}

              {/* ── Resultado final ── */}
              {resultadoCarga && !resultadoCarga.error && (
                <div style={{ background: '#ecfdf5', border: '1px solid #b7deca', borderRadius: '8px', padding: '14px 16px', fontSize: '13px' }}>
                  <strong style={{ color: '#1a7a4a', display: 'block', marginBottom: '8px' }}>✅ Carga completada exitosamente</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <span>📋 Procesados: <strong>{resultadoCarga.procesados}</strong></span>
                    <span>🆕 Personas creadas: <strong>{resultadoCarga.creados}</strong></span>
                    <span>✅ Matriculados: <strong>{resultadoCarga.matriculados}</strong></span>
                    <span>🔄 Actualizados: <strong>{resultadoCarga.actualizados}</strong></span>
                  </div>
                  {resultadoCarga.errores?.length > 0 && (
                    <div style={{ marginTop: '10px', background: '#fdf0ef', borderRadius: '6px', padding: '8px 12px' }}>
                      <strong style={{ color: 'var(--danger)' }}>⚠️ {resultadoCarga.errores.length} errores:</strong>
                      <ul style={{ margin: '6px 0 0 16px', fontSize: '12px', color: 'var(--danger)' }}>
                        {resultadoCarga.errores.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                        {resultadoCarga.errores.length > 5 && <li>...y {resultadoCarga.errores.length - 5} más</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {resultadoCarga?.error && <div className="modal-error">{resultadoCarga.error}</div>}
            </div>

            <div className="modal-footer">
              {paso === 1 && !resultadoCarga && (
                <>
                  <button className="btn-secondary" onClick={() => { setCargaModal(false); setPaso(1); setPrevisualizacion(null) }}>Cancelar</button>
                  <button className="btn-primary" style={{ background: 'var(--idp-azul)' }}
                    onClick={handlePrevisualizar} disabled={!archivoCarga || cargando}>
                    {cargando ? 'Analizando...' : 'Revisar archivo →'}
                  </button>
                </>
              )}
              {paso === 2 && previsualizacion && !resultadoCarga && (
                <>
                  <button className="btn-secondary" onClick={() => { setPaso(1); setPrevisualizacion(null) }}>
                    ← Volver
                  </button>
                  <button className="btn-primary" style={{ background: '#1a7a4a' }}
                    onClick={handleCargaMasiva} disabled={cargando || previsualizacion.total_nuevas === 0}>
                    {cargando ? 'Guardando...' : `Confirmar y guardar ${previsualizacion.total_nuevas} personas`}
                  </button>
                </>
              )}
              {resultadoCarga && (
                <button className="btn-secondary" onClick={() => { setCargaModal(false); setPaso(1); setPrevisualizacion(null); setResultadoCarga(null) }}>
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Quitar Aprobado ── */}
      {quitarModal.open && (
        <div className="modal-overlay" onClick={() => setQuitarModal({ open: false, matricula: null })}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header" style={{ borderBottomColor: '#fad7d4' }}>
              <h2 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span> Quitar aprobado
              </h2>
              <button className="modal-close" onClick={() => setQuitarModal({ open: false, matricula: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '15px', marginBottom: '12px', fontWeight: 500 }}>
                ¿Estás seguro de quitar a esta persona del curso?
              </p>
              {quitarModal.matricula && (
                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                  <strong style={{ color: 'var(--idp-azul)' }}>{getNombre(quitarModal.matricula)}</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Cédula: {getCedula(quitarModal.matricula)}
                  </div>
                </div>
              )}
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                Esta acción eliminará la matrícula permanentemente.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button className="btn-secondary" style={{ minWidth: '100px' }}
                onClick={() => setQuitarModal({ open: false, matricula: null })}>Cancelar</button>
              <button className="btn-primary" onClick={handleQuitar}
                style={{ background: 'var(--danger)', minWidth: '100px', border: 'none' }}
                onMouseOver={e => e.currentTarget.style.background = '#a8322a'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--danger)'}>
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}