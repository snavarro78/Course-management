import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPersonas, createPersona, updatePersona, deletePersona, getEstratos, getClasesPuesto } from '../services/api'
import Sidebar from '../Components/Sidebar'
import '../styles/Home.css'
import '../styles/Modal.css'

const EMPTY_FORM = {
  cedula: '', nombre: '', apellidos: '', email: '',
  contra: '', rol: 'usuario', sexo: '', direccion_regional_oficina: '',
  id_estrato: '', id_clase_puesto: ''
}

export default function Personas() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState({ open: false, persona: null })
  const [estratos, setEstratos] = useState([])
  const [clasesPuesto, setClasesPuesto] = useState([])

  const debounceRef = useRef(null)

  const fetchPersonas = async (searchTerm = '') => {
    setLoading(true)
    try {
      const [data, est, cls] = await Promise.all([
        getPersonas(0, 100, searchTerm),
        getEstratos(),
        getClasesPuesto()
      ])
      setPersonas(data)
      setEstratos(est)
      setClasesPuesto(cls)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    const rol = localStorage.getItem('rol')
    if (rol !== 'admin') { navigate('/reportes'); return }
    fetchPersonas()
  }, [])

  // Búsqueda con debounce de 400ms
  const handleSearch = (value) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPersonas(value)
    }, 400)
  }

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      cedula: p.cedula || '',
      nombre: p.nombre || '',
      apellidos: p.apellidos || '',
      email: p.email || '',
      contra: '',
      rol: p.rol || 'usuario',
      sexo: p.sexo || '',
      direccion_regional_oficina: p.direccion_regional_oficina || '',
      id_estrato: p.id_estrato || '',
      id_clase_puesto: p.id_clase_puesto || '',
    })
    setError('')
    setModal(true)
  }

  const handleSubmit = async () => {
    if (!form.cedula || !form.nombre || !form.apellidos || !form.email) {
      setError('Cédula, nombre, apellidos y correo son obligatorios')
      return
    }
    if (!editing && !form.contra) {
      setError('La contraseña es obligatoria para nuevas personas')
      return
    }
    if (form.contra) {
      if (form.contra.length < 12) {
        setError('⚠️ La contraseña debe tener al menos 12 caracteres')
        return
      }
      if (!/[A-Z]/.test(form.contra)) {
        setError('⚠️ La contraseña debe incluir al menos una letra mayúscula')
        return
      }
      if (!/[0-9]/.test(form.contra)) {
        setError('⚠️ La contraseña debe incluir al menos un número')
        return
      }
      if (!/[!@#$%^&*()_+={}|;:,.<>?-]/.test(form.contra)) {
        setError('⚠️ La contraseña debe incluir al menos un carácter especial (!@#$%...)')
        return
      }
    }
    if (!form.email.endsWith('@mep.go.cr')) {
      setError('⚠️ El correo debe pertenecer al dominio @mep.go.cr')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        cedula: form.cedula,
        nombre: form.nombre,
        apellidos: form.apellidos,
        email: form.email,
        rol: form.rol,
        sexo: form.sexo || null,
        direccion_regional_oficina: form.direccion_regional_oficina || null,
        id_estrato: form.id_estrato ? parseInt(form.id_estrato) : null,
        id_clase_puesto: form.id_clase_puesto ? parseInt(form.id_clase_puesto) : null,
      }
      if (!editing) {
        body.contra = form.contra
      } else if (form.contra) {
        body.contra = form.contra
      }
      if (editing) {
        await updatePersona(editing.id_persona, body)
      } else {
        await createPersona(body)
      }
      setModal(false)
      fetchPersonas()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.persona) return
    try {
      await deletePersona(deleteModal.persona.id_persona)
      setDeleteModal({ open: false, persona: null })
      fetchPersonas()
    } catch (e) {
      alert(e.message)
    }
  }

  const filtered = personas

  return (
    <div className="home-wrapper">
      <Sidebar />
      <main className="home-main">
        <header className="home-header">
          <div>
            <h1>Personas</h1>
            <p>{personas.length} persona{personas.length !== 1 ? 's' : ''} registrada{personas.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="home-header-actions">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Buscar por nombre, apellidos o cédula..." value={search} onChange={e => handleSearch(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={openNew}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nueva persona
            </button>
          </div>
        </header>

        <div className="home-content">
          {loading ? (
            <div className="home-loading"><div className="spinner" /><p>Cargando...</p></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Nombre</th><th>Cédula</th><th>Correo</th>
                    <th>Rol</th><th>Sexo</th><th>Dirección Regional</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id_persona}>
                      <td className="td-id">#{p.id_persona}</td>
                      <td>
                        <div className="avatar-cell">
                          <div className="avatar">{p.nombre?.charAt(0)}{p.apellidos?.charAt(0)}</div>
                          <strong>{p.nombre} {p.apellidos}</strong>
                        </div>
                      </td>
                      <td>{p.cedula}</td>
                      <td className="td-email">{p.email || '—'}</td>
                      <td><span className={`badge badge-${p.rol}`}>{p.rol}</span></td>
                      <td>{p.sexo || '—'}</td>
                      <td>{p.direccion_regional_oficina || '—'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon btn-edit" onClick={() => openEdit(p)} title="Editar">✏️</button>
                          <button className="btn-icon btn-delete" onClick={() => setDeleteModal({ open: true, persona: p })} title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Modal Crear/Editar ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar persona' : 'Nueva persona'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-body">
              <div className="field-row">
                <div className="field-group">
                  <label>Nombre *</label>
                  <input type="text" value={form.nombre}
                    onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Nombre" />
                </div>
                <div className="field-group">
                  <label>Apellidos *</label>
                  <input type="text" value={form.apellidos}
                    onChange={e => setForm({...form, apellidos: e.target.value})} placeholder="Apellidos" />
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Cédula *</label>
                  <input type="text" value={form.cedula}
                    onChange={e => setForm({...form, cedula: e.target.value})} placeholder="00000000" />
                </div>
                <div className="field-group">
                  <label>Sexo</label>
                  <select value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value})}>
                    <option value="">Sin especificar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label>Correo electrónico *</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} placeholder="correo@mep.go.cr" />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Rol</label>
                  <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})}>
                    <option value="usuario">Usuario</option>
                    <option value="mediador">Mediador</option>
                    <option value="sub_admin">Sub-Admin</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>{editing ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
                  <input type="password" value={form.contra}
                    onChange={e => setForm({...form, contra: e.target.value})}
                    placeholder={editing ? 'Dejar vacío para no cambiar' : 'Mín. 12 car., mayúscula, número y símbolo'} />
                </div>
              </div>
              <div className="field-group">
                <label>Dirección Regional / Oficina</label>
                <input type="text" value={form.direccion_regional_oficina}
                  onChange={e => setForm({...form, direccion_regional_oficina: e.target.value})}
                  placeholder="Ej: Dirección Regional San José" />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Estrato</label>
                  <select value={form.id_estrato} onChange={e => setForm({...form, id_estrato: e.target.value})}>
                    <option value="">Sin estrato</option>
                    {estratos.map(e => (
                      <option key={e.id_estrato} value={e.id_estrato}>{e.nombre_estrato}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label>Clase de puesto</label>
                  <select value={form.id_clase_puesto} onChange={e => setForm({...form, id_clase_puesto: e.target.value})}>
                    <option value="">Sin clase de puesto</option>
                    {clasesPuesto.map(c => (
                      <option key={c.id_clase_puesto} value={c.id_clase_puesto}>{c.nombre_clase}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear persona'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Eliminar ── */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, persona: null })}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header" style={{ borderBottomColor: '#fad7d4' }}>
              <h2 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>⚠️</span> Confirmar eliminación
              </h2>
              <button className="modal-close" onClick={() => setDeleteModal({ open: false, persona: null })}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '15px', marginBottom: '12px', fontWeight: 500 }}>
                ¿Estás seguro de eliminar esta persona?
              </p>
              {deleteModal.persona && (
                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                  <strong style={{ color: 'var(--idp-azul)' }}>
                    {deleteModal.persona.nombre} {deleteModal.persona.apellidos}
                  </strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Cédula: {deleteModal.persona.cedula}
                  </div>
                </div>
              )}
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button className="btn-secondary" style={{ minWidth: '100px' }}
                onClick={() => setDeleteModal({ open: false, persona: null })}>Cancelar</button>
              <button className="btn-primary" onClick={handleDelete}
                style={{ background: 'var(--danger)', minWidth: '100px', border: 'none' }}
                onMouseOver={e => e.currentTarget.style.background = '#a8322a'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--danger)'}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}