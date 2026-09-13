import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`

type Job = {
  id: string
  material: number
  laborHours: number
  laborRate: number
  completed: boolean
  units: number
}

export default function JobOrderCostLab() {
  const [overheadRate, setOverheadRate] = useState(1800)
  const [job101, setJob101] = useState<Job>({ id: 'No.101', material: 180000, laborHours: 80, laborRate: 2200, completed: true, units: 100 })
  const [job102, setJob102] = useState<Job>({ id: 'No.102', material: 120000, laborHours: 55, laborRate: 2200, completed: false, units: 80 })

  const jobs = useMemo(() => [calcJob(job101, overheadRate), calcJob(job102, overheadRate)], [job101, job102, overheadRate])
  const wip = jobs.filter((j) => !j.completed).reduce((s, j) => s + j.total, 0)
  const finished = jobs.filter((j) => j.completed).reduce((s, j) => s + j.total, 0)

  return <section className="job-order-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Visual Lab 08</p>
        <h2>個別原価計算：製造指図書ごとに原価を集める</h2>
        <p>「製造指図書」が出たら、月全体で平均するのではなく<strong>仕事番号ごとに原価を集める</strong>。完成した指図書だけが製品へ移ります。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>仕掛品 ＞ 個別原価計算 ＞ 製造指図書</strong>
        <span>何を？</span><strong>製品・注文ごとの原価を集計</strong>
        <span>なぜ？</span><strong>どの仕事にいくらかかったかを特定するため</strong>
      </div>
    </header>

    <div className="job-first-action"><span>問題文を見たら？</span><strong>「製造指図書」「注文別」「Job No.」を見たら、指図書別に直接費を集め、製造間接費を配賦する。</strong></div>

    <div className="job-controls">
      <label><span>製造間接費予定配賦率</span><b>{yen(overheadRate)} / 直接作業時間</b><input type="range" min="800" max="3000" step="100" value={overheadRate} onChange={(e) => setOverheadRate(Number(e.target.value))} /></label>
    </div>

    <div className="job-grid">
      <JobCard job={job101} calc={jobs[0]} onChange={setJob101} />
      <JobCard job={job102} calc={jobs[1]} onChange={setJob102} />
    </div>

    <div className="job-account-flow">
      <div><span>仕掛品に残る</span><strong>{yen(wip)}</strong><small>未完成の指図書</small></div>
      <b>完成すると →</b>
      <div><span>製品へ移る</span><strong>{yen(finished)}</strong><small>完成済み指図書</small></div>
    </div>

    <div className="job-memory"><b>反射：</b><span>個別原価計算＝「指図書が箱」。直接材料費・直接労務費・配賦した製造間接費を、その箱へ集める。</span></div>
  </section>
}

function calcJob(job: Job, overheadRate: number) {
  const directLabor = job.laborHours * job.laborRate
  const overhead = job.laborHours * overheadRate
  const total = job.material + directLabor + overhead
  return { ...job, directLabor, overhead, total, unitCost: total / Math.max(job.units, 1) }
}

function JobCard({ job, calc, onChange }: { job: Job; calc: ReturnType<typeof calcJob>; onChange: (j: Job) => void }) {
  const patch = (key: keyof Job, value: number | boolean) => onChange({ ...job, [key]: value })
  return <article className={job.completed ? 'job-card completed' : 'job-card in-progress'}>
    <header><div><span>製造指図書</span><strong>{job.id}</strong></div><button onClick={() => patch('completed', !job.completed)}>{job.completed ? '完成済 → 製品' : '製造中 → 仕掛品'}</button></header>
    <div className="job-inputs">
      <JRange label="直接材料費" value={job.material} min={50000} max={300000} step={10000} suffix="円" onChange={(v) => patch('material', v)} />
      <JRange label="直接作業時間" value={job.laborHours} min={10} max={150} step={5} suffix="時間" onChange={(v) => patch('laborHours', v)} />
      <JRange label="賃率" value={job.laborRate} min={1200} max={3500} step={100} suffix="円" onChange={(v) => patch('laborRate', v)} />
      <JRange label="完成数量" value={job.units} min={10} max={200} step={10} suffix="個" onChange={(v) => patch('units', v)} />
    </div>
    <div className="job-cost-stack">
      <p><span>直接材料費</span><b>{yen(calc.material)}</b></p>
      <p><span>直接労務費</span><b>{yen(calc.directLabor)}</b></p>
      <p><span>製造間接費（予定配賦）</span><b>{yen(calc.overhead)}</b></p>
      <strong>指図書原価 {yen(calc.total)}</strong>
      <small>単位原価 {yen(calc.unitCost)} / 個</small>
    </div>
  </article>
}

function JRange({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="job-range"><span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
