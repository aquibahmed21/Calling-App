import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CallingApp from './CallingApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CallingApp />
  </StrictMode>,
)
