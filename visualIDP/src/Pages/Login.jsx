import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/api'
import '../styles/Register.css'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ correo: '', contraseña: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.correo || !form.contraseña) {
      setError('Por favor completa todos los campos')
      return
    }
    if (!form.correo.endsWith('@mep.go.cr')) {
      setError('⚠️ Solo se permiten correos institucionales @mep.go.cr')
      return
    }
    if (form.contraseña.length < 12) {
      setError('⚠️ La contraseña debe tener al menos 12 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await loginUser(form.correo, form.contraseña)

      // Guardar token, rol y redirigir
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('rol', data.rol || 'usuario')
      navigate('/home')

    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">

      {/* ── Panel izquierdo ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <span className="auth-left-tag">Portal Institucional</span>
          <h2>
            Plataforma de <span>Desarrollo</span> Profesional
          </h2>
          <div className="auth-divider" />
          <p>
            Accede a tu cuenta para gestionar capacitaciones, cursos y
            recursos del Instituto de Desarrollo Profesional.
          </p>
        </div>
        <div className="auth-left-footer">
          <span>© {new Date().getFullYear()} IDP — Ministerio de Educación Pública</span>
        </div>
      </div>

      {/* ── Panel derecho ── */}
      <div className="auth-right">
        <div className="auth-card">

          {/* Logo */}
          <div className="auth-logo-area">
            <div className="auth-logo-mock">
              <div className="auth-logo-mock-icon">idp</div>
              <div className="auth-logo-mock-text">
                <strong>IDP</strong>
                <span>Instituto de Desarrollo Profesional</span>
              </div>
            </div>
          </div>

          <div className="auth-header">
            <h1 className="auth-title">Iniciar sesión</h1>
            <p className="auth-subtitle">Ingresa tus credenciales institucionales</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Correo electrónico</label>
              <div className="input-wrapper">
                <span className="input-icon">@</span>
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="usuario@mep.go.cr"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <span className="input-icon">•••</span>
                <input
                  type="password"
                  name="contraseña"
                  value={form.contraseña}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              <span>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </form>

          <p className="auth-switch">
            ¿No tienes cuenta?{' '}
            <span className="auth-link" onClick={() => navigate('/')}>Regístrate</span>
          </p>
        </div>
      </div>

    </div>
  )
}