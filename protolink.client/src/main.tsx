import * as React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as ReactDOM from 'react-dom'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './ErrorBoundary'

const rootEl = document.getElementById('root')!

// Expose React and ReactDOM for dynamic view scripts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).React = React
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).ReactDOM = ReactDOM

// Global error handlers
window.addEventListener('error', (e) => {
  // eslint-disable-next-line no-console
  console.error('[window.error]', e.message, e.error)
})
window.addEventListener('unhandledrejection', (e) => {
  // eslint-disable-next-line no-console
  console.error('[unhandledrejection]', e.reason)
})

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
