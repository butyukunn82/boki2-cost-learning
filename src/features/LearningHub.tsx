import { useEffect, useMemo, useState, type ReactNode } from 'react'
import App from '../App'
import InstallPrompt from './InstallPrompt'
import ManufacturingCostReportLab from './ManufacturingCostReportLab'
import ProcessCostLab from './ProcessCostLab'
import ProcessMethodLab from './ProcessMethodLab'
import AdditionalMaterialLab from './AdditionalMaterialLab'
import SpoilageProcessLab from './SpoilageProcessLab'
import JobOrderCostLab from './JobOrderCostLab'
import GroupGradeCostLab from './GroupGradeCostLab'
import DepartmentAllocationLab from './DepartmentAllocationLab'
import VarianceLab from './VarianceLab'
import LaborVarianceLab from './LaborVarianceLab'
import OverheadVarianceLab from './OverheadVarianceLab'
import DirectCostingLab from './DirectCostingLab'
import CvpLab from './CvpLab'
import LearningDashboard from './LearningDashboard'
import MisconceptionReview from './MisconceptionReview'
import FirstMoveTrainer from './FirstMoveTrainer'
import CorePatternTrainer from './CorePatternTrainer'
import CbtPractice from './CbtPractice'

type Mode = 'learn' | 'lab' | 'train' | 'exam'

type Topic = {
  id: string
  title: string
  subtitle: string
  component: ReactNode
}

const modeInfo: Record<Mode, { label: string; description: string }> = {
  learn: { label: '学ぶ', description: '現在地とつながりを理解する' },
  lab: { label: '動かす', description: '数字を触って現象を確かめる' },
  train: { label: '鍛える', description: '弱点を見て、初動・仕訳・解く順番を反射化する' },
  exam: { label: '本番', description: '補助を消してCBT形式で解く' },
}

export default function LearningHub() {
  const topics = useMemo<Record<Mode, Topic[]>>(() => ({
    learn: [
      { id: 'journey', title: '原価の旅', subtitle: '材料→仕掛品→製品→売上原価', component: <App /> },
      { id: 'mcr', title: '製造原価報告書', subtitle: '仕掛品T勘定と完成品原価をつなぐ', component: <ManufacturingCostReportLab /> },
      { id: 'job-order', title: '個別原価計算', subtitle: '製造指図書ごとに原価を集める', component: <JobOrderCostLab /> },
      { id: 'process', title: '総合原価計算', subtitle: '数量と完成品換算量', component: <ProcessCostLab /> },
      { id: 'methods', title: '平均法 vs FIFO', subtitle: '混ぜるか、分けるか', component: <ProcessMethodLab /> },
      { id: 'additional-material', title: '追加材料', subtitle: '投入点と完成品換算量', component: <AdditionalMaterialLab /> },
      { id: 'spoilage-process', title: '正常仕損・工程別', subtitle: '負担先と前工程費の引継ぎ', component: <SpoilageProcessLab /> },
      { id: 'group-grade', title: '組別・等級別', subtitle: '種類で分ける / 等価係数で分ける', component: <GroupGradeCostLab /> },
      { id: 'department', title: '部門別計算', subtitle: '簡便法の相互配賦', component: <DepartmentAllocationLab /> },
    ],
    lab: [
      { id: 'material-variance', title: '材料費差異', subtitle: '価格差異・数量差異', component: <VarianceLab /> },
      { id: 'labor-variance', title: '労務費差異', subtitle: '賃率差異・作業時間差異', component: <LaborVarianceLab /> },
      { id: 'overhead-variance', title: 'シュラッター図', subtitle: '製造間接費差異', component: <OverheadVarianceLab /> },
      { id: 'direct-costing', title: '全部原価 vs 直接原価', subtitle: '固定製造間接費の居場所', component: <DirectCostingLab /> },
      { id: 'cvp', title: 'CVP', subtitle: '損益分岐点を動かす', component: <CvpLab /> },
    ],
    train: [
      { id: 'dashboard', title: '学習ダッシュボード', subtitle: '速度・弱点・CBTを一画面で', component: <LearningDashboard /> },
      { id: 'misconception', title: '弱点復習', subtitle: '誤概念を15秒で矯正', component: <MisconceptionReview /> },
      { id: 'first-move', title: '初動反射', subtitle: '最初の一手を3〜5秒で', component: <FirstMoveTrainer /> },
      { id: 'core-patterns', title: '工業簿記30型', subtitle: '仕訳12型＋解き順18型', component: <CorePatternTrainer /> },
    ],
    exam: [
      { id: 'cbt', title: 'CBT Practice', subtitle: '90分・5題・見直し', component: <CbtPractice /> },
    ],
  }), [])

  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem('boki2-hub-mode') as Mode | null
    return saved && modeInfo[saved] ? saved : 'learn'
  })
  const [topicId, setTopicId] = useState(() => localStorage.getItem('boki2-hub-topic') ?? 'journey')

  const modeTopics = topics[mode]
  const activeTopic = modeTopics.find((t) => t.id === topicId) ?? modeTopics[0]

  useEffect(() => {
    localStorage.setItem('boki2-hub-mode', mode)
    localStorage.setItem('boki2-hub-topic', activeTopic.id)
  }, [mode, activeTopic.id])

  const changeMode = (next: Mode) => {
    setMode(next)
    setTopicId(topics[next][0].id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changeTopic = (id: string) => {
    setTopicId(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="learning-hub">
    <header className="hub-top">
      <div>
        <p className="eyebrow">簿記2級 工業簿記・原価計算</p>
        <h1>原価が見える学習室</h1>
        <p>どこにいるかを見失わず、理解 → 操作 → 反射 → CBTまで同じアプリで進めます。</p>
      </div>
      <div className="hub-state"><span>現在のモード</span><strong>{modeInfo[mode].label}</strong><small>{modeInfo[mode].description}</small></div>
    </header>

    <InstallPrompt />

    <nav className="hub-modes" aria-label="学習モード">
      {(Object.keys(modeInfo) as Mode[]).map((key) => <button key={key} className={mode === key ? 'active' : ''} onClick={() => changeMode(key)}><strong>{modeInfo[key].label}</strong><span>{modeInfo[key].description}</span></button>)}
    </nav>

    <div className="hub-layout">
      <aside className="hub-topics">
        <div className="hub-topic-heading"><span>{modeInfo[mode].label}</span><b>{modeTopics.length}コンテンツ</b></div>
        {modeTopics.map((topic, i) => <button key={topic.id} className={activeTopic.id === topic.id ? 'active' : ''} onClick={() => changeTopic(topic.id)}><em>{String(i + 1).padStart(2, '0')}</em><div><strong>{topic.title}</strong><span>{topic.subtitle}</span></div></button>)}
      </aside>

      <main className="hub-content">
        <div className="hub-breadcrumb"><span>{modeInfo[mode].label}</span><i>›</i><strong>{activeTopic.title}</strong></div>
        {activeTopic.component}
      </main>
    </div>
  </div>
}
