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

it('Given an existing site, When the Admin clicks Edit and saves, Then the site is updated', async () => {
  useAuth.mockReturnValue({ token: 'fake-token' })
  axios.get.mockResolvedValue({
    data: [{ site_id: 1, name: 'Main Depot', total_spaces: 50, hourly_rate: 10, daily_rate: 50, is_active: true }],
  })
  axios.put.mockResolvedValue({ data: { id: 1, name: 'Main Depot Updated' } })

  render(
    <MemoryRouter>
      <AdminSites />
    </MemoryRouter>
  )

  await waitFor(() => {
    expect(screen.getByText('Main Depot')).toBeInTheDocument()
  })

  await userEvent.click(screen.getByRole('button', { name: /edit/i }))
  const nameInput = screen.getByLabelText(/^name$/i)
  await userEvent.clear(nameInput)
  await userEvent.type(nameInput, 'Main Depot Updated')
  await userEvent.click(screen.getByRole('button', { name: /save/i }))

  await waitFor(() => {
    expect(axios.put).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/admin/sites/1',
      expect.objectContaining({ name: 'Main Depot Updated' }),
      expect.anything()
    )
  })
})

it('Given an existing site, When the Admin clicks Deactivate, Then the site is deactivated', async () => {
  useAuth.mockReturnValue({ token: 'fake-token' })
  axios.get.mockResolvedValue({
    data: [{ site_id: 1, name: 'Main Depot', total_spaces: 50, hourly_rate: 10, daily_rate: 50, is_active: true }],
  })
  axios.delete.mockResolvedValue({ data: { id: 1, is_active: false } })

  render(
    <MemoryRouter>
      <AdminSites />
    </MemoryRouter>
  )

  await waitFor(() => {
    expect(screen.getByText('Main Depot')).toBeInTheDocument()
  })

  await userEvent.click(screen.getByRole('button', { name: /deactivate/i }))

  await waitFor(() => {
    expect(axios.delete).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/admin/sites/1',
      expect.anything()
    )
  })
})