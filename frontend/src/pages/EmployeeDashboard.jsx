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
            <div className="d-flex gap-2 flex-wrap">
        <Link to="/employee/entry" className="btn btn-primary">
          New Truck Entry
        </Link>
        <Link to="/employee/lookup" className="btn btn-outline-primary">
          Session Lookup
        </Link>
      </div>
            <p className="text-muted mt-3">Exit tools come later in the build.</p>
      </div>
  )
}

export default EmployeeDashboard