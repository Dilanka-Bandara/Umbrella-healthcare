import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // 🚨 THIS IS THE MAGIC LINE! It connects Tailwind to your app.
import { StoreCartProvider } from './context/StoreCartContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* StoreCartProvider makes the pharmacy cart available across the whole app */}
    <StoreCartProvider>
      <App />
    </StoreCartProvider>
  </React.StrictMode>,
)