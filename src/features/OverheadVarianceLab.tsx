import { useMemo, useState } from 'react'

type EfficiencyMode = 'variable-only' | 'both'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`
const hour = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}h`

export default function OverheadVarianceLab() {
  const [variableRate, setVariableRate] = useState(300)
  const [fixedBudget, setFixedBudget] = useState(240000)
  const [baseHours, setBaseHours] = useState(800)
  const [actualHours, setActualHours] = useState(760)
  const [standardHours, setStandardHours] = useState(720)
  const [actualOverhead, setActualOverhead] = useState(485000)
  const [mode, setMode] = useState<EfficiencyMode>('variable-only')

  const calc = useMemo(() => {
    const fixedRate = fixedBudget / Math.max(baseHours, 1)
    const standardRate = variableRate + fixedRate
    const budgetAllowance = fixedBudget + variableRate * actualHours
    const standardApplied = standardRate * standardHours
    const budgetVariance = actualOverhead - budgetAllowance

    const efficiencyVariance = mode === 'variable-only'
      ? variableRate * (actualHours - standardHours)
      : standardRate * (actualHours - standardHours)

    const volumeVariance = mode === 'variable-only'
      ? fixedRate * (baseHours - standardHours)
      : fixedRate * (baseHours - actualHours)

    const totalVariance = actualOverhead - standardApplied
    const recomposed = budgetVariance + efficiencyVariance + volumeVariance

    return {
      fixedRate,
      standardRate,
      budgetAllowance,
      standardApplied,
      budgetVariance,
      efficiencyVariance,
      volumeVariance,
      totalVariance,
      recomposed,
    }
  }, [variableRate, fixedBudget, baseHours, actualHours, standardHours, actualOverhead, mode])

  const maxHours = Math.max(baseHours, actualHours, standardHours, 1) * 1.12
  const maxCost = Math.max(
    actualOverhead,
    fixedBudget + variableRate * maxHours,
    calc.standardRate * maxHours,
    1,
  ) * 1.08

  const W = 580
  const H = 330
  const left = 72
  const top = 22
  const innerW = 455
  const innerH = 240
  const x = (h: number) => left + (h / maxHours) * innerW
  const y = (cost: number) => top + innerH - (cost / maxCost) * innerH
  const flexibleAt = (h: number) => fixedBudget + variableRate * h
  const appliedAt = (h: number) => calc.standardRate * h

  return (
    <section className="overhead-lab panel">
      <header className="lab-heading">
        <div>
          <p className="eyebrow">Visual Lab 03</p>
          <h2>製造間接費差異：シュラッター図を「どこの何か」から理解する</h2>
          <p>これは会社全体の利益の図ではありません。<strong>製造原価の中の「製造間接費」だけ</strong>を、標準と実際で比べています。</p>
        </div>
        <div className="lab-location">
          <span>どこ？</span><strong>製造原価 ＞ 製造間接費 ＞ 標準原価計算</strong>
          <span>何を？</span><strong>実際発生額と標準配賦額のズレを3つに分解</strong>
          <span>なぜ？</span><strong>予算・作業効率・工場の稼働量のどこに原因があるかを見る</strong>
        </div>
      </header>

      <div className="variance-first-action">
        <span>問題文を見たら、まず何を見る？</span>
        <strong>①変動費率 ②固定費予算 ③基準操業度 ④実際操業度 ⑤標準操業度 ⑥実際発生額。最初にこの6つを図へ置く。</strong>
      </div>

      <div className="efficiency-switch">
        <span>能率差異をどこまで含める？</span>
        <button className={mode === 'variable-only' ? 'active' : ''} onClick={() => setMode('variable-only')}>変動費のみ</button>
        <button className={mode === 'both' ? 'active' : ''} onClick={() => setMode('both')}>変動費＋固定費</button>
        <small>{mode === 'variable-only' ? '操業度差異は「基準−標準」の固定費部分になります。' : '操業度差異は「基準−実際」の固定費部分になります。'}</small>
      </div>

      <div className="overhead-layout">
        <aside className="variance-controls">
          <h3>条件を動かす</h3>
          <OHRange label="変動費率" value={variableRate} min={50} max={700} step={10} suffix="円/h" onChange={setVariableRate} />
          <OHRange label="固定費予算" value={fixedBudget} min={80000} max={500000} step={10000} suffix="円" onChange={setFixedBudget} />
          <OHRange label="基準操業度" value={baseHours} min={400} max={1200} step={20} suffix="h" onChange={setBaseHours} />
          <OHRange label="実際操業度" value={actualHours} min={300} max={1200} step={20} suffix="h" onChange={setActualHours} />
          <OHRange label="標準操業度" value={standardHours} min={300} max={1200} step={20} suffix="h" onChange={setStandardHours} />
          <OHRange label="実際発生額" value={actualOverhead} min={150000} max={900000} step={10000} suffix="円" onChange={setActualOverhead} />
          <div className="oh-rate-summary">
            <span>固定費率</span><b>{yen(calc.fixedRate)}/h</b>
            <span>標準配賦率</span><b>{yen(calc.standardRate)}/h</b>
          </div>
        </aside>

        <div className="overhead-chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="製造間接費差異を示す動くシュラッター図">
            <line x1={left} y1={top + innerH} x2={left + innerW + 8} y2={top + innerH} className="axis" />
            <line x1={left} y1={top + innerH} x2={left} y2={top - 4} className="axis" />
            <text x={left + innerW / 2} y={315} className="axis-label">操業度・作業時間</text>
            <text x={18} y={top + innerH / 2} className="axis-label vertical">製造間接費</text>

            <line x1={left} y1={y(fixedBudget)} x2={left + innerW} y2={y(flexibleAt(maxHours))} className="budget-line" />
            <line x1={left} y1={top + innerH} x2={left + innerW} y2={y(appliedAt(maxHours))} className="applied-line" />
            <line x1={left} y1={y(fixedBudget)} x2={left + innerW} y2={y(fixedBudget)} className="fixed-line" />

            <line x1={x(actualHours)} y1={top} x2={x(actualHours)} y2={top + innerH} className="guide actual-guide" />
            <line x1={x(standardHours)} y1={top} x2={x(standardHours)} y2={top + innerH} className="guide standard-guide" />
            <line x1={x(baseHours)} y1={top} x2={x(baseHours)} y2={top + innerH} className="guide base-guide" />

            <circle cx={x(actualHours)} cy={y(actualOverhead)} r="6" className="actual-point" />
            <line x1={x(actualHours)} y1={y(actualOverhead)} x2={x(actualHours)} y2={y(calc.budgetAllowance)} className="variance-gap budget-gap" />

            <line x1={x(actualHours)} y1={y(flexibleAt(actualHours))} x2={x(standardHours)} y2={y(flexibleAt(standardHours))} className="variance-gap efficiency-gap" />

            <text x={x(actualHours) + 8} y={y(actualOverhead) - 8} className="point-label">実際発生額 {yen(actualOverhead)}</text>
            <text x={x(actualHours)} y={286} textAnchor="middle" className="tick actual-text">実際 {actualHours}h</text>
            <text x={x(standardHours)} y={301} textAnchor="middle" className="tick standard-text">標準 {standardHours}h</text>
            <text x={x(baseHours)} y={316} textAnchor="middle" className="tick base-text">基準 {baseHours}h</text>
          </svg>

          <div className="schlatter-legend">
            <div><i className="legend-line budget" /><span>予算許容額 = 固定費予算 + 変動費率×操業度</span></div>
            <div><i className="legend-line applied" /><span>標準配賦額 = 標準配賦率×標準操業度</span></div>
            <div><i className="legend-line fixed" /><span>固定費予算額</span></div>
          </div>

          <div className="oh-meaning">
            <b>この図の正体</b>
            <p><strong>横：</strong>どれだけ工場を動かしたか。 <strong>縦：</strong>製造間接費がいくらかかったか。</p>
            <p>実際発生額から標準配賦額までのズレを、途中の線や操業度を使って3つに切り分けています。</p>
          </div>
        </div>
      </div>

      <div className="variance-results overhead-results">
        <OHVarianceCard title="予算差異" amount={calc.budgetVariance} formula="実際発生額 − 予算許容額" meaning="同じ実際操業度なのに、予算より製造間接費を使ったか" />
        <OHVarianceCard title="能率差異" amount={calc.efficiencyVariance} formula={mode === 'variable-only' ? '変動費率 × (実際 − 標準)' : '標準配賦率 × (実際 − 標準)'} meaning="標準時間より多く・少なく作業した影響" />
        <OHVarianceCard title="操業度差異" amount={calc.volumeVariance} formula={mode === 'variable-only' ? '固定費率 × (基準 − 標準)' : '固定費率 × (基準 − 実際)'} meaning="工場を基準どおり稼働できなかった固定費の影響" />
      </div>

      <div className="oh-reconcile">
        <div><span>実際発生額</span><strong>{yen(actualOverhead)}</strong></div>
        <b>−</b>
        <div><span>標準配賦額</span><strong>{yen(calc.standardApplied)}</strong></div>
        <b>=</b>
        <div><span>総差異</span><strong>{yen(Math.abs(calc.totalVariance))} {varianceLabel(calc.totalVariance)}</strong></div>
        <small>3差異の合計：{yen(Math.abs(calc.recomposed))} {varianceLabel(calc.recomposed)}</small>
      </div>

      <div className="variance-memory-rule">
        <strong>反射用：</strong>
        <span>予算＝縦のズレ、能率＝実際時間と標準時間のズレ、操業度＝固定費を回収できる稼働量のズレ。</span>
      </div>
    </section>
  )
}

function OHRange({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="variance-range">
    <span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
}

function OHVarianceCard({ title, amount, formula, meaning }: { title: string; amount: number; formula: string; meaning: string }) {
  return <article className={amount > 0 ? 'variance-card unfavorable' : amount < 0 ? 'variance-card favorable' : 'variance-card'}>
    <span>{title}</span><small>{formula}</small><strong>{yen(Math.abs(amount))}</strong><b>{varianceLabel(amount)}</b><p>{meaning}</p>
  </article>
}

function varianceLabel(value: number) {
  if (value > 0) return '不利差異'
  if (value < 0) return '有利差異'
  return '差異なし'
}
