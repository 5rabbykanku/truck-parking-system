import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import EntryForm from './pages/EntryForm'
import SessionLookup from './pages/SessionLookup'
import AdminSites from './pages/AdminSites'
import AdminManagers from './pages/AdminManagers'
import ManagerEmployees from './pages/ManagerEmployees'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

                    <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/sites"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSites />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/managers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminManagers />
              </ProtectedRoute>
            }
          />

                    <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/employees"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerEmployees />
              </ProtectedRoute>
            }
          />
           <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/entry"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EntryForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/lookup"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <SessionLookup />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
