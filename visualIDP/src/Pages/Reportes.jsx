import { useState } from 'react'
import { getPersonas, getMatriculas, getCursos } from '../services/api'
import Sidebar from '../Components/Sidebar'
import '../styles/Home.css'
import '../styles/Modal.css'

export default function Reportes() {
  const [cedula, setCedula] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [persona, setPersona] = useState(null)
  const [cursos, setCursos] = useState([])
  const [error, setError] = useState('')
  const [generando, setGenerando] = useState(false)

  const buscar = async () => {
    if (!cedula.trim()) { setError('Ingresa una cédula'); return }
    setBuscando(true)
    setPersona(null)
    setCursos([])
    setError('')
    try {
      const cedLimpia = cedula.trim().replace(/\D/g, '')
      const personas = await getPersonas(0, 5, cedLimpia)
      const p = personas.find(x => x.cedula === cedLimpia)
      if (!p) { setError('No se encontró ninguna persona con esa cédula'); return }
      setPersona(p)

      // Traer matrículas y cursos de esa persona
      const [todasMatriculas, todosCursos] = await Promise.all([getMatriculas(), getCursos()])
      const matriculasPer = todasMatriculas.filter(m => m.id_persona === p.id_persona)
      const cursosIds = matriculasPer.map(m => m.id_curso)
      const cursosPersona = todosCursos
        .filter(c => cursosIds.includes(c.id_curso))
        .map(c => ({
          ...c,
          estado: matriculasPer.find(m => m.id_curso === c.id_curso)?.estado || '—'
        }))
      setCursos(cursosPersona)
    } catch (e) {
      setError(e.message)
    } finally {
      setBuscando(false)
    }
  }

  const descargarPDF = async () => {
    if (!persona) return
    setGenerando(true)
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      const doc = new jsPDF()
      const fecha = new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })

      // Encabezado
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

      // Título
      doc.setTextColor(0, 56, 118)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Historial de Cursos por Persona', 14, 40)

      // Info persona
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(`Nombre: ${persona.nombre} ${persona.apellidos}`, 14, 50)
      doc.text(`Cédula: ${persona.cedula}`, 14, 56)
      doc.text(`Correo: ${persona.email || '—'}`, 14, 62)
      doc.text(`Dirección Regional: ${persona.direccion_regional_oficina || '—'}`, 14, 68)
      doc.text(`Total de cursos: ${cursos.length}`, 14, 74)

      // Línea dorada
      doc.setDrawColor(200, 149, 42)
      doc.setLineWidth(0.5)
      doc.line(14, 78, 196, 78)

      // Tabla de cursos
      const aprobados = cursos.filter(c => c.estado === 'aprobado').length
      const desaprobados = cursos.filter(c => c.estado === 'desaprobado').length

      autoTable(doc, {
        startY: 82,
        head: [['#', 'Consecutivo', 'Nombre del curso', 'Fecha inicio', 'Fecha fin', 'Estado']],
        body: cursos.map((c, i) => [
          i + 1,
          c.consecutivo,
          c.nombre_curso,
          c.fecha_inicio || '—',
          c.fecha_fin || '—',
          c.estado === 'aprobado' ? 'Aprobado' : c.estado === 'desaprobado' ? 'Desaprobado' : '—',
        ]),
        headStyles: { fillColor: [0, 56, 118], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [232, 238, 248] },
        bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          5: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      })

      // Resumen al final
      const finalY = doc.lastAutoTable.finalY + 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 56, 118)
      doc.text(`Resumen: ${aprobados} aprobado(s) · ${desaprobados} desaprobado(s)`, 14, finalY)

      // Pie de página
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`Página ${i} de ${pageCount} — IDP Sistema de Capacitaciones`, 14, doc.internal.pageSize.height - 8)
      }

      doc.save(`historial_${persona.cedula}_${new Date().toISOString().slice(0,10)}.pdf`)
    } catch (e) {
      alert('Error al generar el PDF: ' + e.message)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="home-wrapper">
      <Sidebar />
      <main className="home-main">
        <header className="home-header">
          <div>
            <h1>Reportes</h1>
            <p>Historial de cursos por persona</p>
          </div>
        </header>

        <div className="home-content">
          {/* Buscador */}
          <div style={{
            background: 'white', borderRadius: 'var(--radius)',
            padding: '24px', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)', maxWidth: '560px', marginBottom: '28px'
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', color: 'var(--idp-azul)', marginBottom: '16px' }}>
              Buscar persona por cédula
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={cedula}
                onChange={e => { setCedula(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                placeholder="Ej: 305250652"
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', fontSize: '14px',
                  fontFamily: 'DM Sans, sans-serif', outline: 'none'
                }}
              />
              <button className="btn-primary" onClick={buscar} disabled={buscando}>
                {buscando ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
          </div>

          {/* Resultado */}
          {persona && (
            <>
              {/* Tarjeta persona */}
              <div style={{
                background: 'white', borderRadius: 'var(--radius)',
                padding: '20px 24px', border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)', marginBottom: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '16px', flexShrink: 0 }}>
                    {persona.nombre?.charAt(0)}{persona.apellidos?.charAt(0)}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--idp-azul)', fontSize: '16px', display: 'block' }}>
                      {persona.nombre} {persona.apellidos}
                    </strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Cédula: {persona.cedula} · {persona.email || 'Sin correo'} · {cursos.length} curso(s)
                    </span>
                  </div>
                </div>
                <button className="btn-pdf" onClick={descargarPDF} disabled={generando || cursos.length === 0}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/>
                  </svg>
                  {generando ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>

              {/* Tabla de cursos */}
              {cursos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Esta persona no tiene cursos registrados
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Consecutivo</th><th>Nombre del curso</th>
                        <th>Fecha inicio</th><th>Fecha fin</th><th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cursos.map((c, i) => (
                        <tr key={c.id_curso}>
                          <td className="td-id">{i + 1}</td>
                          <td><span className="badge badge-usuario">{c.consecutivo}</span></td>
                          <td><strong>{c.nombre_curso}</strong></td>
                          <td>{c.fecha_inicio || '—'}</td>
                          <td>{c.fecha_fin || '—'}</td>
                          <td>
                            <span className={`badge ${c.estado === 'aprobado' ? 'badge-green' : c.estado === 'desaprobado' ? 'badge-admin' : ''}`}>
                              {c.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}