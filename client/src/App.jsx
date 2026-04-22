import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import DashboardShared from './pages/DashboardShared'
import DashboardPersonal from './pages/DashboardPersonal'
import NewExpense from './pages/NewExpense'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/compartido" replace />} />
            <Route path="compartido" element={<DashboardShared />} />
            <Route path="personal" element={<DashboardPersonal />} />
            <Route path="nuevo-gasto" element={<NewExpense />} />
            <Route path="configuracion" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
