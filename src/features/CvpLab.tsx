import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`
const qty = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}個`

export default function CvpLab() {
  const [price, setPrice] = useState(1200)
  const [variableCost, setVariableCost] = useState(700)
  const [fixedCost, setFixedCost] = useState(300000)
  const [plannedUnits, setPlannedUnits] = useState(900)
  const [targetProfit, setTargetProfit] = useState(150000)

  const calc = useMemo(() => {
    const contributionPerUnit = Math.max(1, price - variableCost)
    const contributionRate = contributionPerUnit / Math.max(price, 1)
    const breakEvenUnits = fixedCost / contributionPerUnit
    const breakEvenSales = fixedCost / contributionRate
    const targetUnits = (fixedCost + targetProfit) / contributionPerUnit
    const plannedSales = price * plannedUnits
    const plannedVariable = variableCost * plannedUnits
    const plannedContribution = contributionPerUnit * plannedUnits
    const plannedProfit = plannedContribution - fixedCost
    const safetyMargin = plannedSales - breakEvenSales
    const safetyMarginRate = plannedSales > 0 ? safetyMargin / plannedSales : 0
    return {
      contributionPerUnit,
      contributionRate,
      breakEvenUnits,
      breakEvenSales,
      targetUnits,
      plannedSales,
      plannedVariable,
      plannedContribution,
      plannedProfit,
      safetyMargin,
      safetyMarginRate,
    }
  }, [price, variableCost, fixedCost, plannedUnits, targetProfit])

  const maxUnits = Math.max(plannedUnits, calc.targetUnits, calc.breakEvenUnits, 100) * 1.2
  const maxY = Math.max(price * maxUnits, fixedCost + variableCost * maxUnits, 1) * 1.05
  const W = 620
  const H = 340
  const left = 70
  const top = 24
  const innerW = 500
  const innerH = 245
  const x = (u: number) => left + (u / maxUnits) * innerW
  const y = (amount: number) => top + innerH - (amount / maxY) * innerH
  const revenueAt = (u: number) => price * u
  const totalCostAt = (u: number) => fixedCost + variableCost * u

  return (
    <section className="cvp-lab panel">
      <header className="lab-heading">
        <div>
          <p className="eyebrow">Visual Lab 05</p>
          <h2>CVP：損益分岐点を「動く会社」で理解する</h2>
          <p>公式を先に暗記しません。固定費・変動費・販売単価を動かして、<strong>赤字と黒字の境界がどこへ動くか</strong>を見ます。</p>
        </div>
        <div className="lab-location">
          <span>どこ？</span><strong>直接原価計算 ＞ 利益計画 ＞ CVP分析</strong>
          <span>何を？</span><strong>売上・変動費・固定費と利益の関係</strong>
          <span>なぜ？</span><strong>何個・いくら売れば赤字を脱するかを判断する</strong>
        </div>
      </header>

      <div className="variance-first-action">
        <span>問題文を見たら、まず何を見る？</span>
        <strong>①1個あたり貢献利益 ②貢献利益率 ③固定費 ④何を求める問題か（損益分岐点・目標利益・安全余裕率）。</strong>
      </div>

      <div className="cvp-layout">
        <aside className="variance-controls">
          <h3>会社の条件を動かす</h3>
          <CVPRange label="販売単価" value={price} min={600} max={2200} step={50} suffix="円" onChange={(v) => { setPrice(v); setVariableCost((c) => Math.min(c, v - 50)) }} />
          <CVPRange label="変動費/個" value={variableCost} min={100} max={Math.max(150, price - 50)} step={50} suffix="円" onChange={setVariableCost} />
          <CVPRange label="固定費" value={fixedCost} min={50000} max={800000} step={25000} suffix="円" onChange={setFixedCost} />
          <CVPRange label="計画販売量" value={plannedUnits} min={100} max={1800} step={50} suffix="個" onChange={setPlannedUnits} />
          <CVPRange label="目標利益" value={targetProfit} min={0} max={500000} step={25000} suffix="円" onChange={setTargetProfit} />

          <div className="cvp-core-values">
            <div><span>貢献利益/個</span><b>{yen(calc.contributionPerUnit)}</b></div>
            <div><span>貢献利益率</span><b>{(calc.contributionRate * 100).toFixed(1)}%</b></div>
          </div>
        </aside>

        <div className="cvp-chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="売上線と総費用線が交差する損益分岐点グラフ">
            <line x1={left} y1={top + innerH} x2={left + innerW + 8} y2={top + innerH} className="axis" />
            <line x1={left} y1={top + innerH} x2={left} y2={top - 5} className="axis" />
            <text x={left + innerW / 2} y={326} className="axis-label">販売数量</text>
            <text x={18} y={top + innerH / 2} className="axis-label vertical">金額</text>

            <line x1={left} y1={y(0)} x2={x(maxUnits)} y2={y(revenueAt(maxUnits))} className="cvp-revenue-line" />
            <line x1={left} y1={y(fixedCost)} x2={x(maxUnits)} y2={y(totalCostAt(maxUnits))} className="cvp-cost-line" />
            <line x1={left} y1={y(fixedCost)} x2={x(maxUnits)} y2={y(fixedCost)} className="cvp-fixed-line" />

            <line x1={x(calc.breakEvenUnits)} y1={top} x2={x(calc.breakEvenUnits)} y2={top + innerH} className="cvp-be-guide" />
            <circle cx={x(calc.breakEvenUnits)} cy={y(calc.breakEvenSales)} r="7" className="cvp-be-point" />
            <text x={x(calc.breakEvenUnits) + 9} y={y(calc.breakEvenSales) - 8} className="point-label">損益分岐点</text>

            <line x1={x(plannedUnits)} y1={top} x2={x(plannedUnits)} y2={top + innerH} className="cvp-plan-guide" />
            <circle cx={x(plannedUnits)} cy={y(calc.plannedSales)} r="5" className="cvp-plan-point" />
            <text x={x(plannedUnits) + 7} y={y(calc.plannedSales) - 7} className="cvp-plan-label">計画</text>
          </svg>

          <div className="cvp-legend">
            <div><i className="legend-line revenue" /><span>売上高 = 販売単価 × 数量</span></div>
            <div><i className="legend-line total-cost" /><span>総費用 = 固定費 + 変動費 × 数量</span></div>
            <div><i className="legend-line fixed-cost" /><span>固定費</span></div>
          </div>

          <div className="cvp-experiment-note">
            <b>試してほしいこと</b>
            <span>固定費を上げる → 損益分岐点が右へ。</span>
            <span>変動費を下げる → 総費用線が寝て、損益分岐点が左へ。</span>
            <span>販売単価を上げる → 売上線が急になり、黒字化が早くなる。</span>
          </div>
        </div>
      </div>

      <div className="cvp-results">
        <div><span>損益分岐点数量</span><strong>{qty(calc.breakEvenUnits)}</strong><small>固定費 ÷ 1個あたり貢献利益</small></div>
        <div><span>損益分岐点売上高</span><strong>{yen(calc.breakEvenSales)}</strong><small>固定費 ÷ 貢献利益率</small></div>
        <div><span>目標利益達成数量</span><strong>{qty(calc.targetUnits)}</strong><small>(固定費＋目標利益) ÷ 貢献利益/個</small></div>
        <div><span>計画利益</span><strong>{yen(calc.plannedProfit)}</strong><small>貢献利益 − 固定費</small></div>
      </div>

      <div className="safety-margin-card">
        <div><span>計画売上高</span><strong>{yen(calc.plannedSales)}</strong></div>
        <b>−</b>
        <div><span>損益分岐点売上高</span><strong>{yen(calc.breakEvenSales)}</strong></div>
        <b>=</b>
        <div><span>安全余裕額</span><strong>{yen(calc.safetyMargin)}</strong><small>安全余裕率 {(calc.safetyMarginRate * 100).toFixed(1)}%</small></div>
      </div>

      <div className="variance-memory-rule">
        <strong>反射用：</strong>
        <span>CVPを見たら、まず「売価−変動費＝貢献利益」。固定費をその貢献利益で何個分回収するか、と考える。</span>
      </div>
    </section>
  )
}

function CVPRange({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="variance-range">
    <span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
}
