import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function EmployeeDashboard() {
  const { user, token, logout } = useAuth()
  const [activeSessions, setActiveSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/dashboard/current', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setActiveSessions(response.data)
      } catch (err) {
        console.error('Failed to load active sessions', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveSessions()
  }, [token])

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Employee Dashboard</h2>
        <button className="btn btn-outline-secondary" onClick={logout}>Log Out</button>
      </div>
      <p>Welcome, {user?.name} (Employee)</p>
      <div className="d-flex gap-2 flex-wrap mb-4">
        <Link to="/employee/entry" className="btn btn-primary">
          New Truck Entry
        </Link>
        <Link to="/employee/lookup" className="btn btn-outline-primary">
          Session Lookup
        </Link>
      </div>

      <h5>Currently Parked ({activeSessions.length})</h5>
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : activeSessions.length === 0 ? (
        <p className="text-muted">No trucks currently parked.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>Code</th>
                <th>Plate</th>
                <th>Driver</th>
                <th>Entry Time</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.map((s) => (
                <tr key={s.session_id}>
                  <td>{s.parking_code}</td>
                  <td>{s.truck.plate_number}</td>
                  <td>{s.driver.name}</td>
                  <td>{new Date(s.entry_time).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EmployeeDashboard