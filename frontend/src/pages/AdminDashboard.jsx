import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <button className="btn btn-outline-secondary" onClick={logout}>Log Out</button>
      </div>
      <p>Welcome, {user?.name} (Admin)</p>
      <p className="text-muted">This is a placeholder - full Admin tools (manage Managers, Sites) come later in the build.</p>
    </div>
  )
}

export default AdminDashboard