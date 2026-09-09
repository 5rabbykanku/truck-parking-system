import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import AdminDashboard from './AdminDashboard'
import { useAuth } from '../context/AuthContext'

vi.mock('axios')
vi.mock('../context/AuthContext')

describe('AdminDashboard', () => {
  it('Given sites exist, When the Admin views the page, Then a summary table is shown', async () => {
    useAuth.mockReturnValue({ user: { name: 'Adam Admin' }, token: 'fake-token', logout: vi.fn() })
    axios.get.mockResolvedValue({
      data: [
        { site_id: 1, name: 'Main Depot', total_spaces: 50, occupied: 10, available: 40, today_revenue: 100.0 },
      ],
    })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Main Depot')).toBeInTheDocument()
    })
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('Given a site is selected, When the Admin clicks View, Then the drill-down shows site details', async () => {
    useAuth.mockReturnValue({ user: { name: 'Adam Admin' }, token: 'fake-token', logout: vi.fn() })

    axios.get.mockImplementation((url) => {
      if (url.includes('/admin/sites') && !url.includes('/current') && !url.includes('/history')) {
        return Promise.resolve({
          data: [{ site_id: 1, name: 'Main Depot', total_spaces: 50, occupied: 10, available: 40, today_revenue: 100.0 }],
        })
      }
      if (url.includes('/current')) {
        return Promise.resolve({
          data: [{ session_id: 1, parking_code: '123456', entry_time: '2026-09-08T10:00:00', truck: { plate_number: 'TRK-001', truck_type: 'Flatbed' }, driver: { name: 'John Doe', phone_number: '555-1234' } }],
        })
      }
      if (url.includes('/history')) {
        return Promise.resolve({
          data: [{ session_id: 1, parking_code: '123456', status: 'active', truck: { plate_number: 'TRK-001', truck_type: 'Flatbed' }, fee_amount: null }],
        })
      }
      return Promise.resolve({ data: {} })
    })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Main Depot')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /view/i }))

    await waitFor(() => {
      expect(screen.getByText('Currently Parked (1)')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /back to all sites/i })).toBeInTheDocument()
  })
})