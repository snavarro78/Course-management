import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPersonas, getCursos, getCursoMediadores, asignarMediador, removerMediador, createPersona } from '../services/api'
import Sidebar from '../Components/Sidebar'
import '../styles/Home.css'
import '../styles/Modal.css'

const EMPTY_FORM_MEDIADOR = {
  cedula: '', nombre: '', apellidos: '', email: '', contra: '',
  sexo: '', direccion_regional_oficina: ''
}

export default function Mediadores() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState([])
  const [cursos, setCursos] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal crear mediador
  const [modalCrear, setModalCrear] = useState(false)
  const [formCrear, setFormCrear] = useState(EMPTY_FORM_MEDIADOR)
  const [savingCrear, setSavingCrear] = useState(false)
  const [errorCrear, setErrorCrear] = useState('')

  // Modal asignar mediador a curso
  const [modalAsignar, setModalAsignar] = useState(false)
  const [formAsignar, setFormAsignar] = useState({ id_persona: '', id_curso: '' })
  const [savingAsignar, setSavingAsignar] = useState(false)
  const [errorAsignar, setErrorAsignar] = useState('')

  // Vista detalle: ver cursos de un mediador
  const [mediadorSeleccionado, setMediadorSeleccionado] = useState(null)

  const fetchAll = async () => {
    try {
      const [p, c, a] = await Promise.all([getPersonas(), getCursos(), getCursoMediadores()])
      setPersonas(p)
      setCursos(c)
      setAsignaciones(a)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    fetchAll()
  }, [])

  const mediadores = personas.filter(p => p.rol === 'mediador')

  const filteredMediadores = mediadores.filter(m =>
    `${m.nombre} ${m.apellidos} ${m.cedula} ${m.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const getCursosDeMediador = (id) => {
    const ids = asignaciones.filter(a => a.id_persona === id).map(a => a.id_curso)
    return cursos.filter(c => ids.includes(c.id_curso))
  }

  const getAsignacionId = (idPersona, idCurso) => {
    const a = asignaciones.find(a => a.id_persona === idPersona && a.id_curso === idCurso)
    return a?.id_curso_mediador
  }

  // ── Crear mediador ──
  const handleCrear = async () => {
    if (!formCrear.cedula || !formCrear.nombre || !formCrear.apellidos || !formCrear.email || !formCrear.contra) {
      setErrorCrear('Cédula, nombre, apellidos, correo y contraseña son obligatorios')
      return
    }
    if (formCrear.contra.length < 12) {
      setErrorCrear('⚠️ La contraseña debe tener al menos 12 caracteres')
      return
    }
    if (!/[A-Z]/.test(formCrear.contra)) {
      setErrorCrear('⚠️ La contraseña debe incluir al menos una letra mayúscula')
      return
    }
    if (!/[0-9]/.test(formCrear.contra)) {
      setErrorCrear('⚠️ La contraseña debe incluir al menos un número')
      return
    }
    if (!/[!@#$%^&*()_+={}|;:,.<>?]/.test(formCrear.contra)) {
      setErrorCrear('⚠️ La contraseña debe incluir al menos un carácter especial (!@#$%...)')
      return
    }
    if (!formCrear.email.endsWith('@mep.go.cr')) {
      setErrorCrear('⚠️ El correo debe pertenecer al dominio @mep.go.cr')
      return
    }
    setSavingCrear(true)
    setErrorCrear('')
    try {
      await createPersona({
        cedula: formCrear.cedula,
        nombre: formCrear.nombre,
        apellidos: formCrear.apellidos,
        email: formCrear.email,
        contra: formCrear.contra,
        rol: 'mediador',
        sexo: formCrear.sexo || null,
        direccion_regional_oficina: formCrear.direccion_regional_oficina || null,
      })
      setModalCrear(false)
      setFormCrear(EMPTY_FORM_MEDIADOR)
      fetchAll()
    } catch (e) {
      setErrorCrear(e.message)
    } finally {
      setSavingCrear(false)
    }
  }

  // ── Asignar mediador ──
  const handleAsignar = async () => {
    if (!formAsignar.id_persona || !formAsignar.id_curso) {
      setErrorAsignar('Mediador y curso son obligatorios')
      return
    }
    setSavingAsignar(true)
    setErrorAsignar('')
    try {
      await asignarMediador({
        id_persona: parseInt(formAsignar.id_persona),
        id_curso: parseInt(formAsignar.id_curso),
      })
      setModalAsignar(false)
      setFormAsignar({ id_persona: '', id_curso: '' })
      fetchAll()
    } catch (e) {
      setErrorAsignar(e.message)
    } finally {
      setSavingAsignar(false)
    }
  }

  // ── Remover asignación ──
  const handleRemover = async (idPersona, idCurso) => {
    const asigId = getAsignacionId(idPersona, idCurso)
    if (!asigId) return
    if (!confirm('¿Remover este mediador del curso?')) return
    try {
      await removerMediador(asigId)
      fetchAll()
    } catch (e) {
      alert(e.message)
    }
  }

  const cursosDelMediador = mediadorSeleccionado ? getCursosDeMediador(mediadorSeleccionado.id_persona) : []

  return (
    <div className="home-wrapper">
      <Sidebar />
      <main className="home-main">
        <header className="home-header">
          <div>
            <h1>Mediadores</h1>
            <p>{mediadores.length} mediador{mediadores.length !== 1 ? 'es' : ''} registrado{mediadores.length !== 1 ? 's' : ''}</p>
          </div>
          {!mediadorSeleccionado ? (
            <div className="home-header-actions">
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Buscar mediador..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={() => { setModalAsignar(true); setErrorAsignar('') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Asignar a curso
              </button>
              <button className="btn-primary" style={{ background: 'var(--idp-dorado)' }}
                onClick={() => { setModalCrear(true); setErrorCrear('') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nuevo mediador
              </button>
            </div>
          ) : (
            <button className="btn-secondary" onClick={() => setMediadorSeleccionado(null)}>
              ← Volver a mediadores
            </button>
          )}
        </header>

        <div className="home-content">
          {loading ? (
            <div className="home-loading"><div className="spinner" /><p>Cargando...</p></div>
          ) : !mediadorSeleccionado ? (
            /* ── Lista de mediadores ── */
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th><th>Cédula</th><th>Correo</th>
                    <th>Cursos asignados</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMediadores.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No hay mediadores registrados
                    </td></tr>
                  ) : filteredMediadores.map(m => {
                    const cursosCount = asignaciones.filter(a => a.id_persona === m.id_persona).length
                    return (
                      <tr key={m.id_persona}>
                        <td>
                          <div className="avatar-cell">
                            <div className="avatar">{m.nombre?.charAt(0)}{m.apellidos?.charAt(0)}</div>
                            <strong>{m.nombre} {m.apellidos}</strong>
                          </div>
                        </td>
                        <td>{m.cedula}</td>
                        <td className="td-email">{m.email || '—'}</td>
                        <td>
                          <span className="badge badge-usuario">
                            {cursosCount} curso{cursosCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td>
                          <button className="btn-icon btn-edit" title="Ver cursos asignados"
                            onClick={() => setMediadorSeleccionado(m)}
                            style={{ fontSize: '18px', background: 'var(--idp-azul-claro)' }}>
                            👁️
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── Detalle: cursos del mediador ── */
            <>
              <div className="section-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ width: '44px', height: '44px', fontSize: '15px' }}>
                    {mediadorSeleccionado.nombre?.charAt(0)}{mediadorSeleccionado.apellidos?.charAt(0)}
                  </div>
                  <div>
                    <h2>{mediadorSeleccionado.nombre} {mediadorSeleccionado.apellidos}</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{mediadorSeleccionado.email}</p>
                  </div>
                </div>
                <button className="btn-primary" onClick={() => {
                  setFormAsignar({ id_persona: mediadorSeleccionado.id_persona, id_curso: '' })
                  setErrorAsignar('')
                  setModalAsignar(true)
                }}>
                  + Asignar a curso
                </button>
              </div>

              {cursosDelMediador.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '15px' }}>Este mediador no tiene cursos asignados</p>
                </div>
              ) : (
                <div className="cursos-grid">
                  {cursosDelMediador.map(c => (
                    <div key={c.id_curso} className="curso-card">
                      <div className="curso-card-header">
                        <span className="badge badge-usuario">{c.consecutivo}</span>
                        <button
                          style={{ background: '#fdf0ef', border: 'none', borderRadius: '6px',
                            padding: '4px 10px', fontSize: '12px', color: 'var(--danger)', cursor: 'pointer' }}
                          onClick={() => handleRemover(mediadorSeleccionado.id_persona, c.id_curso)}>
                          Remover
                        </button>
                      </div>
                      <h3>{c.nombre_curso}</h3>
                      <p>{c.fecha_inicio || 'Sin fecha'} — {c.fecha_fin || 'Sin fecha'}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Modal Crear Mediador ── */}
      {modalCrear && (
        <div className="modal-overlay" onClick={() => setModalCrear(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo mediador</h2>
              <button className="modal-close" onClick={() => setModalCrear(false)}>✕</button>
            </div>
            {errorCrear && <div className="modal-error">{errorCrear}</div>}
            <div className="modal-body">
              <div className="field-row">
                <div className="field-group">
                  <label>Nombre *</label>
                  <input type="text" value={formCrear.nombre}
                    onChange={e => setFormCrear({...formCrear, nombre: e.target.value})} placeholder="Nombre" />
                </div>
                <div className="field-group">
                  <label>Apellidos *</label>
                  <input type="text" value={formCrear.apellidos}
                    onChange={e => setFormCrear({...formCrear, apellidos: e.target.value})} placeholder="Apellidos" />
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Cédula *</label>
                  <input type="text" value={formCrear.cedula}
                    onChange={e => setFormCrear({...formCrear, cedula: e.target.value})} placeholder="00000000" />
                </div>
                <div className="field-group">
                  <label>Sexo</label>
                  <select value={formCrear.sexo} onChange={e => setFormCrear({...formCrear, sexo: e.target.value})}>
                    <option value="">Sin especificar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label>Correo electrónico *</label>
                <input type="email" value={formCrear.email}
                  onChange={e => setFormCrear({...formCrear, email: e.target.value})} placeholder="correo@mep.go.cr" />
              </div>
              <div className="field-group">
                <label>Contraseña *</label>
                <input type="password" value={formCrear.contra}
                  onChange={e => setFormCrear({...formCrear, contra: e.target.value})}
                  placeholder="Mín. 12 car., mayúscula, número y símbolo" />
              </div>
              <div className="field-group">
                <label>Dirección Regional / Oficina</label>
                <input type="text" value={formCrear.direccion_regional_oficina}
                  onChange={e => setFormCrear({...formCrear, direccion_regional_oficina: e.target.value})}
                  placeholder="Ej: Dirección Regional San José" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalCrear(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleCrear} disabled={savingCrear}>
                {savingCrear ? 'Guardando...' : 'Crear mediador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Asignar a Curso ── */}
      {modalAsignar && (
        <div className="modal-overlay" onClick={() => setModalAsignar(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Asignar mediador a curso</h2>
              <button className="modal-close" onClick={() => setModalAsignar(false)}>✕</button>
            </div>
            {errorAsignar && <div className="modal-error">{errorAsignar}</div>}
            <div className="modal-body">
              <div className="field-group">
                <label>Mediador *</label>
                <select value={formAsignar.id_persona}
                  onChange={e => setFormAsignar({...formAsignar, id_persona: e.target.value})}>
                  <option value="">Seleccionar mediador...</option>
                  {mediadores.map(m => (
                    <option key={m.id_persona} value={m.id_persona}>
                      {m.nombre} {m.apellidos} — {m.cedula}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Curso *</label>
                <select value={formAsignar.id_curso}
                  onChange={e => setFormAsignar({...formAsignar, id_curso: e.target.value})}>
                  <option value="">Seleccionar curso...</option>
                  {cursos.map(c => (
                    <option key={c.id_curso} value={c.id_curso}>
                      {c.consecutivo} — {c.nombre_curso}
                    </option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Cada curso puede tener máximo 4 mediadores.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModalAsignar(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAsignar} disabled={savingAsignar}>
                {savingAsignar ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}