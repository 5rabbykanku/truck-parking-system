import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'
import EmployeeDashboard from './EmployeeDashboard'
import { useAuth } from '../context/AuthContext'

vi.mock('axios')
vi.mock('../context/AuthContext')

describe('EmployeeDashboard', () => {
  it('Given active sessions exist, When the dashboard loads, Then they are shown in a table', async () => {
    useAuth.mockReturnValue({ user: { name: 'Ellis Employee' }, token: 'fake-token', logout: vi.fn() })
    axios.get.mockResolvedValue({
      data: [
        {
          session_id: 1,
          parking_code: '123456',
          entry_time: '2026-09-08T10:00:00',
          truck: { plate_number: 'TRK-001', truck_type: 'Flatbed' },
          driver: { name: 'John Doe', phone_number: '555-1234' },
        },
      ],
    })

    render(
      <MemoryRouter>
        <EmployeeDashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('TRK-001')).toBeInTheDocument()
    })
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Currently Parked (1)')).toBeInTheDocument()
  })

  it('Given no active sessions, When the dashboard loads, Then an empty message is shown', async () => {
    useAuth.mockReturnValue({ user: { name: 'Ellis Employee' }, token: 'fake-token', logout: vi.fn() })
    axios.get.mockResolvedValue({ data: [] })

    render(
      <MemoryRouter>
        <EmployeeDashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('No trucks currently parked.')).toBeInTheDocument()
    })
  })
})