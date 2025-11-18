import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';

// Mock the auth context
vi.mock('../../contexts/SupabaseAuthContext', () => ({
  useAuth: () => ({
    user: null,
    signIn: vi.fn(),
  }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('displays sign in button', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
  });

  it('has link to register page', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const registerLink = screen.getByText('Sign up');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});
