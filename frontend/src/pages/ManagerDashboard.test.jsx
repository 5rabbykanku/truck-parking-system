import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import ManagerDashboard from './ManagerDashboard'
import { useAuth } from '../context/AuthContext'

vi.mock('axios')
vi.mock('../context/AuthContext')

describe('ManagerDashboard', () => {
  it('Given dashboard data loads, When the Manager views the page, Then stat cards and history are shown', async () => {
    useAuth.mockReturnValue({ user: { name: 'Mary Manager' }, token: 'fake-token', logout: vi.fn() })

    axios.get.mockImplementation((url) => {
      if (url.includes('/spaces')) {
        return Promise.resolve({ data: { total_spaces: 50, occupied: 10, available: 40 } })
      }
      if (url.includes('/today')) {
        return Promise.resolve({ data: { date: '2026-09-08', entries: 5, exits: 2 } })
      }
      if (url.includes('/revenue')) {
        return Promise.resolve({ data: { start: '2026-09-08', end: '2026-09-08', payment_count: 3, total_revenue: 45.0 } })
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          data: [
            {
              session_id: 1,
              parking_code: '123456',
              status: 'completed',
              entry_time: '2026-09-08T10:00:00',
              exit_time: '2026-09-08T12:00:00',
              fee_amount: 15.0,
              payment_method: 'cash',
              truck: { plate_number: 'TRK-001', truck_type: 'Flatbed' },
              driver: { name: 'John Doe', phone_number: '555-1234' },
            },
          ],
        })
      }
      return Promise.resolve({ data: {} })
    })

    render(<ManagerDashboard />)

    await waitFor(() => {
      expect(screen.getByText('10 / 50')).toBeInTheDocument()
    })
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('5 / 2')).toBeInTheDocument()
    expect(screen.getByText('$45.00')).toBeInTheDocument()
    expect(screen.getByText('TRK-001')).toBeInTheDocument()
  })
})