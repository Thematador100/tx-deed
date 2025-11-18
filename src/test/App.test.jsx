import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
  });

  it('displays the app container', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toHaveClass('min-h-screen');
  });
});
