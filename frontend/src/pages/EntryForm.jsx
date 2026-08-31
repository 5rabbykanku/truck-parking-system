import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function EntryForm() {
  const [driverName, setDriverName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [truckType, setTruckType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const { token } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/sessions/entry',
        {
          driver_name: driverName,
          phone_number: phoneNumber,
          plate_number: plateNumber,
          truck_type: truckType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setResult(response.data)
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

  const handleNewEntry = () => {
    setResult(null)
    setDriverName('')
    setPhoneNumber('')
    setPlateNumber('')
    setTruckType('')
    setError('')
  }

  if (result) {
    return (
      <div className="container py-4" style={{ maxWidth: '480px' }}>
        <div className="card p-4 text-center">
          <h4 className="mb-3">Entry Recorded</h4>
          <p className="text-muted mb-1">Parking Code</p>
          <h1 className="mb-4" style={{ letterSpacing: '4px' }}>{result.parking_code}</h1>
          <img
            src={result.qr_code_data}
            alt="QR Code"
            style={{ width: '200px', height: '200px', margin: '0 auto' }}
          />
          <button className="btn btn-primary w-100 mt-4" onClick={handleNewEntry}>
            New Entry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4" style={{ maxWidth: '480px' }}>
      <h4 className="mb-3">Truck Entry</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="driverName" className="form-label">Driver Name</label>
          <input
            type="text"
            className="form-control"
            id="driverName"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
          <input
            type="tel"
            className="form-control"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="plateNumber" className="form-label">Plate Number</label>
          <input
            type="text"
            className="form-control"
            id="plateNumber"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="truckType" className="form-label">Truck Type</label>
          <input
            type="text"
            className="form-control"
            id="truckType"
            value={truckType}
            onChange={(e) => setTruckType(e.target.value)}
            required
          />
        </div>
                {error && <div className="alert alert-danger py-2">{error}</div>}
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Entry'}
        </button>
      </form>
    </div>
  )
}

export default EntryForm