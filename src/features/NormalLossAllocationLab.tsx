import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`
const units = (v: number) => `${Math.round(v * 10) / 10}個分`

export default function NormalLossAllocationLab() {
  const [completed, setCompleted] = useState(700)
  const [endingWip, setEndingWip] = useState(300)
  const [endingProgress, setEndingProgress] = useState(40)
  const [normalLoss, setNormalLoss] = useState(100)
  const [lossPoint, setLossPoint] = useState(70)
  const [materialCost, setMaterialCost] = useState(1200000)
  const [conversionCost, setConversionCost] = useState(720000)

  const burden = endingProgress >= lossPoint ? 'both' : 'completed'

  const calc = useMemo(() => {
    const endingConvEu = endingWip * endingProgress / 100
    const lossConvEu = normalLoss * lossPoint / 100

    if (burden === 'both') {
      const materialDenominator = completed + endingWip
      const conversionDenominator = completed + endingConvEu
      const materialUnit = materialCost / Math.max(materialDenominator, 1)
      const conversionUnit = conversionCost / Math.max(conversionDenominator, 1)
      const endingMaterial = materialUnit * endingWip
      const endingConversion = conversionUnit * endingConvEu
      const endingCost = endingMaterial + endingConversion
      return {
        endingConvEu, lossConvEu,
        materialDenominator, conversionDenominator,
        materialUnit, conversionUnit,
        endingMaterial, endingConversion, endingCost,
        completedCost: materialCost + conversionCost - endingCost,
        method: '仕損を分母から外す',
      }
    }

    const materialDenominator = completed + normalLoss + endingWip
    const conversionDenominator = completed + lossConvEu + endingConvEu
    const materialUnit = materialCost / Math.max(materialDenominator, 1)
    const conversionUnit = conversionCost / Math.max(conversionDenominator, 1)
    const endingMaterial = materialUnit * endingWip
    const endingConversion = conversionUnit * endingConvEu
    const endingCost = endingMaterial + endingConversion
    return {
      endingConvEu, lossConvEu,
      materialDenominator, conversionDenominator,
      materialUnit, conversionUnit,
      endingMaterial, endingConversion, endingCost,
      completedCost: materialCost + conversionCost - endingCost,
      method: '仕損を含む実際投入量で月末を計算',
    }
  }, [completed, endingWip, endingProgress, normalLoss, lossPoint, materialCost, conversionCost, burden])

  return <section className="loss-allocation-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Visual Lab</p>
        <h2>正常仕損・度外視法：仕損費はどこへ乗る？</h2>
        <p>「仕損を無視する」という言葉だけでは分かりにくいので、<strong>分母と単価がどう変わり、完成品・月末仕掛品へどう原価が移るか</strong>を見ます。月初仕掛品なし・材料は工程始点投入の基本ケースです。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>総合原価計算 ＞ 正常仕損 ＞ 度外視法</strong>
        <span>何を？</span><strong>正常仕損費の完成品・月末仕掛品への負担</strong>
        <span>なぜ？</span><strong>同じ仕損でも発生点で原価配分が変わるから</strong>
      </div>
    </header>

    <div className="variance-first-action"><span>問題を見たら、まず何を見る？</span><strong>月末仕掛品の進捗度と仕損発生点を比較して、「完成品のみ」か「両者負担」かを先に決める。</strong></div>

    <div className="loss-allocation-layout">
      <aside className="loss-allocation-controls">
        <Range label="完成品" value={completed} min={200} max={1200} step={50} suffix="個" onChange={setCompleted} />
        <Range label="月末仕掛品" value={endingWip} min={50} max={500} step={25} suffix="個" onChange={setEndingWip} />
        <Range label="月末加工進捗度" value={endingProgress} min={10} max={90} step={10} suffix="%" onChange={setEndingProgress} />
        <Range label="正常仕損" value={normalLoss} min={25} max={300} step={25} suffix="個" onChange={setNormalLoss} />
        <Range label="仕損発生点" value={lossPoint} min={10} max={100} step={10} suffix="%" onChange={setLossPoint} />
        <Range label="直接材料費" value={materialCost} min={300000} max={2400000} step={100000} suffix="円" onChange={setMaterialCost} />
        <Range label="加工費" value={conversionCost} min={200000} max={1600000} step={50000} suffix="円" onChange={setConversionCost} />
      </aside>

      <div className="loss-allocation-main">
        <div className="loss-allocation-judge">
          <div><span>月末仕掛品</span><strong>{endingProgress}%</strong></div>
          <b>{endingProgress >= lossPoint ? '≥' : '<'}</b>
          <div><span>仕損発生点</span><strong>{lossPoint}%</strong></div>
          <em>→</em>
          <div className="answer"><span>正常仕損費</span><strong>{burden === 'both' ? '完成品＋月末仕掛品が負担' : '完成品のみ負担'}</strong></div>
        </div>

        <div className="loss-denominators">
          <article>
            <header><span>材料費の分母</span><strong>{units(calc.materialDenominator)}</strong></header>
            <p>{burden === 'both'
              ? `完成品${completed}＋月末${endingWip}。正常仕損${normalLoss}個を最初から無かったものとして度外視する。`
              : `完成品${completed}＋仕損${normalLoss}＋月末${endingWip}。月末仕掛品は仕損費を負担しない単価で計算する。`}</p>
            <b>材料単価 {yen(calc.materialUnit)} / 個分</b>
          </article>
          <article>
            <header><span>加工費の分母</span><strong>{units(calc.conversionDenominator)}</strong></header>
            <p>{burden === 'both'
              ? `完成品${completed}＋月末換算量${units(calc.endingConvEu)}。仕損換算量は度外視する。`
              : `完成品${completed}＋仕損換算量${units(calc.lossConvEu)}＋月末換算量${units(calc.endingConvEu)}。`}</p>
            <b>加工費単価 {yen(calc.conversionUnit)} / 個分</b>
          </article>
        </div>

        <div className="loss-allocation-flow">
          <div className="input">
            <span>投入原価</span>
            <strong>{yen(materialCost + conversionCost)}</strong>
            <small>材料 {yen(materialCost)} + 加工 {yen(conversionCost)}</small>
          </div>
          <b>→</b>
          <div>
            <span>月末仕掛品</span>
            <strong>{yen(calc.endingCost)}</strong>
            <small>材料 {yen(calc.endingMaterial)} + 加工 {yen(calc.endingConversion)}</small>
          </div>
          <b>+</b>
          <div className="completed">
            <span>完成品</span>
            <strong>{yen(calc.completedCost)}</strong>
            <small>投入原価 − 月末仕掛品原価</small>
          </div>
        </div>

        <div className="loss-allocation-compare">
          <article><span>このケースの計算思想</span><strong>{calc.method}</strong><small>{burden === 'both' ? '単価そのものが上がり、完成品と月末仕掛品の両方が仕損費を負担する。' : '月末仕掛品を仕損費なしの単価で先に計算し、差額として完成品が仕損費を吸収する。'}</small></article>
          <article><span>材料と加工の違い</span><strong>材料100% / 加工は発生点まで</strong><small>始点投入材料は仕損品にも100%入っているが、加工費は仕損発生点{lossPoint}%まで。</small></article>
        </div>

        <div className="loss-allocation-memory"><strong>反射：</strong><span>①進捗度と仕損点を比較 → ②負担先決定 → ③材料と加工の分母を別々に作る → ④月末仕掛品 → ⑤差額で完成品 → ⑥投入原価＝配分原価を検算。</span></div>
      </div>
    </div>
  </section>
}

function Range({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="loss-allocation-range"><span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
