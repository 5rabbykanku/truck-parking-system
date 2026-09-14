import StatusBadge from './StatusBadge'

function HistoryTable({ sessions, showDriver = true }) {
  if (sessions.length === 0) {
    return <p className="text-muted">No activity yet today.</p>
  }

  return (
    <div className="table-responsive">
      <table className="table table-sm table-striped">
        <thead>
          <tr>
            <th>Code</th>
            <th>Status</th>
            <th>Plate</th>
            {showDriver && <th>Driver</th>}
            <th>Entry</th>
            <th>Exit</th>
            <th>Fee</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.session_id}>
              <td>{s.parking_code}</td>
              <td><StatusBadge status={s.status} /></td>
              <td>{s.truck.plate_number}</td>
              {showDriver && <td>{s.driver.name}</td>}
              <td>{new Date(s.entry_time).toLocaleTimeString()}</td>
              <td>{s.exit_time ? new Date(s.exit_time).toLocaleTimeString() : '-'}</td>
              <td>{s.fee_amount ? `$${s.fee_amount.toFixed(2)}` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default HistoryTable