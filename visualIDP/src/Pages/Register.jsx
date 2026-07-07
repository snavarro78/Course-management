import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    apellidos: '',
    cedula: '',
    sexo: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.apellidos || !form.cedula || !form.sexo || !form.email || !form.password) {
      setError('Todos los campos son obligatorios')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setError('Ingresa un correo electrónico válido')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setError('')
    // TODO: conectar al backend
    navigate('/hero')
  }

  return (
    <div className="auth-container">

      {/* ── Panel izquierdo ── */}
      <div className="auth-left">
        <div className="auth-left-content">
          <span className="auth-left-tag">Portal Institucional</span>
          <h2>
            Formación y <span>Crecimiento</span> Profesional
          </h2>
          <div className="auth-divider" />
          <p>
            Crea tu cuenta para acceder a la oferta de capacitaciones,
            seguimiento de avances y recursos del IDP.
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
            <h1 className="auth-title">Crear cuenta</h1>
            <p className="auth-subtitle">Completa el formulario para registrarte</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Nombre y Apellidos en fila */}
            <div className="auth-form-row">
              <div className="input-group">
                <label>Nombre</label>
                <div className="input-wrapper">
                  <span className="input-icon">✦</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Apellidos</label>
                <div className="input-wrapper">
                  <span className="input-icon">✦</span>
                  <input
                    type="text"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    placeholder="Tus apellidos"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Cédula y Sexo en fila */}
            <div className="auth-form-row">
              <div className="input-group">
                <label>Cédula</label>
                <div className="input-wrapper">
                  <span className="input-icon">#</span>
                  <input
                    type="text"
                    name="cedula"
                    value={form.cedula}
                    onChange={handleChange}
                    placeholder="0-0000-0000"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Sexo</label>
                <div className="input-wrapper">
                  <span className="input-icon select-icon">▾</span>
                  <select
                    name="sexo"
                    value={form.sexo}
                    onChange={handleChange}
                    className="auth-select"
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Prefiero no indicar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Correo */}
            <div className="input-group">
              <label>Correo electrónico</label>
              <div className="input-wrapper">
                <span className="input-icon">@</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="usuario@mep.go.cr"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-wrapper">
                <span className="input-icon">•••</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <button className="auth-btn" type="submit">
              <span>Crear Cuenta</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes cuenta?{' '}
            <span className="auth-link" onClick={() => navigate('/login')}>Inicia sesión</span>
          </p>
        </div>
      </div>

    </div>
  )
}