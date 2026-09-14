import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import ActiveSessionsTable from '../components/dashboard/ActiveSessionsTable'
import HistoryTable from '../components/dashboard/HistoryTable'

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
      <div className="d-flex gap-2 flex-wrap mb-4">
        <Link to="/admin/sites" className="btn btn-primary">Manage Sites</Link>
        <Link to="/admin/managers" className="btn btn-primary">Manage Managers</Link>
      </div>

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
              <div className="mb-4">
                <ActiveSessionsTable sessions={siteCurrent} />
              </div>

              <h6>History</h6>
              <HistoryTable sessions={siteHistory} showDriver={false} />
            </>
          )}
        </>
      )}
    </div>
  )
}

export default AdminDashboard