import { createRoot } from 'react-dom/client';
import './index.css';
// @ts-ignore
import App from './app.tsx';

// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById('root')!).render(<App />);
