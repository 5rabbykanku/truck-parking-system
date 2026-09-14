import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'
import ManagerEmployees from './ManagerEmployees'
import { useAuth } from '../context/AuthContext'

vi.mock('axios')
vi.mock('../context/AuthContext')

describe('ManagerEmployees', () => {
  it('Given employees exist, When the Manager views the page, Then they are listed', async () => {
    useAuth.mockReturnValue({ token: 'fake-token' })
    axios.get.mockResolvedValue({
      data: [{ id: 1, name: 'Ellis Employee', email: 'employee@test.com', is_active: true, last_active_at: null }],
    })

    render(
      <MemoryRouter>
        <ManagerEmployees />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ellis Employee')).toBeInTheDocument()
    })
    expect(screen.getByText('Never')).toBeInTheDocument()
  })

  it('Given the Manager fills the new employee form, When they submit, Then the employee is created', async () => {
    useAuth.mockReturnValue({ token: 'fake-token' })
    axios.get.mockResolvedValue({ data: [] })
    axios.post.mockResolvedValue({ data: { id: 2, name: 'New Employee' } })

    render(
      <MemoryRouter>
        <ManagerEmployees />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('+ New Employee')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('+ New Employee'))
    await userEvent.type(screen.getByLabelText(/name/i), 'New Employee')
    await userEvent.type(screen.getByLabelText(/email/i), 'newemp@test.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'NewEmpPass123!')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/manager/employees',
        expect.objectContaining({ name: 'New Employee' }),
        expect.anything()
      )
    })
  })
})