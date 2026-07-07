import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPersonas, getCursos, getMatriculas } from '../services/api'
import Sidebar from '../Components/Sidebar'
import '../styles/Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ personas: 0, cursos: 0, aprobados: 0 })
  const [loading, setLoading] = useState(true)
  const [personas, setPersonas] = useState([])

  const fetchData = async () => {
    try {
      const [p, c, m] = await Promise.all([getPersonas(), getCursos(), getMatriculas()])
      setPersonas(p)
      setStats({
        personas: p.length,
        cursos: c.length,
        aprobados: m.filter(x => x.estado === 'aprobado').length,
        desaprobados: m.filter(x => x.estado === 'desaprobado').length,
      })
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
    if (rol === 'sub_admin') { navigate('/reportes'); return }
    fetchData()
  }, [])

  return (
    <div className="home-wrapper">
      <Sidebar />
      <main className="home-main">
        <header className="home-header">
          <div>
            <h1>Dashboard</h1>
            <p>Resumen general del sistema IDP</p>
          </div>
        </header>

        <div className="home-content">
          {loading ? (
            <div className="home-loading"><div className="spinner" /><p>Cargando...</p></div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="stats-grid">
                <div className="stat-card" onClick={() => navigate('/personas')}>
                  <div className="stat-icon stat-blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <p className="stat-label">Personas</p>
                    <h2 className="stat-value">{stats.personas}</h2>
                  </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/cursos')}>
                  <div className="stat-icon stat-purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="stat-label">Cursos</p>
                    <h2 className="stat-value">{stats.cursos}</h2>
                  </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/matriculas')}>
                  <div className="stat-icon stat-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <p className="stat-label">Aprobados</p>
                    <h2 className="stat-value">{stats.aprobados}</h2>
                  </div>
                </div>

                <div className="stat-card" onClick={() => navigate('/matriculas')}>
                  <div className="stat-icon stat-red">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                  <div>
                    <p className="stat-label">Desaprobados</p>
                    <h2 className="stat-value">{stats.desaprobados}</h2>
                  </div>
                </div>
              </div>

              {/* Tabla reciente de personas */}
              <div className="section-header">
                <h2>Personas registradas</h2>
                <button className="btn-link" onClick={() => navigate('/personas')}>Ver todas →</button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Cédula</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Dirección Regional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personas.slice(0, 5).map((p) => (
                      <tr key={p.id_persona}>
                        <td>
                          <div className="avatar-cell">
                            <div className="avatar">{p.nombre?.charAt(0)}{p.apellidos?.charAt(0)}</div>
                            <strong>{p.nombre} {p.apellidos}</strong>
                          </div>
                        </td>
                        <td>{p.cedula}</td>
                        <td className="td-email">{p.email || '—'}</td>
                        <td><span className={`badge badge-${p.rol}`}>{p.rol}</span></td>
                        <td>{p.direccion_regional_oficina || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}