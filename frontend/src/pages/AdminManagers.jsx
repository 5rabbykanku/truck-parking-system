import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../config'

function AdminManagers() {
  const { token } = useAuth()
  const [managers, setManagers] = useState([])
  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingManager, setEditingManager] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', site_id: '' })

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${token}` }
    try {
                  const [managersRes, sitesRes] = await Promise.all([
        api.get('/admin/managers', { headers }),
        api.get('/admin/sites', { headers }),
      ])
      setManagers(managersRes.data)
      setSites(sitesRes.data)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  const handleNewManager = () => {
    setEditingManager(null)
    setFormData({ name: '', email: '', password: '', site_id: '' })
    setShowForm(true)
  }

  const handleEditManager = (manager) => {
    setEditingManager(manager)
    setFormData({ name: manager.name, email: manager.email, password: '', site_id: manager.site_id || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const headers = { Authorization: `Bearer ${token}` }
                  if (editingManager) {
        const payload = { name: formData.name, email: formData.email, site_id: parseInt(formData.site_id, 10) }
        await api.put(`/admin/managers/${editingManager.id}`, payload, { headers })
      } else {
        const payload = { ...formData, site_id: parseInt(formData.site_id, 10) }
        await api.post('/admin/managers', payload, { headers })
      }
      setShowForm(false)
      fetchData()
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  const handleDeactivate = async (manager) => {
    try {
                  await api.delete(`/admin/managers/${manager.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (err) {
      setError('Failed to deactivate manager')
    }
  }

  if (loading) {
    return <div className="container py-4">Loading managers...</div>
  }

  const availableSites = sites.filter((s) => s.is_active !== false)

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Managers</h2>
        <Link to="/admin" className="btn btn-outline-secondary">Back to Dashboard</Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {!showForm ? (
        <>
          <button className="btn btn-primary mb-3" onClick={handleNewManager}>+ New Manager</button>
          <div className="table-responsive">
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Site</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.id}>
                    <td>{manager.name}</td>
                    <td>{manager.email}</td>
                    <td>{manager.site_name || '-'}</td>
                    <td>
                      <span className={`badge ${manager.is_active === false ? 'bg-secondary' : 'bg-success'}`}>
                        {manager.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditManager(manager)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeactivate(manager)}>Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
          <h5>{editingManager ? 'Edit Manager' : 'New Manager'}</h5>
                   <div className="mb-3">
            <label htmlFor="managerName" className="form-label">Name</label>
            <input id="managerName" type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label htmlFor="managerEmail" className="form-label">Email</label>
            <input id="managerEmail" type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          {!editingManager && (
            <div className="mb-3">
              <label htmlFor="managerPassword" className="form-label">Password</label>
              <input id="managerPassword" type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="managerSite" className="form-label">Site</label>
            <select id="managerSite" className="form-select" value={formData.site_id} onChange={(e) => setFormData({ ...formData, site_id: e.target.value })} required>
              <option value="">Select a site</option>
              {availableSites.map((site) => (
                <option key={site.site_id} value={site.site_id}>{site.name}</option>
              ))}
            </select>
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

export default AdminManagers