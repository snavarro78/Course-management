import { useNavigate, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const rol = localStorage.getItem('rol') || 'usuario'
  const esAdmin = rol === 'admin'
  const esSubAdmin = rol === 'sub_admin'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('rol')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <aside className="home-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">IDP</div>
        <span>Instituto de<br />Desarrollo Profesional</span>
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard — solo admin */}
        {esAdmin && (
          <button className={`nav-item ${isActive('/home') ? 'active' : ''}`} onClick={() => navigate('/home')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </button>
        )}

        {/* Personas — solo admin */}
        {esAdmin && (
          <button className={`nav-item ${isActive('/personas') ? 'active' : ''}`} onClick={() => navigate('/personas')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Personas
          </button>
        )}

        {/* Mediadores — solo admin */}
        {esAdmin && (
          <button className={`nav-item ${isActive('/mediadores') ? 'active' : ''}`} onClick={() => navigate('/mediadores')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              <path d="M18 14l2 2 4-4" strokeWidth="2.5"/>
            </svg>
            Mediadores
          </button>
        )}

        {/* Cursos — solo admin */}
        {esAdmin && (
          <button className={`nav-item ${isActive('/cursos') ? 'active' : ''}`} onClick={() => navigate('/cursos')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Cursos
          </button>
        )}

        {/* Matrículas — admin ve todo, sub_admin solo consulta */}
        <button className={`nav-item ${isActive('/matriculas') ? 'active' : ''}`} onClick={() => navigate('/matriculas')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Matrículas
        </button>

        {/* Reportes — admin y sub_admin */}
        <button className={`nav-item ${isActive('/reportes') ? 'active' : ''}`} onClick={() => navigate('/reportes')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>
            <polyline points="9 7 9 3 15 3"/>
          </svg>
          Reportes
        </button>
      </nav>

      {/* Indicador de rol */}
      {esSubAdmin && (
        <div style={{
          margin: '8px 0', padding: '8px 12px',
          background: 'rgba(200,149,42,0.15)',
          borderRadius: '8px', fontSize: '11px',
          color: 'var(--idp-dorado)', textAlign: 'center'
        }}>
          Modo Sub-Admin<br/>Solo lectura
        </div>
      )}

      <button className="sidebar-logout" onClick={handleLogout}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Cerrar sesión
      </button>
    </aside>
  )
}