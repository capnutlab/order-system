import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppTrial from './AppTrial.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppTrial />
  </StrictMode>,
)
