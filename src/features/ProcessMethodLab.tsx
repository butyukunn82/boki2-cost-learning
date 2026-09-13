import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`
const qty = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}個`

export default function ProcessMethodLab() {
  const [beginQty, setBeginQty] = useState(200)
  const [beginConv, setBeginConv] = useState(40)
  const [started, setStarted] = useState(800)
  const [completed, setCompleted] = useState(850)
  const [endingConv, setEndingConv] = useState(30)
  const [beginMaterialCost, setBeginMaterialCost] = useState(80000)
  const [beginConversionCost, setBeginConversionCost] = useState(36000)
  const [currentMaterialCost, setCurrentMaterialCost] = useState(360000)
  const [currentConversionCost, setCurrentConversionCost] = useState(252000)

  const calc = useMemo(() => {
    const totalUnits = beginQty + started
    const safeCompleted = Math.min(Math.max(completed, beginQty), totalUnits)
    const endingQty = totalUnits - safeCompleted
    const bPct = beginConv / 100
    const ePct = endingConv / 100

    const waMatEu = safeCompleted + endingQty
    const waConvEu = safeCompleted + endingQty * ePct
    const waMatUnit = (beginMaterialCost + currentMaterialCost) / Math.max(waMatEu, 1)
    const waConvUnit = (beginConversionCost + currentConversionCost) / Math.max(waConvEu, 1)
    const waCompleted = safeCompleted * (waMatUnit + waConvUnit)
    const waEnding = endingQty * waMatUnit + endingQty * ePct * waConvUnit

    const startedCompleted = Math.max(0, safeCompleted - beginQty)
    const fifoMatEu = startedCompleted + endingQty
    const fifoConvEu = beginQty * (1 - bPct) + startedCompleted + endingQty * ePct
    const fifoMatUnit = currentMaterialCost / Math.max(fifoMatEu, 1)
    const fifoConvUnit = currentConversionCost / Math.max(fifoConvEu, 1)
    const fifoBeginCompletion = beginMaterialCost + beginConversionCost + beginQty * (1 - bPct) * fifoConvUnit
    const fifoStartedCompleted = startedCompleted * (fifoMatUnit + fifoConvUnit)
    const fifoCompleted = fifoBeginCompletion + fifoStartedCompleted
    const fifoEnding = endingQty * fifoMatUnit + endingQty * ePct * fifoConvUnit

    const totalCost = beginMaterialCost + beginConversionCost + currentMaterialCost + currentConversionCost

    return {
      totalUnits, safeCompleted, endingQty, startedCompleted,
      waMatEu, waConvEu, waMatUnit, waConvUnit, waCompleted, waEnding,
      fifoMatEu, fifoConvEu, fifoMatUnit, fifoConvUnit, fifoBeginCompletion, fifoStartedCompleted, fifoCompleted, fifoEnding,
      totalCost,
    }
  }, [beginQty, started, completed, beginConv, endingConv, beginMaterialCost, beginConversionCost, currentMaterialCost, currentConversionCost])

  return (
    <section className="process-method-lab panel">
      <header className="lab-heading">
        <div>
          <p className="eyebrow">Visual Lab 06</p>
          <h2>平均法 vs 先入先出法：「混ぜる」か「分ける」か</h2>
          <p>材料は工程始点で全量投入する前提。平均法とFIFOの違いを、<strong>月初仕掛品を当月分と混ぜるか、当月作業だけ分けるか</strong>で見ます。</p>
        </div>
        <div className="lab-location">
          <span>どこ？</span><strong>総合原価計算 ＞ 月初仕掛品あり</strong>
          <span>何を？</span><strong>完成品と月末仕掛品へ原価を配分する方法</strong>
          <span>なぜ？</span><strong>平均法とFIFOで単価・完成品原価が変わる理由を理解する</strong>
        </div>
      </header>

      <div className="variance-first-action">
        <span>問題文を見たら、まず何を見る？</span>
        <strong>「平均法」か「先入先出法」か。平均法＝月初＋当月を混ぜる、FIFO＝月初の残作業と当月着手分を分ける。</strong>
      </div>

      <div className="method-layout">
        <aside className="method-controls">
          <h3>数量・進捗度</h3>
          <MRange label="月初仕掛品" value={beginQty} min={50} max={400} step={50} suffix="個" onChange={(v) => {
            setBeginQty(v)
            setCompleted((c) => Math.max(c, v))
          }} />
          <MRange label="月初加工進捗度" value={beginConv} min={0} max={90} step={10} suffix="%" onChange={setBeginConv} />
          <MRange label="当月投入" value={started} min={300} max={1200} step={50} suffix="個" onChange={setStarted} />
          <MRange label="完成品" value={calc.safeCompleted} min={beginQty} max={calc.totalUnits} step={50} suffix="個" onChange={setCompleted} />
          <MRange label="月末加工進捗度" value={endingConv} min={0} max={90} step={10} suffix="%" onChange={setEndingConv} />
          <div className="method-balance"><span>月末仕掛品</span><b>{qty(calc.endingQty)}</b></div>

          <h3>原価</h3>
          <MRange label="月初材料費" value={beginMaterialCost} min={20000} max={180000} step={10000} suffix="円" onChange={setBeginMaterialCost} />
          <MRange label="月初加工費" value={beginConversionCost} min={10000} max={120000} step={5000} suffix="円" onChange={setBeginConversionCost} />
          <MRange label="当月材料費" value={currentMaterialCost} min={100000} max={700000} step={20000} suffix="円" onChange={setCurrentMaterialCost} />
          <MRange label="当月加工費" value={currentConversionCost} min={80000} max={600000} step={20000} suffix="円" onChange={setCurrentConversionCost} />
        </aside>

        <div className="method-worlds">
          <MethodWorld
            title="平均法"
            subtitle="月初原価＋当月原価を混ぜて平均"
            materialEu={calc.waMatEu}
            conversionEu={calc.waConvEu}
            materialUnit={calc.waMatUnit}
            conversionUnit={calc.waConvUnit}
            completed={calc.waCompleted}
            ending={calc.waEnding}
            note="月初仕掛品が何％まで進んでいたかは、当月単価計算で切り分けない。"
          />
          <MethodWorld
            title="先入先出法（FIFO）"
            subtitle="月初の残作業と当月着手分を分離"
            materialEu={calc.fifoMatEu}
            conversionEu={calc.fifoConvEu}
            materialUnit={calc.fifoMatUnit}
            conversionUnit={calc.fifoConvUnit}
            completed={calc.fifoCompleted}
            ending={calc.fifoEnding}
            note={`月初${qty(beginQty)}は材料投入済み。加工の残り${100 - beginConv}%だけを当月作業として追加する。`}
          />
        </div>
      </div>

      <div className="method-visual">
        <div className="method-row average-row">
          <b>平均法</b>
          <div className="method-box mixed"><span>月初仕掛品</span><i>＋</i><span>当月投入</span><strong>混ぜる</strong></div>
          <em>→</em>
          <div className="method-box result"><span>完成品 {qty(calc.safeCompleted)}</span><span>月末 {qty(calc.endingQty)}</span></div>
        </div>
        <div className="method-row fifo-row">
          <b>FIFO</b>
          <div className="method-box separated"><span>月初の残作業</span><span>当月着手完成 {qty(calc.startedCompleted)}</span><span>月末 {qty(calc.endingQty)}</span><strong>分ける</strong></div>
          <em>→</em>
          <div className="method-box result"><span>完成品 {yen(calc.fifoCompleted)}</span><span>月末 {yen(calc.fifoEnding)}</span></div>
        </div>
      </div>

      <div className="method-checks">
        <div><span>投入原価合計</span><b>{yen(calc.totalCost)}</b></div>
        <div><span>平均法 検算</span><b>{yen(calc.waCompleted + calc.waEnding)}</b></div>
        <div><span>FIFO 検算</span><b>{yen(calc.fifoCompleted + calc.fifoEnding)}</b></div>
      </div>

      <div className="method-memory">
        <strong>反射用：</strong>
        <span>平均法＝月初と当月を混ぜる。FIFO＝月初仕掛品の「残りの仕事」だけ当月分に入れる。</span>
      </div>
    </section>
  )
}

function MethodWorld({ title, subtitle, materialEu, conversionEu, materialUnit, conversionUnit, completed, ending, note }: {
  title: string; subtitle: string; materialEu: number; conversionEu: number; materialUnit: number; conversionUnit: number; completed: number; ending: number; note: string
}) {
  return <article className="method-world">
    <header><span>{title}</span><small>{subtitle}</small></header>
    <div className="method-metrics">
      <div><span>材料 完成品換算量</span><b>{qty(materialEu)}</b></div>
      <div><span>加工 完成品換算量</span><b>{qty(conversionEu)}</b></div>
      <div><span>材料単価</span><b>{yen(materialUnit)}</b></div>
      <div><span>加工単価</span><b>{yen(conversionUnit)}</b></div>
    </div>
    <div className="method-output"><div><span>完成品原価</span><strong>{yen(completed)}</strong></div><div><span>月末仕掛品原価</span><strong>{yen(ending)}</strong></div></div>
    <p>{note}</p>
  </article>
}

function MRange({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  const safe = Math.min(Math.max(value, min), max)
  return <label className="method-range"><span><b>{label}</b><strong>{safe.toLocaleString('ja-JP')}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={safe} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
