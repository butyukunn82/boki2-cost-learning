import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`

export default function StandardCostCardLab() {
  const [materialQty, setMaterialQty] = useState(4)
  const [materialPrice, setMaterialPrice] = useState(500)
  const [laborHours, setLaborHours] = useState(2)
  const [laborRate, setLaborRate] = useState(1500)
  const [variableOhRate, setVariableOhRate] = useState(600)
  const [fixedOhRate, setFixedOhRate] = useState(400)
  const [units, setUnits] = useState(100)

  const calc = useMemo(() => {
    const material = materialQty * materialPrice
    const labor = laborHours * laborRate
    const variableOh = laborHours * variableOhRate
    const fixedOh = laborHours * fixedOhRate
    const overhead = variableOh + fixedOh
    const unitStandard = material + labor + overhead
    return {
      material, labor, variableOh, fixedOh, overhead, unitStandard,
      totalMaterial: material * units,
      totalLabor: labor * units,
      totalOverhead: overhead * units,
      totalStandard: unitStandard * units,
      standardMaterialQty: materialQty * units,
      standardLaborHours: laborHours * units,
    }
  }, [materialQty, materialPrice, laborHours, laborRate, variableOhRate, fixedOhRate, units])

  return <section className="standard-card-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Visual Lab</p>
        <h2>標準原価カードは「製品1個の原価レシピ」</h2>
        <p>差異分析の前に、<strong>そもそも何を標準として決めたのか</strong>を固定します。1個あたりの材料・作業時間・製造間接費を先に作り、実際と比べます。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>原価計算 ＞ 標準原価計算 ＞ 標準を決める</strong>
        <span>何を？</span><strong>製品1個あたりの標準原価</strong>
        <span>なぜ？</span><strong>実際原価との差を測る基準を先に作るため</strong>
      </div>
    </header>

    <div className="variance-first-action"><span>問題を見たら、まず何を見る？</span><strong>「1個あたり」の標準数量・標準時間・標準単価を拾う。生産量を掛けるのはその後。</strong></div>

    <div className="standard-card-layout">
      <aside className="standard-card-controls">
        <h3>標準を動かす</h3>
        <Range label="材料 標準消費量" value={materialQty} min={1} max={10} step={0.5} suffix="kg/個" onChange={setMaterialQty} />
        <Range label="材料 標準価格" value={materialPrice} min={100} max={1200} step={50} suffix="円/kg" onChange={setMaterialPrice} />
        <Range label="標準作業時間" value={laborHours} min={0.5} max={6} step={0.5} suffix="時間/個" onChange={setLaborHours} />
        <Range label="標準賃率" value={laborRate} min={800} max={3000} step={100} suffix="円/時" onChange={setLaborRate} />
        <Range label="変動製造間接費率" value={variableOhRate} min={100} max={1500} step={100} suffix="円/時" onChange={setVariableOhRate} />
        <Range label="固定製造間接費率" value={fixedOhRate} min={100} max={1500} step={100} suffix="円/時" onChange={setFixedOhRate} />
        <Range label="完成数量" value={units} min={10} max={500} step={10} suffix="個" onChange={setUnits} />
      </aside>

      <div className="standard-card-main">
        <article className="standard-card-sheet">
          <header><span>標準原価カード</span><strong>製品1個あたり</strong></header>
          <CardRow label="直接材料費" left={`${materialQty}kg × ${yen(materialPrice)}/kg`} value={calc.material} />
          <CardRow label="直接労務費" left={`${laborHours}時間 × ${yen(laborRate)}/時`} value={calc.labor} />
          <CardRow label="変動製造間接費" left={`${laborHours}時間 × ${yen(variableOhRate)}/時`} value={calc.variableOh} />
          <CardRow label="固定製造間接費" left={`${laborHours}時間 × ${yen(fixedOhRate)}/時`} value={calc.fixedOh} />
          <div className="standard-card-total"><span>標準製造原価</span><strong>{yen(calc.unitStandard)} / 個</strong></div>
        </article>

        <div className="standard-card-scale">
          <div><span>1個の標準</span><strong>{yen(calc.unitStandard)}</strong><small>ここが標準原価カード</small></div>
          <b>×</b>
          <div><span>完成数量</span><strong>{units.toLocaleString('ja-JP')}個</strong><small>問題の生産実績</small></div>
          <b>=</b>
          <div className="total"><span>完成品の標準原価</span><strong>{yen(calc.totalStandard)}</strong><small>実際原価と比べる基準</small></div>
        </div>

        <div className="standard-card-links">
          <article><span>材料費差異へ</span><strong>SQ = {calc.standardMaterialQty.toLocaleString('ja-JP')}kg</strong><small>{materialQty}kg/個 × {units}個。この標準数量SQと実際数量AQを比べる。</small></article>
          <article><span>労務費差異へ</span><strong>SH = {calc.standardLaborHours.toLocaleString('ja-JP')}時間</strong><small>{laborHours}時間/個 × {units}個。この標準時間SHと実際時間AHを比べる。</small></article>
          <article><span>製造間接費差異へ</span><strong>標準時間 {calc.standardLaborHours.toLocaleString('ja-JP')}時間</strong><small>標準操業度の基礎になり、シュラッター図へつながる。</small></article>
        </div>

        <div className="standard-card-memory"><strong>つながり：</strong><span>標準原価カードを作る → 生産量からSQ・SHを出す → 実際のAP/AQ・AR/AH等と比較 → 差異分析。</span></div>
      </div>
    </div>
  </section>
}

function CardRow({ label, left, value }: { label: string; left: string; value: number }) {
  return <div className="standard-card-row"><span>{label}</span><small>{left}</small><strong>{yen(value)}</strong></div>
}

function Range({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="standard-range"><span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
