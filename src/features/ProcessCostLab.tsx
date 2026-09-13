import { useMemo, useState } from 'react'

const money = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}万円`

export default function ProcessCostLab() {
  const [started, setStarted] = useState(1000)
  const [ending, setEnding] = useState(200)
  const [progress, setProgress] = useState(50)
  const [materialCost, setMaterialCost] = useState(500)
  const [conversionCost, setConversionCost] = useState(360)

  const result = useMemo(() => {
    const safeEnding = Math.min(ending, started)
    const completed = started - safeEnding
    const materialEq = completed + safeEnding
    const conversionEndingEq = safeEnding * (progress / 100)
    const conversionEq = completed + conversionEndingEq
    const materialUnit = materialEq > 0 ? materialCost / materialEq : 0
    const conversionUnit = conversionEq > 0 ? conversionCost / conversionEq : 0
    const completedCost = completed * (materialUnit + conversionUnit)
    const endingCost = safeEnding * materialUnit + conversionEndingEq * conversionUnit
    return { safeEnding, completed, materialEq, conversionEndingEq, conversionEq, materialUnit, conversionUnit, completedCost, endingCost }
  }, [started, ending, progress, materialCost, conversionCost])

  return (
    <section className="process-lab panel">
      <div className="lab-head">
        <div>
          <span className="mini-label">Visual Lab 01</span>
          <h2>総合原価計算：数量と完成品換算量</h2>
          <p>同じ月末仕掛品でも、<strong>材料費と加工費では「何個分」と見るかが違う</strong>ことを動かして確認します。</p>
        </div>
        <div className="lab-first-look">
          <small>問題を見たら最初に確認</small>
          <b>材料はいつ投入？ 加工進捗度はいくつ？</b>
        </div>
      </div>

      <div className="process-layout">
        <div className="lab-controls">
          <MiniRange label="当月投入数量" value={started} min={200} max={1600} step={100} onChange={setStarted} suffix="個" />
          <MiniRange label="月末仕掛品" value={ending} min={0} max={started} step={50} onChange={setEnding} suffix="個" />
          <MiniRange label="加工進捗度" value={progress} min={0} max={100} step={10} onChange={setProgress} suffix="%" />
          <MiniRange label="材料費" value={materialCost} min={100} max={1000} step={20} onChange={setMaterialCost} suffix="万円" />
          <MiniRange label="加工費" value={conversionCost} min={100} max={1000} step={20} onChange={setConversionCost} suffix="万円" />
        </div>

        <div className="box-stage">
          <div className="quantity-box">
            <div className="box-title">数量の箱</div>
            <div className="box-in">当月投入 <strong>{started.toLocaleString()}個</strong></div>
            <div className="box-divider" />
            <div className="box-out">
              <span>完成品 <b>{result.completed.toLocaleString()}個</b></span>
              <span>月末仕掛品 <b>{result.safeEnding.toLocaleString()}個</b></span>
            </div>
          </div>

          <div className="eq-grid">
            <div className="eq-card material-eq">
              <span>材料費の完成品換算量</span>
              <strong>{result.materialEq.toLocaleString()}個分</strong>
              <p>材料は<strong>工程始点で全量投入</strong>と仮定。月末仕掛品も材料だけ見れば100%投入済み。</p>
              <div className="eq-bar"><i style={{ width: '100%' }} /></div>
              <small>月末 {result.safeEnding}個 × 100% = {result.safeEnding}個分</small>
            </div>

            <div className="eq-card conversion-eq">
              <span>加工費の完成品換算量</span>
              <strong>{Math.round(result.conversionEq).toLocaleString()}個分</strong>
              <p>加工は途中。月末仕掛品には<strong>進捗度だけ</strong>掛けます。</p>
              <div className="eq-bar"><i style={{ width: `${progress}%` }} /></div>
              <small>月末 {result.safeEnding}個 × {progress}% = {Math.round(result.conversionEndingEq)}個分</small>
            </div>
          </div>
        </div>
      </div>

      <div className="process-calculation">
        <div><small>材料1個分</small><strong>{money(result.materialUnit)}</strong></div>
        <div><small>加工1個分</small><strong>{money(result.conversionUnit)}</strong></div>
        <div><small>完成品原価</small><strong>{money(result.completedCost)}</strong></div>
        <div><small>月末仕掛品原価</small><strong>{money(result.endingCost)}</strong></div>
      </div>

      <div className="misconception-alert">
        <b>ひっかけ警報</b>
        <span>「月末仕掛品 {result.safeEnding}個 × {progress}%」を材料費にも使わない。進捗度を掛けるのは、工程始点投入の材料ではなく<strong>加工費</strong>です。</span>
      </div>
    </section>
  )
}

function MiniRange({ label, value, min, max, step, onChange, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix: string }) {
  const safeValue = Math.min(value, max)
  return <label className="mini-range">
    <span><b>{label}</b><strong>{safeValue.toLocaleString()}{suffix}</strong></span>
    <input type="range" min={min} max={max} step={step} value={safeValue} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
}
