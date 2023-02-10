import { render, screen } from '@testing-library/react';
import App from './App';
import VoiceBoxMain from "./components/VoiceBoxMain";

test('renders VoiceBox main component', () => {
  render(<VoiceBoxMain />);
  const linkElement = screen.getByText(/CharaChorder/i);
  expect(linkElement).toBeInTheDocument();
});
