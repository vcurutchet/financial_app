import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Pro from './pages/Pro'
import Perso from './pages/Perso'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pro" element={<Pro />} />
          <Route path="perso" element={<Perso />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
