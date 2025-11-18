import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CountySearchFilter from '../../components/CountySearchFilter';

describe('CountySearchFilter', () => {
  it('renders county search filter', () => {
    const mockOnSearch = vi.fn();
    render(<CountySearchFilter onSearch={mockOnSearch} />);

    expect(screen.getByText('County Search')).toBeInTheDocument();
    expect(screen.getByText('Select a county to scrape deed records')).toBeInTheDocument();
  });

  it('displays search button', () => {
    const mockOnSearch = vi.fn();
    render(<CountySearchFilter onSearch={mockOnSearch} />);

    const searchButton = screen.getByText('Search County Records');
    expect(searchButton).toBeInTheDocument();
  });

  it('search button is disabled when no county is selected', () => {
    const mockOnSearch = vi.fn();
    render(<CountySearchFilter onSearch={mockOnSearch} />);

    const searchButton = screen.getByText('Search County Records');
    expect(searchButton).toBeDisabled();
  });

  it('shows loading state when loading prop is true', () => {
    const mockOnSearch = vi.fn();
    render(<CountySearchFilter onSearch={mockOnSearch} loading={true} />);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });
});
