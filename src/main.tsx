import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ProcessCostLab from './features/ProcessCostLab'
import VarianceLab from './features/VarianceLab'
import OverheadVarianceLab from './features/OverheadVarianceLab'
import DirectCostingLab from './features/DirectCostingLab'
import CvpLab from './features/CvpLab'
import FirstMoveTrainer from './features/FirstMoveTrainer'
import CorePatternTrainer from './features/CorePatternTrainer'
import ProcessMethodLab from './features/ProcessMethodLab'
import DepartmentAllocationLab from './features/DepartmentAllocationLab'
import CbtPractice from './features/CbtPractice'
import './styles/app.css'
import './styles/flow-fix.css'
import './styles/process-lab.css'
import './styles/process-method-lab.css'
import './styles/variance-lab.css'
import './styles/overhead-lab.css'
import './styles/direct-costing-lab.css'
import './styles/cvp-lab.css'
import './styles/first-move-trainer.css'
import './styles/core-pattern-trainer.css'
import './styles/department-lab.css'
import './styles/cbt-practice.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <div className="standalone-lab">
      <ProcessCostLab />
      <ProcessMethodLab />
      <DepartmentAllocationLab />
      <VarianceLab />
      <OverheadVarianceLab />
      <DirectCostingLab />
      <CvpLab />
      <FirstMoveTrainer />
      <CorePatternTrainer />
      <CbtPractice />
    </div>
  </React.StrictMode>,
)
