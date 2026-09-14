import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import ActiveSessionsTable from '../components/dashboard/ActiveSessionsTable'

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
      ) : (
        <ActiveSessionsTable sessions={activeSessions} />
      )}
    </div>
  )
}

export default EmployeeDashboard