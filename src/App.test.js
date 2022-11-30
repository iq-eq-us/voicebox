import { render, screen } from '@testing-library/react';
import App from './App';
import CyranoMain from "./components/CyranoMain";

test('renders Cyrano main component', () => {
  render(<CyranoMain />);
  const linkElement = screen.getByText(/Raymond Li/i);
  expect(linkElement).toBeInTheDocument();
});
