import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function AdminDashboard() {
  const { user, token, logout } = useAuth()
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState(null)
  const [siteCurrent, setSiteCurrent] = useState([])
  const [siteHistory, setSiteHistory] = useState([])
  const [drillLoading, setDrillLoading] = useState(false)

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/admin/sites', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSites(response.data)
      } catch (err) {
        console.error('Failed to load sites', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSites()
  }, [token])

  const handleViewSite = async (site) => {
    setSelectedSite(site)
    setDrillLoading(true)

    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [currentRes, historyRes] = await Promise.all([
        axios.get(`http://127.0.0.1:5000/admin/sites/${site.site_id}/current`, { headers }),
        axios.get(`http://127.0.0.1:5000/admin/sites/${site.site_id}/history`, { headers }),
      ])
      setSiteCurrent(currentRes.data)
      setSiteHistory(historyRes.data)
    } catch (err) {
      console.error('Failed to load site detail', err)
    } finally {
      setDrillLoading(false)
    }
  }

  const handleBackToSites = () => {
    setSelectedSite(null)
    setSiteCurrent([])
    setSiteHistory([])
  }

  if (loading) {
    return <div className="container py-4">Loading dashboard...</div>
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <button className="btn btn-outline-secondary" onClick={logout}>Log Out</button>
      </div>
      <p>Welcome, {user?.name} (Admin)</p>

      {!selectedSite ? (
        <>
          <h5>All Sites</h5>
          <div className="table-responsive">
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Occupied / Total</th>
                  <th>Available</th>
                  <th>Today's Revenue</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.site_id}>
                    <td>{site.name}</td>
                    <td>{site.occupied} / {site.total_spaces}</td>
                    <td>{site.available}</td>
                    <td>${site.today_revenue.toFixed(2)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewSite(site)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
                    <button className="btn btn-outline-secondary btn-sm mb-3" onClick={handleBackToSites}>
            &larr; Back to All Sites
          </button>
          <h5>{selectedSite.name}</h5>

          {drillLoading ? (
            <p className="text-muted">Loading site details...</p>
          ) : (
            <>
              <h6 className="mt-4">Currently Parked ({siteCurrent.length})</h6>
              <div className="table-responsive mb-4">
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
                    {siteCurrent.map((s) => (
                      <tr key={s.session_id}>
                        <td>{s.parking_code}</td>
                        <td>{s.truck.plate_number}</td>
                        <td>{s.driver.name}</td>
                        <td>{new Date(s.entry_time).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {siteCurrent.length === 0 && <p className="text-muted">No trucks currently parked.</p>}
              </div>

              <h6>History</h6>
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Plate</th>
                      <th>Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteHistory.map((s) => (
                      <tr key={s.session_id}>
                        <td>{s.parking_code}</td>
                        <td>
                          <span className={`badge ${s.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>{s.truck.plate_number}</td>
                        <td>{s.fee_amount ? `$${s.fee_amount.toFixed(2)}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {siteHistory.length === 0 && <p className="text-muted">No activity yet today.</p>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default AdminDashboard