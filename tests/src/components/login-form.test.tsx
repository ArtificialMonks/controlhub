// src/test/components/login-form.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'

// Mock the login action
vi.mock('@/lib/actions/auth', () => ({
  login: vi.fn(),
}))

describe('LoginForm', () => {
  it('should render login form elements', () => {
    render(<LoginForm />)
    
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('should show validation error for short password', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(passwordInput, '123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const { login } = await import('@/lib/actions/auth')
    
    render(<LoginForm />)
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should toggle password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
    
    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle to hide password again
    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
