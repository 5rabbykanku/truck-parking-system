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

it('Given an existing manager, When the Admin clicks Edit and saves, Then the manager is updated', async () => {
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
  axios.put.mockResolvedValue({ data: { id: 1, name: 'Morgan Updated' } })

  render(
    <MemoryRouter>
      <AdminManagers />
    </MemoryRouter>
  )

  await waitFor(() => {
    expect(screen.getByText('Morgan Manager')).toBeInTheDocument()
  })

  await userEvent.click(screen.getByRole('button', { name: /edit/i }))
  const nameInput = screen.getByLabelText(/^name$/i)
  await userEvent.clear(nameInput)
  await userEvent.type(nameInput, 'Morgan Updated')
  await userEvent.click(screen.getByRole('button', { name: /save/i }))

  await waitFor(() => {
    expect(axios.put).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/admin/managers/1',
      expect.objectContaining({ name: 'Morgan Updated' }),
      expect.anything()
    )
  })
})

it('Given an existing manager, When the Admin clicks Deactivate, Then the manager is deactivated', async () => {
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
  axios.delete.mockResolvedValue({ data: { id: 1, is_active: false } })

  render(
    <MemoryRouter>
      <AdminManagers />
    </MemoryRouter>
  )

  await waitFor(() => {
    expect(screen.getByText('Morgan Manager')).toBeInTheDocument()
  })

  await userEvent.click(screen.getByRole('button', { name: /deactivate/i }))

  await waitFor(() => {
    expect(axios.delete).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/admin/managers/1',
      expect.anything()
    )
  })
})