import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import Chart from 'chart.js/auto'

function ManagerDashboard() {
  const { user, token, logout } = useAuth()
  const [spaces, setSpaces] = useState(null)
  const [today, setToday] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [history, setHistory] = useState([])
  const [dailyRevenue, setDailyRevenue] = useState([])
  const [loading, setLoading] = useState(true)
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const [spacesRes, todayRes, revenueRes, historyRes, dailyRes] = await Promise.all([
          axios.get('http://127.0.0.1:5000/dashboard/spaces', { headers }),
          axios.get('http://127.0.0.1:5000/dashboard/today', { headers }),
          axios.get('http://127.0.0.1:5000/dashboard/revenue', { headers }),
          axios.get('http://127.0.0.1:5000/dashboard/history', { headers }),
          axios.get('http://127.0.0.1:5000/dashboard/revenue/daily', { headers }),
        ])
        setSpaces(spacesRes.data)
        setToday(todayRes.data)
        setRevenue(revenueRes.data)
        setHistory(historyRes.data)
        setDailyRevenue(dailyRes.data)
      } catch (err) {
        console.error('Failed to load dashboard', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [token])

  useEffect(() => {
    if (dailyRevenue.length === 0 || !chartRef.current) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: dailyRevenue.map((d) => d.date.slice(5)),
        datasets: [{
          label: 'Revenue ($)',
          data: dailyRevenue.map((d) => d.revenue),
          backgroundColor: '#0d6efd',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    })

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [dailyRevenue])

  if (loading) {
    return <div className="container py-4">Loading dashboard...</div>
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manager Dashboard</h2>
        <button className="btn btn-outline-secondary" onClick={logout}>Log Out</button>
      </div>
      <p>Welcome, {user?.name} (Manager)</p>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card p-3 text-center h-100">
            <div className="text-muted small">Occupied</div>
            <div className="fs-3">{spaces.occupied} / {spaces.total_spaces}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 text-center h-100">
            <div className="text-muted small">Available</div>
            <div className="fs-3">{spaces.available}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 text-center h-100">
            <div className="text-muted small">Today's Entries / Exits</div>
            <div className="fs-3">{today.entries} / {today.exits}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card p-3 text-center h-100">
            <div className="text-muted small">Today's Revenue</div>
            <div className="fs-3">${revenue.total_revenue.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div className="card p-3 mb-4">
        <h6>Revenue - Last 7 Days</h6>
        <canvas ref={chartRef}></canvas>
      </div>

      
      <h5>History</h5>
      <div className="table-responsive">
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Plate</th>
              <th>Driver</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Fee</th>
            </tr>
          </thead>
          <tbody>
            {history.map((s) => (
              <tr key={s.session_id}>
                <td>{s.parking_code}</td>
                <td>
                  <span className={`badge ${s.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                    {s.status}
                  </span>
                </td>
                <td>{s.truck.plate_number}</td>
                <td>{s.driver.name}</td>
                <td>{new Date(s.entry_time).toLocaleTimeString()}</td>
                <td>{s.exit_time ? new Date(s.exit_time).toLocaleTimeString() : '-'}</td>
                <td>{s.fee_amount ? `$${s.fee_amount.toFixed(2)}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && <p className="text-muted">No activity yet today.</p>}
      </div>
    </div>
  )
}

export default ManagerDashboard