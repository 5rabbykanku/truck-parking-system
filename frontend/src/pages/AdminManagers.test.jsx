import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'
import AdminManagers from './AdminManagers'
import { useAuth } from '../context/AuthContext'

vi.mock('axios')
vi.mock('../context/AuthContext')

describe('AdminManagers', () => {
  it('Given managers exist, When the Admin views the page, Then they are listed', async () => {
    useAuth.mockReturnValue({ token: 'fake-token' })
    axios.get.mockImplementation((url) => {
      if (url.includes('/admin/managers')) {
        return Promise.resolve({
          data: [{ id: 1, name: 'Morgan Manager', email: 'manager@test.com', site_id: 1, site_name: 'Main Depot', is_active: true }],
        })
      }
      if (url.includes('/admin/sites')) {
        return Promise.resolve({ data: [{ site_id: 1, name: 'Main Depot', is_active: true }] })
      }
      return Promise.resolve({ data: [] })
    })

    render(
      <MemoryRouter>
        <AdminManagers />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Morgan Manager')).toBeInTheDocument()
    })
    expect(screen.getByText('Main Depot')).toBeInTheDocument()
  })

  it('Given the Admin fills the new manager form, When they submit, Then the manager is created', async () => {
    useAuth.mockReturnValue({ token: 'fake-token' })
    axios.get.mockImplementation((url) => {
      if (url.includes('/admin/managers')) {
        return Promise.resolve({ data: [] })
      }
      if (url.includes('/admin/sites')) {
        return Promise.resolve({ data: [{ site_id: 1, name: 'Main Depot', is_active: true }] })
      }
      return Promise.resolve({ data: [] })
    })
    axios.post.mockResolvedValue({ data: { id: 2, name: 'New Manager' } })

    render(
      <MemoryRouter>
        <AdminManagers />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('+ New Manager')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('+ New Manager'))
    await userEvent.type(screen.getByLabelText(/name/i), 'New Manager')
    await userEvent.type(screen.getByLabelText(/email/i), 'newmgr@test.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'NewMgrPass123!')
    await userEvent.selectOptions(screen.getByLabelText(/site/i), '1')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/admin/managers',
        expect.objectContaining({ name: 'New Manager' }),
        expect.anything()
      )
    })
  })
})
