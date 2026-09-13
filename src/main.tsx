import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ProcessCostLab from './features/ProcessCostLab'
import VarianceLab from './features/VarianceLab'
import OverheadVarianceLab from './features/OverheadVarianceLab'
import './styles/app.css'
import './styles/flow-fix.css'
import './styles/process-lab.css'
import './styles/variance-lab.css'
import './styles/overhead-lab.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <div className="standalone-lab">
      <ProcessCostLab />
      <VarianceLab />
      <OverheadVarianceLab />
    </div>
  </React.StrictMode>,
)
