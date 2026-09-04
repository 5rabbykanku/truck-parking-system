import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function SessionLookup() {
  const [code, setCode] = useState('')
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
   const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paying, setPaying] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(null)
  const [exiting, setExiting] = useState(false)
  const [exitConfirmed, setExitConfirmed] = useState(null)
  const { token } = useAuth()
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSession(null)
    setLoading(true)

    try {
      const [sessionResponse, feeResponse] = await Promise.all([
        axios.get(`http://127.0.0.1:5000/sessions/lookup/${code}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://127.0.0.1:5000/sessions/lookup/${code}/fee`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      setSession({ ...sessionResponse.data, calculated_fee: feeResponse.data.calculated_fee })
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
    setPaymentConfirmed(null)
    setExitConfirmed(null)
  }

  const handleConfirmPayment = async () => {
    setPaying(true)
    setError('')

    try {
      const response = await axios.post(
        `http://127.0.0.1:5000/sessions/lookup/${session.parking_code}/pay`,
        { payment_method: paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPaymentConfirmed(response.data)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setPaying(false)
    }
  }
  const handleConfirmExit = async () => {
    setExiting(true)
    setError('')

    try {
      const response = await axios.post(
        `http://127.0.0.1:5000/sessions/lookup/${session.parking_code}/exit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setExitConfirmed(response.data)
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setExiting(false)
    }
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
          <p className="mb-1"><strong>Fee:</strong> ${session.calculated_fee.toFixed(2)}</p>

                    {paymentConfirmed && (
            <div className="alert alert-success py-2 mt-3">
              Payment confirmed: ${paymentConfirmed.fee_amount.toFixed(2)} via {paymentConfirmed.payment_method}
            </div>
          )}

          {exitConfirmed && (
            <div className="alert alert-success py-2 mt-3">
              Exit confirmed at {new Date(exitConfirmed.exit_time).toLocaleTimeString()}
            </div>
          )}

          {(paymentConfirmed || session.status !== 'active') && !exitConfirmed && isActive && (
            <button className="btn btn-warning w-100 mt-3" onClick={handleConfirmExit} disabled={exiting}>
              {exiting ? 'Processing Exit...' : 'Confirm Exit'}
            </button>
          )}

          {isActive && !paymentConfirmed && (
            <div className="mt-3">
              <label htmlFor="paymentMethod" className="form-label">Payment Method</label>
              <select
                id="paymentMethod"
                className="form-select mb-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile</option>
              </select>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <button className="btn btn-success w-100" onClick={handleConfirmPayment} disabled={paying}>
                {paying ? 'Confirming...' : 'Confirm Payment'}
              </button>
            </div>
          )}

          <button className="btn btn-primary w-100 mt-3" onClick={handleNewLookup}>
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