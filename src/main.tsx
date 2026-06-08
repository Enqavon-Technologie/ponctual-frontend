import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './i18n/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InterviewRoom } from './components/InterviewRoom';
import { BabysitterContractView } from './components/BabysitterContractView';

// Standalone routes opened via emailed links (no account, outside the app shell):
//  - /interview/:channel       → the video-interview room
//  - /babysitter-contract/:id  → the babysitter's contract signing page
const interviewMatch = window.location.pathname.match(/^\/interview\/([^/]+)/);
const babysitterContractMatch = window.location.pathname.match(/^\/babysitter-contract\/(\d+)/);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        {interviewMatch
          ? <InterviewRoom channel={decodeURIComponent(interviewMatch[1])} />
          : babysitterContractMatch
            ? <BabysitterContractView choiceId={parseInt(babysitterContractMatch[1], 10)} />
            : <App />}
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
