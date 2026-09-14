import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ManagerEmployees() {
  const { token } = useAuth()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/manager/employees', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEmployees(response.data)
    } catch (err) {
      setError('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [token])

  const handleNewEmployee = () => {
    setEditingEmployee(null)
    setFormData({ name: '', email: '', password: '' })
    setShowForm(true)
  }

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee)
    setFormData({ name: employee.name, email: employee.email, password: '' })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const headers = { Authorization: `Bearer ${token}` }
      if (editingEmployee) {
        await axios.put(
          `http://127.0.0.1:5000/manager/employees/${editingEmployee.id}`,
          { name: formData.name, email: formData.email },
          { headers }
        )
      } else {
        await axios.post('http://127.0.0.1:5000/manager/employees', formData, { headers })
      }
      setShowForm(false)
      fetchEmployees()
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error)
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  const handleDeactivate = async (employee) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/manager/employees/${employee.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchEmployees()
    } catch (err) {
      setError('Failed to deactivate employee')
    }
  }

  if (loading) {
    return <div className="container py-4">Loading employees...</div>
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Employees</h2>
        <Link to="/manager" className="btn btn-outline-secondary">Back to Dashboard</Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {!showForm ? (
        <>
          <button className="btn btn-primary mb-3" onClick={handleNewEmployee}>+ New Employee</button>
          <div className="table-responsive">
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>
                      <span className={`badge ${employee.is_active === false ? 'bg-secondary' : 'bg-success'}`}>
                        {employee.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>{employee.last_active_at ? new Date(employee.last_active_at).toLocaleString() : 'Never'}</td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditEmployee(employee)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeactivate(employee)}>Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ maxWidth: '480px' }}>
          <h5>{editingEmployee ? 'Edit Employee' : 'New Employee'}</h5>
                    <div className="mb-3">
            <label htmlFor="employeeName" className="form-label">Name</label>
            <input id="employeeName" type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label htmlFor="employeeEmail" className="form-label">Email</label>
            <input id="employeeEmail" type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          {!editingEmployee && (
            <div className="mb-3">
              <label htmlFor="employeePassword" className="form-label">Password</label>
              <input id="employeePassword" type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
          )}
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ManagerEmployees