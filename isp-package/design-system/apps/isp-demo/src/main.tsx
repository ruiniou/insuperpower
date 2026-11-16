import { createRoot } from 'react-dom/client';
import 'remixicon/fonts/remixicon.css';
import '../../../packages/tokens/dist/tokens.css';
import '../../../packages/react/src/styles';
import '../../../packages/isp/src/styles';
import './app.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
