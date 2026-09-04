import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import SessionLookup from './SessionLookup'
import { useAuth } from '../context/AuthContext'

vi.mock('axios')
vi.mock('../context/AuthContext')

describe('SessionLookup', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ token: 'fake-token' })
  })

    it('Given a valid active code, When the employee looks it up, Then session details are shown with an Active badge', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          parking_code: '123456',
          status: 'active',
          entry_time: '2026-08-31T10:00:00',
          exit_time: null,
          truck: { plate_number: 'TRK-001', truck_type: 'Flatbed' },
          driver: { name: 'John Doe', phone_number: '555-1234' },
        },
      })
      .mockResolvedValueOnce({ data: { calculated_fee: 10.0 } })

    render(<SessionLookup />)

    await userEvent.type(screen.getByLabelText(/parking code/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
    expect(screen.getByText(/TRK-001/)).toBeInTheDocument()
    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
  })
  it('Given an active session, When the employee confirms payment, Then a success message is shown', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          parking_code: '123456',
          status: 'active',
          entry_time: '2026-08-31T10:00:00',
          exit_time: null,
          truck: { plate_number: 'TRK-001', truck_type: 'Flatbed' },
          driver: { name: 'John Doe', phone_number: '555-1234' },
        },
      })
      .mockResolvedValueOnce({ data: { calculated_fee: 10.0 } })

    axios.post.mockResolvedValue({
      data: {
        parking_code: '123456',
        fee_amount: 10.0,
        payment_method: 'cash',
        payment_confirmed_at: '2026-08-31T12:00:00',
      },
    })

    render(<SessionLookup />)

    await userEvent.type(screen.getByLabelText(/parking code/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm payment/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /confirm payment/i }))

    await waitFor(() => {
      expect(screen.getByText(/payment confirmed/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /confirm payment/i })).not.toBeInTheDocument()
  })

  it('Given payment confirmation fails, When the employee confirms payment, Then an error message is shown', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          parking_code: '123456',
          status: 'active',
          entry_time: '2026-08-31T10:00:00',
          exit_time: null,
          truck: { plate_number: 'TRK-001', truck_type: 'Flatbed' },
          driver: { name: 'John Doe', phone_number: '555-1234' },
        },
      })
      .mockResolvedValueOnce({ data: { calculated_fee: 10.0 } })

    axios.post.mockRejectedValue({
      response: { data: { error: 'This session has already been paid' } },
    })

    render(<SessionLookup />)

    await userEvent.type(screen.getByLabelText(/parking code/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm payment/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /confirm payment/i }))

    await waitFor(() => {
      expect(screen.getByText('This session has already been paid')).toBeInTheDocument()
    })
  })
    it('Given a completed session code, When the employee looks it up, Then a Completed badge is shown', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          parking_code: '654321',
          status: 'completed',
          entry_time: '2026-08-31T10:00:00',
          exit_time: '2026-08-31T14:00:00',
          truck: { plate_number: 'TRK-002', truck_type: 'Box Truck' },
          driver: { name: 'Jane Doe', phone_number: '555-9999' },
        },
      })
      .mockResolvedValueOnce({ data: { calculated_fee: 40.0 } })

    render(<SessionLookup />)

    await userEvent.type(screen.getByLabelText(/parking code/i), '654321')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })
  })

  it('Given a code with no matching session, When the employee looks it up, Then an error message is shown', async () => {
    axios.get.mockRejectedValue({
      response: { data: { error: 'No session found with that code' } },
    })

    render(<SessionLookup />)

    await userEvent.type(screen.getByLabelText(/parking code/i), '000000')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => {
            expect(screen.getByText('No session found with that code')).toBeInTheDocument()
    })
  })

    it('Given completed results, When the employee clicks New Lookup, Then the form resets', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          parking_code: '111111',
          status: 'active',
          entry_time: '2026-08-31T10:00:00',
          exit_time: null,
          truck: { plate_number: 'TRK-003', truck_type: 'Flatbed' },
          driver: { name: 'Sam Smith', phone_number: '555-0000' },
        },
      })
      .mockResolvedValueOnce({ data: { calculated_fee: 10.0 } })

    render(<SessionLookup />)

    await userEvent.type(screen.getByLabelText(/parking code/i), '111111')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /new lookup/i }))

    expect(screen.getByLabelText(/parking code/i)).toHaveValue('')
  })
})