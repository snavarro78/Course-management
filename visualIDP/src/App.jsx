import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './Pages/Register'
import Login from './Pages/Login'
import Home from './Pages/Home'
import Personas from './Pages/Personas'
import Mediadores from './Pages/Mediadores'
import Cursos from './Pages/Cursos'
import Matriculas from './Pages/Matriculas'
import Reportes from './Pages/Reportes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/personas" element={<Personas />} />
        <Route path="/mediadores" element={<Mediadores />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/matriculas" element={<Matriculas />} />
        <Route path="/reportes" element={<Reportes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App