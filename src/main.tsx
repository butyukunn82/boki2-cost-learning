import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ProcessCostLab from './features/ProcessCostLab'
import './styles/app.css'
import './styles/flow-fix.css'
import './styles/process-lab.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <div className="standalone-lab">
      <ProcessCostLab />
    </div>
  </React.StrictMode>,
)
