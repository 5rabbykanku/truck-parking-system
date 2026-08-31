import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function SessionLookup() {
  const [code, setCode] = useState('')
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { token } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSession(null)
    setLoading(true)

    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/sessions/lookup/${code}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSession(response.data)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNewLookup = () => {
    setSession(null)
    setCode('')
    setError('')
  }

  if (session) {
    const isActive = session.status === 'active'

    return (
      <div className="container py-4" style={{ maxWidth: '480px' }}>
        <div className="card p-4">
          <span className={`badge mb-3 ${isActive ? 'bg-success' : 'bg-secondary'}`} style={{ width: 'fit-content' }}>
            {isActive ? 'Active' : 'Completed'}
          </span>
          <p className="text-muted mb-1">Parking Code</p>
          <h3 className="mb-3">{session.parking_code}</h3>

          <p className="mb-1"><strong>Truck:</strong> {session.truck.plate_number} ({session.truck.truck_type})</p>
          <p className="mb-1"><strong>Driver:</strong> {session.driver.name} ({session.driver.phone_number})</p>
          <p className="mb-1"><strong>Entry:</strong> {new Date(session.entry_time).toLocaleString()}</p>
          {session.exit_time && (
            <p className="mb-1"><strong>Exit:</strong> {new Date(session.exit_time).toLocaleString()}</p>
          )}

          <button className="btn btn-primary w-100 mt-4" onClick={handleNewLookup}>
            New Lookup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4" style={{ maxWidth: '480px' }}>
      <h4 className="mb-3">Session Lookup</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="code" className="form-label">Parking Code</label>
          <input
            type="text"
            className="form-control"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>
                {error && <div className="alert alert-danger py-2">{error}</div>}
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Looking up...' : 'Look Up'}
        </button>
      </form>
    </div>
  )
}

export default SessionLookup