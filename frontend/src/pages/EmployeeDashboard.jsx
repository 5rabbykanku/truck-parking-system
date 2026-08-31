import { Link } from 'react-router-dom'
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
      <Link to="/employee/entry" className="btn btn-primary">
        New Truck Entry
      </Link>
      <p className="text-muted mt-3">Session lookup and exit tools come later in the build.</p>
    </div>
  )
}

export default EmployeeDashboard