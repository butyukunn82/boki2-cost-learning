import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(Math.abs(v)).toLocaleString('ja-JP')}円`

export default function LaborVarianceLab() {
  const [standardRate, setStandardRate] = useState(1500)
  const [actualRate, setActualRate] = useState(1600)
  const [standardHours, setStandardHours] = useState(800)
  const [actualHours, setActualHours] = useState(880)

  const calc = useMemo(() => {
    const standardCost = standardRate * standardHours
    const middleCost = standardRate * actualHours
    const actualCost = actualRate * actualHours
    const rateVariance = actualCost - middleCost
    const efficiencyVariance = middleCost - standardCost
    const totalVariance = actualCost - standardCost
    return { standardCost, middleCost, actualCost, rateVariance, efficiencyVariance, totalVariance }
  }, [standardRate, actualRate, standardHours, actualHours])

  const maxRate = Math.max(standardRate, actualRate, 1)
  const maxHours = Math.max(standardHours, actualHours, 1)
  const rect = (rate: number, hours: number) => ({ width: 260 * hours / maxHours, height: 150 * rate / maxRate })
  const standardRect = rect(standardRate, standardHours)
  const middleRect = rect(standardRate, actualHours)
  const actualRect = rect(actualRate, actualHours)

  return <section className="labor-variance-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Visual Lab</p>
        <h2>直接労務費差異：賃率と時間を別々に見る</h2>
        <p>材料費差異と同じです。<strong>単価にあたるのが賃率、数量にあたるのが作業時間</strong>。中間状態を1つ入れると2つの差異に分けられます。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>標準原価計算 ＞ 直接労務費</strong>
        <span>何を？</span><strong>賃率差異 / 作業時間差異</strong>
        <span>なぜ？</span><strong>高い賃率で働いたのか、時間を使い過ぎたのかを分けるため</strong>
      </div>
    </header>

    <div className="variance-first-action"><span>問題を見たら、まず何を見る？</span><strong>標準賃率SR・実際賃率AR・標準時間SH・実際時間AHの4つを固定する。</strong></div>

    <div className="labor-layout">
      <aside className="labor-controls">
        <Range label="標準賃率 SR" value={standardRate} min={800} max={2600} step={100} suffix="円/時" onChange={setStandardRate} />
        <Range label="実際賃率 AR" value={actualRate} min={800} max={2600} step={100} suffix="円/時" onChange={setActualRate} />
        <Range label="標準時間 SH" value={standardHours} min={300} max={1400} step={20} suffix="時間" onChange={setStandardHours} />
        <Range label="実際時間 AH" value={actualHours} min={300} max={1400} step={20} suffix="時間" onChange={setActualHours} />
      </aside>

      <div className="labor-main">
        <div className="labor-steps">
          <CostCard title="標準" formula="SR × SH" value={calc.standardCost} />
          <b>→ 時間だけ実際へ</b>
          <CostCard title="中間" formula="SR × AH" value={calc.middleCost} />
          <b>→ 賃率も実際へ</b>
          <CostCard title="実際" formula="AR × AH" value={calc.actualCost} />
        </div>

        <div className="labor-rects">
          <Rect title="標準" width={standardRect.width} height={standardRect.height} rate={standardRate} hours={standardHours} />
          <Rect title="SR×AH" width={middleRect.width} height={middleRect.height} rate={standardRate} hours={actualHours} />
          <Rect title="実際" width={actualRect.width} height={actualRect.height} rate={actualRate} hours={actualHours} />
        </div>

        <div className="labor-results">
          <Variance label="作業時間差異" value={calc.efficiencyVariance} formula={`SR ${standardRate.toLocaleString('ja-JP')} × (AH ${actualHours} − SH ${standardHours})`} />
          <Variance label="賃率差異" value={calc.rateVariance} formula={`(AR ${actualRate.toLocaleString('ja-JP')} − SR ${standardRate.toLocaleString('ja-JP')}) × AH ${actualHours}`} />
          <Variance label="総差異" value={calc.totalVariance} formula="実際直接労務費 − 標準直接労務費" total />
        </div>

        <div className="labor-memory"><strong>反射：</strong><span>時間差異は賃率を標準に固定。賃率差異は実際時間AHを使う。材料差異の「価格↔賃率」「数量↔時間」と対応させる。</span></div>
      </div>
    </div>
  </section>
}

function CostCard({ title, formula, value }: { title: string; formula: string; value: number }) {
  return <div><span>{title}</span><b>{formula}</b><strong>{yen(value)}</strong></div>
}

function Rect({ title, width, height, rate, hours }: { title: string; width: number; height: number; rate: number; hours: number }) {
  return <article><span>{title}</span><div className="labor-rect-stage"><div className="labor-rect" style={{ width: `${Math.max(30, width)}px`, height: `${Math.max(30, height)}px` }} /></div><small>高さ 賃率{rate.toLocaleString('ja-JP')} / 幅 {hours}時間</small></article>
}

function Variance({ label, value, formula, total = false }: { label: string; value: number; formula: string; total?: boolean }) {
  const favorable = value < 0
  return <article className={total ? 'total' : ''}><span>{label}</span><strong>{yen(value)} <em>{value === 0 ? '差異なし' : favorable ? '有利' : '不利'}</em></strong><small>{formula}</small></article>
}

function Range({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="labor-range"><span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
