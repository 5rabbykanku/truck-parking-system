import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminSites() {
  const { token } = useAuth()
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSite, setEditingSite] = useState(null)
  const [formData, setFormData] = useState({ name: '', address: '', total_spaces: '', hourly_rate: '', daily_rate: '' })

  const fetchSites = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/admin/sites', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSites(response.data)
    } catch (err) {
      setError('Failed to load sites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [token])

  const handleNewSite = () => {
    setEditingSite(null)
    setFormData({ name: '', address: '', total_spaces: '', hourly_rate: '', daily_rate: '' })
    setShowForm(true)
  }

  const handleEditSite = (site) => {
    setEditingSite(site)
    setFormData({
      name: site.name,
      address: site.address || '',
      total_spaces: site.total_spaces,
      hourly_rate: site.hourly_rate,
      daily_rate: site.daily_rate,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      name: formData.name,
      address: formData.address,
      total_spaces: parseInt(formData.total_spaces, 10),
      hourly_rate: parseFloat(formData.hourly_rate),
      daily_rate: parseFloat(formData.daily_rate),
    }

    try {
      const headers = { Authorization: `Bearer ${token}` }
      if (editingSite) {
        await axios.put(`http://127.0.0.1:5000/admin/sites/${editingSite.site_id}`, payload, { headers })
      } else {
        await axios.post('http://127.0.0.1:5000/admin/sites', payload, { headers })
      }
      setShowForm(false)
      fetchSites()
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  const handleDeactivate = async (site) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/admin/sites/${site.site_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchSites()
    } catch (err) {
      setError('Failed to deactivate site')
    }
  }

  if (loading) {
    return <div className="container py-4">Loading sites...</div>
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Sites</h2>
        <Link to="/admin" className="btn btn-outline-secondary">Back to Dashboard</Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {!showForm ? (
        <>
          <button className="btn btn-primary mb-3" onClick={handleNewSite}>+ New Site</button>
          <div className="table-responsive">
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Spaces</th>
                  <th>Hourly Rate</th>
                  <th>Daily Rate</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.site_id}>
                    <td>{site.name}</td>
                    <td>{site.total_spaces}</td>
                    <td>${site.hourly_rate}</td>
                    <td>${site.daily_rate}</td>
                    <td>
                      <span className={`badge ${site.is_active === false ? 'bg-secondary' : 'bg-success'}`}>
                        {site.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditSite(site)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeactivate(site)}>Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
          <h5>{editingSite ? 'Edit Site' : 'New Site'}</h5>
                    <div className="mb-3">
            <label htmlFor="siteName" className="form-label">Name</label>
            <input id="siteName" type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label htmlFor="siteAddress" className="form-label">Address</label>
            <input id="siteAddress" type="text" className="form-control" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="mb-3">
            <label htmlFor="siteTotalSpaces" className="form-label">Total Spaces</label>
            <input id="siteTotalSpaces" type="number" className="form-control" value={formData.total_spaces} onChange={(e) => setFormData({ ...formData, total_spaces: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label htmlFor="siteHourlyRate" className="form-label">Hourly Rate ($)</label>
            <input id="siteHourlyRate" type="number" step="0.01" className="form-control" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label htmlFor="siteDailyRate" className="form-label">Daily Rate ($)</label>
            <input id="siteDailyRate" type="number" step="0.01" className="form-control" value={formData.daily_rate} onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })} required />
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminSites