import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`

export default function GroupGradeCostLab() {
  const [tab, setTab] = useState<'group' | 'grade'>('group')
  return <section className="group-grade-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Visual Lab 09</p>
        <h2>組別・等級別総合原価計算</h2>
        <p>名前が似ていますが、考えていることは別です。<strong>組別＝種類ごとに集める</strong>、<strong>等級別＝共通原価を等価係数で分ける</strong>と整理します。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>総合原価計算 ＞ 製品種類・等級への原価配分</strong>
        <span>何を？</span><strong>製品ごとの原価を分ける</strong>
        <span>なぜ？</span><strong>同じ工程から複数製品が出るとき、製品別原価を決めるため</strong>
      </div>
    </header>

    <div className="gg-tabs">
      <button className={tab === 'group' ? 'active' : ''} onClick={() => setTab('group')}>組別</button>
      <button className={tab === 'grade' ? 'active' : ''} onClick={() => setTab('grade')}>等級別</button>
    </div>
    {tab === 'group' ? <GroupPanel /> : <GradePanel />}
  </section>
}

function GroupPanel() {
  const [matA, setMatA] = useState(240000)
  const [matB, setMatB] = useState(160000)
  const [qtyA, setQtyA] = useState(600)
  const [qtyB, setQtyB] = useState(400)
  const [commonConversion, setCommonConversion] = useState(500000)

  const calc = useMemo(() => {
    const totalQty = Math.max(1, qtyA + qtyB)
    const commonA = commonConversion * qtyA / totalQty
    const commonB = commonConversion * qtyB / totalQty
    const totalA = matA + commonA
    const totalB = matB + commonB
    return { commonA, commonB, totalA, totalB, unitA: totalA / Math.max(1, qtyA), unitB: totalB / Math.max(1, qtyB) }
  }, [matA, matB, qtyA, qtyB, commonConversion])

  return <div className="gg-layout">
    <aside className="gg-controls">
      <Range label="A組 直接材料費" value={matA} min={50000} max={500000} step={10000} suffix="円" onChange={setMatA} />
      <Range label="B組 直接材料費" value={matB} min={50000} max={500000} step={10000} suffix="円" onChange={setMatB} />
      <Range label="A組 完成数量" value={qtyA} min={100} max={1000} step={50} suffix="個" onChange={setQtyA} />
      <Range label="B組 完成数量" value={qtyB} min={100} max={1000} step={50} suffix="個" onChange={setQtyB} />
      <Range label="共通加工費" value={commonConversion} min={100000} max={900000} step={25000} suffix="円" onChange={setCommonConversion} />
      <small>このLabでは、共通加工費を完成数量比で配分する簡易例で「組別」の考え方を確認します。</small>
    </aside>

    <div className="gg-main">
      <div className="group-flow">
        <div className="common-cost"><span>共通加工費</span><strong>{yen(commonConversion)}</strong><small>共通して発生</small></div>
        <div className="branch-mark">↓ 種類ごとに配分 ↓</div>
        <div className="group-cards">
          <article><span>A組</span><p>固有材料費 <b>{yen(matA)}</b></p><p>共通加工費 <b>{yen(calc.commonA)}</b></p><strong>組別原価 {yen(calc.totalA)}</strong><small>単位原価 {yen(calc.unitA)}</small></article>
          <article><span>B組</span><p>固有材料費 <b>{yen(matB)}</b></p><p>共通加工費 <b>{yen(calc.commonB)}</b></p><strong>組別原価 {yen(calc.totalB)}</strong><small>単位原価 {yen(calc.unitB)}</small></article>
        </div>
      </div>
      <div className="gg-memory"><b>組別の反射：</b><span>「A製品群・B製品群」のように種類が違う。直接たどれる原価は各組へ、共通原価は基準を使って各組へ分ける。</span></div>
    </div>
  </div>
}

function GradePanel() {
  const [totalCost, setTotalCost] = useState(900000)
  const [qtyA, setQtyA] = useState(300)
  const [qtyB, setQtyB] = useState(400)
  const [qtyC, setQtyC] = useState(300)
  const [coefA, setCoefA] = useState(1.5)
  const [coefB, setCoefB] = useState(1.0)
  const [coefC, setCoefC] = useState(0.7)

  const calc = useMemo(() => {
    const eqA = qtyA * coefA
    const eqB = qtyB * coefB
    const eqC = qtyC * coefC
    const eqTotal = Math.max(.0001, eqA + eqB + eqC)
    const costPerEq = totalCost / eqTotal
    const costA = eqA * costPerEq
    const costB = eqB * costPerEq
    const costC = eqC * costPerEq
    return { eqA, eqB, eqC, eqTotal, costPerEq, costA, costB, costC }
  }, [totalCost, qtyA, qtyB, qtyC, coefA, coefB, coefC])

  return <div className="gg-layout">
    <aside className="gg-controls">
      <Range label="完成品総合原価" value={totalCost} min={300000} max={1500000} step={50000} suffix="円" onChange={setTotalCost} />
      <Range label="A級 数量" value={qtyA} min={100} max={800} step={50} suffix="個" onChange={setQtyA} />
      <Coefficient label="A級 等価係数" value={coefA} onChange={setCoefA} />
      <Range label="B級 数量" value={qtyB} min={100} max={800} step={50} suffix="個" onChange={setQtyB} />
      <Coefficient label="B級 等価係数" value={coefB} onChange={setCoefB} />
      <Range label="C級 数量" value={qtyC} min={100} max={800} step={50} suffix="個" onChange={setQtyC} />
      <Coefficient label="C級 等価係数" value={coefC} onChange={setCoefC} />
    </aside>

    <div className="gg-main">
      <div className="grade-intro"><span>共通の完成品原価</span><strong>{yen(totalCost)}</strong><small>これを等価係数を使ってA・B・C級へ分けます。</small></div>
      <div className="grade-formula">数量 × 等価係数 ＝ 等価生産量</div>
      <div className="grade-table">
        <GradeRow grade="A級" qty={qtyA} coef={coefA} eq={calc.eqA} cost={calc.costA} />
        <GradeRow grade="B級" qty={qtyB} coef={coefB} eq={calc.eqB} cost={calc.costB} />
        <GradeRow grade="C級" qty={qtyC} coef={coefC} eq={calc.eqC} cost={calc.costC} />
        <div className="grade-total"><span>等価生産量 合計</span><b>{calc.eqTotal.toFixed(1)}</b><span>1等価単位原価</span><b>{yen(calc.costPerEq)}</b></div>
      </div>
      <div className="gg-memory"><b>等級別の反射：</b><span>数量をそのまま比べない。まず「数量×等価係数」に直してから、共通の完成品原価を比例配分する。</span></div>
    </div>
  </div>
}

function GradeRow({ grade, qty, coef, eq, cost }: { grade: string; qty: number; coef: number; eq: number; cost: number }) {
  return <div className="grade-row"><strong>{grade}</strong><span>{qty.toLocaleString('ja-JP')}個</span><i>×</i><span>{coef.toFixed(1)}</span><i>=</i><b>{eq.toFixed(1)}</b><em>→</em><strong>{yen(cost)}</strong></div>
}

function Range({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="gg-range"><span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
}

function Coefficient({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <label className="gg-range"><span><b>{label}</b><strong>{value.toFixed(1)}</strong></span><input type="range" min="0.5" max="2" step="0.1" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
