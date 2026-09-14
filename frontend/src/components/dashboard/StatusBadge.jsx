function StatusBadge({ status }) {
  const isActive = status === 'active'
  return (
    <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
      {isActive ? 'Active' : 'Completed'}
    </span>
  )
}

export default StatusBadge