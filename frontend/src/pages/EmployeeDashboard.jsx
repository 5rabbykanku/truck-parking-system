import { useAuth } from '../context/AuthContext'

function EmployeeDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Employee Dashboard</h2>
        <button className="btn btn-outline-secondary" onClick={logout}>Log Out</button>
      </div>
      <p>Welcome, {user?.name} (Employee)</p>
      <p className="text-muted">This is a placeholder - full Employee tools (truck entry, session lookup, exit) come later in the build.</p>
    </div>
  )
}

export default EmployeeDashboard