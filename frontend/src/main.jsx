import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { normalizePath } from './routes'
import './styles.css'
import './motion.css'
import './service-design.css'

const root = document.getElementById('root')
const app = <React.StrictMode><App /></React.StrictMode>
if (root.dataset.page === normalizePath(window.location.pathname)) ReactDOM.hydrateRoot(root, app)
else ReactDOM.createRoot(root).render(app)

