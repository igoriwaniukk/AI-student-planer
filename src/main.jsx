import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isNativeApp } from './lib/nativeBridge'

if (isNativeApp()) document.documentElement.classList.add('native-app')

// /privacy/ and /support/ are static pages (public/*/index.html). A server
// that answers "/privacy" with this app instead gets sent there.
const staticPage = /^\/(privacy|support)$/.exec(window.location.pathname)
if (staticPage) {
  window.location.replace('/' + staticPage[1] + '/' + window.location.search)
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
