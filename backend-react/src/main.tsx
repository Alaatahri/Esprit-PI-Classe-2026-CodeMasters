import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.css'

const router = createBrowserRouter([{ path: '/*', element: <App /> }], {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- flag v7 absent des types RR 6.28
  future: { v7_startTransition: true } as any,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
