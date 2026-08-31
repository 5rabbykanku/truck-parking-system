import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import EntryForm from './EntryForm'
import { useAuth } from '../context/AuthContext'

vi.mock('axios')
vi.mock('../context/AuthContext')

describe('EntryForm', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'fake-token' })
  })

  it('Given valid entry details, When the employee submits the form, Then the parking code and QR code are displayed', async () => {
    axios.post.mockResolvedValue({
      data: {
        parking_code: '123456',
        qr_code_data: 'data:image/png;base64,fakeqrdata',
        status: 'active',
      },
    })

    render(<EntryForm />)

    await userEvent.type(screen.getByLabelText(/driver name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-1234')
    await userEvent.type(screen.getByLabelText(/plate number/i), 'TRK-001')
    await userEvent.type(screen.getByLabelText(/truck type/i), 'Flatbed')
    await userEvent.click(screen.getByRole('button', { name: /submit entry/i }))

    await waitFor(() => {
      expect(screen.getByText('123456')).toBeInTheDocument()
    })
    expect(screen.getByAltText(/qr code/i)).toBeInTheDocument()
  })

  it('Given the backend returns an error, When the employee submits the form, Then an error message is shown', async () => {
    axios.post.mockRejectedValue({
      response: { data: { error: 'plate_number is required' } },
    })

    render(<EntryForm />)

    await userEvent.type(screen.getByLabelText(/driver name/i), 'John Doe')
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-1234')
    await userEvent.type(screen.getByLabelText(/plate number/i), 'TRK-001')
    await userEvent.type(screen.getByLabelText(/truck type/i), 'Flatbed')
    await userEvent.click(screen.getByRole('button', { name: /submit entry/i }))

    await waitFor(() => {
      expect(screen.getByText('plate_number is required')).toBeInTheDocument()
    })
  })

  it('Given a completed entry, When the employee clicks New Entry, Then the form resets', async () => {
    axios.post.mockResolvedValue({
      data: {
        parking_code: '654321',
        qr_code_data: 'data:image/png;base64,fakeqrdata',
        status: 'active',
      },
    })

    render(<EntryForm />)

    await userEvent.type(screen.getByLabelText(/driver name/i), 'Jane Doe')
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-9999')
    await userEvent.type(screen.getByLabelText(/plate number/i), 'TRK-002')
    await userEvent.type(screen.getByLabelText(/truck type/i), 'Box Truck')
    await userEvent.click(screen.getByRole('button', { name: /submit entry/i }))

    await waitFor(() => {
      expect(screen.getByText('654321')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /new entry/i }))

    expect(screen.getByLabelText(/driver name/i)).toHaveValue('')
    expect(screen.getByRole('button', { name: /submit entry/i })).toBeInTheDocument()
  })
})
