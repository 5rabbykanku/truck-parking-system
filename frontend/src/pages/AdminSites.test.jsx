import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'
import AdminSites from './AdminSites'
import { useAuth } from '../context/AuthContext'

vi.mock('axios')
vi.mock('../context/AuthContext')

describe('AdminSites', () => {
  it('Given sites exist, When the Admin views the page, Then they are listed', async () => {
    useAuth.mockReturnValue({ token: 'fake-token' })
    axios.get.mockResolvedValue({
      data: [{ site_id: 1, name: 'Main Depot', total_spaces: 50, hourly_rate: 10, daily_rate: 50, is_active: true }],
    })

    render(
      <MemoryRouter>
        <AdminSites />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Main Depot')).toBeInTheDocument()
    })
  })

  it('Given the Admin fills the new site form, When they submit, Then the site is created', async () => {
    useAuth.mockReturnValue({ token: 'fake-token' })
    axios.get.mockResolvedValue({ data: [] })
    axios.post.mockResolvedValue({ data: { id: 2, name: 'New Site', is_active: true } })

    render(
      <MemoryRouter>
        <AdminSites />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('+ New Site')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('+ New Site'))
    await userEvent.type(screen.getByLabelText(/name/i), 'New Site')
    await userEvent.type(screen.getByLabelText(/total spaces/i), '20')
    await userEvent.type(screen.getByLabelText(/hourly rate/i), '5')
    await userEvent.type(screen.getByLabelText(/daily rate/i), '25')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/admin/sites',
        expect.objectContaining({ name: 'New Site' }),
        expect.anything()
      )
    })
  })
})