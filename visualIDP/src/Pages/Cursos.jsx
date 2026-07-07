import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCursos, createCurso, updateCurso, deleteCurso } from '../services/api'
import Sidebar from '../Components/Sidebar'
import '../styles/Home.css'
import '../styles/Modal.css'

const EMPTY_FORM = { consecutivo: '', nombre_curso: '', fecha_inicio: '', fecha_fin: '' }

export default function Cursos() {
  const navigate = useNavigate()
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, curso: null })
  const [editing, setEditing] = useState(null) // null = nuevo, object = editar
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchCursos = async () => {
    try {
      const data = await getCursos()
      setCursos(data)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    fetchCursos()
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal(true)
  }

  const openEdit = (curso) => {
    setEditing(curso)
    setForm({
      consecutivo: curso.consecutivo || '',
      nombre_curso: curso.nombre_curso || '',
      fecha_inicio: curso.fecha_inicio || '',
      fecha_fin: curso.fecha_fin || '',
    })
    setError('')
    setModal(true)
  }

  const openDeleteModal = (curso) => {
    setDeleteModal({ open: true, curso })
  }

  const handleDelete = async () => {
    if (!deleteModal.curso) return
    
    try {
      await deleteCurso(deleteModal.curso.id_curso)
      setDeleteModal({ open: false, curso: null })
      fetchCursos()
    } catch (e) {
      alert(e.message)
    }
  }

  const handleSubmit = async () => {
    if (!form.consecutivo || !form.nombre_curso) {
      setError('Consecutivo y nombre son obligatorios')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        consecutivo: form.consecutivo,
        nombre_curso: form.nombre_curso,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
      }
      if (editing) {
        await updateCurso(editing.id_curso, body)
      } else {
        await createCurso(body)
      }
      setModal(false)
      fetchCursos()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = cursos.filter(c =>
    `${c.consecutivo} ${c.nombre_curso}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="home-wrapper">
      <Sidebar />
      <main className="home-main">
        <header className="home-header">
          <div>
            <h1>Cursos</h1>
            <p>{cursos.length} curso{cursos.length !== 1 ? 's' : ''} registrado{cursos.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="home-header-actions">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Buscar curso..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={openNew}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo curso
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
                    <th>ID</th><th>Consecutivo</th><th>Nombre del Curso</th>
                    <th>Fecha Inicio</th><th>Fecha Fin</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id_curso}>
                      <td className="td-id">#{c.id_curso}</td>
                      <td><span className="badge badge-usuario">{c.consecutivo}</span></td>
                      <td><strong>{c.nombre_curso}</strong></td>
                      <td>{c.fecha_inicio || '—'}</td>
                      <td>{c.fecha_fin || '—'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon btn-edit" onClick={() => openEdit(c)} title="Editar">
                            ✏️
                          </button>
                          <button className="btn-icon btn-delete" onClick={() => openDeleteModal(c)} title="Eliminar">
                            🗑️
                          </button>
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

      {/* ── Modal de Confirmación para Eliminar ── */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ open: false, curso: null })}>
          <div className="modal modal-warning" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header" style={{ borderBottomColor: '#fad7d4' }}>
              <h2 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span> Confirmar eliminación
              </h2>
              <button className="modal-close" onClick={() => setDeleteModal({ open: false, curso: null })}>✕</button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ 
                background: '#fdf0ef', 
                width: '64px', 
                height: '64px', 
                borderRadius: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <span style={{ fontSize: '32px' }}>🗑️</span>
              </div>
              
              <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 500 }}>
                ¿Estás seguro de eliminar este curso?
              </p>
              
              {deleteModal.curso && (
                <div style={{ 
                  background: 'var(--bg)', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <strong style={{ color: 'var(--idp-azul)' }}>{deleteModal.curso.nombre_curso}</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Consecutivo: {deleteModal.curso.consecutivo}
                  </div>
                </div>
              )}
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setDeleteModal({ open: false, curso: null })}
                style={{ minWidth: '100px' }}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={handleDelete}
                style={{ 
                  background: 'var(--danger)', 
                  minWidth: '100px',
                  border: 'none'
                }}
                onMouseOver={e => e.target.style.background = '#a8322a'}
                onMouseOut={e => e.target.style.background = 'var(--danger)'}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Crear/Editar ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar curso' : 'Nuevo curso'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <div className="modal-body">
              <div className="field-group">
                <label>Consecutivo *</label>
                <input type="text" value={form.consecutivo}
                  onChange={e => setForm({...form, consecutivo: e.target.value})}
                  placeholder="Ej: CUR-2024-001" />
              </div>
              <div className="field-group">
                <label>Nombre del curso *</label>
                <input type="text" value={form.nombre_curso}
                  onChange={e => setForm({...form, nombre_curso: e.target.value})}
                  placeholder="Nombre completo del curso" />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Fecha inicio</label>
                  <input type="date" value={form.fecha_inicio}
                    onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
                </div>
                <div className="field-group">
                  <label>Fecha fin</label>
                  <input type="date" value={form.fecha_fin}
                    onChange={e => setForm({...form, fecha_fin: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear curso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}