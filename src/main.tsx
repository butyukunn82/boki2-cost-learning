import React from 'react'
import ReactDOM from 'react-dom/client'
import LearningHub from './features/LearningHub'
import './styles/app.css'
import './styles/flow-fix.css'
import './styles/process-lab.css'
import './styles/process-method-lab.css'
import './styles/department-lab.css'
import './styles/variance-lab.css'
import './styles/overhead-lab.css'
import './styles/direct-costing-lab.css'
import './styles/cvp-lab.css'
import './styles/first-move-trainer.css'
import './styles/core-pattern-trainer.css'
import './styles/cbt-practice.css'
import './styles/learning-hub.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LearningHub />
  </React.StrictMode>,
)
