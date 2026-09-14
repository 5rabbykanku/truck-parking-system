function ActiveSessionsTable({ sessions }) {
  if (sessions.length === 0) {
    return <p className="text-muted">No trucks currently parked.</p>
  }

  return (
    <div className="table-responsive">
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
          {sessions.map((s) => (
            <tr key={s.session_id}>
              <td>{s.parking_code}</td>
              <td>{s.truck.plate_number}</td>
              <td>{s.driver.name}</td>
              <td>{new Date(s.entry_time).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ActiveSessionsTable