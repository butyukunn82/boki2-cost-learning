import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`
type AddMode = 'point' | 'continuous'

export default function AdditionalMaterialLab() {
  const [completed, setCompleted] = useState(800)
  const [endingWip, setEndingWip] = useState(200)
  const [progress, setProgress] = useState(50)
  const [mode, setMode] = useState<AddMode>('point')
  const [addPoint, setAddPoint] = useState(60)
  const [materialA, setMaterialA] = useState(500000)
  const [materialB, setMaterialB] = useState(240000)
  const [conversion, setConversion] = useState(360000)

  const calc = useMemo(() => {
    const matAEu = completed + endingWip
    const matBEu = mode === 'continuous'
      ? completed + endingWip * progress / 100
      : completed + (progress >= addPoint ? endingWip : 0)
    const convEu = completed + endingWip * progress / 100
    const aRate = materialA / Math.max(matAEu, 1)
    const bRate = materialB / Math.max(matBEu, 1)
    const cRate = conversion / Math.max(convEu, 1)
    const endingBUnits = mode === 'continuous' ? endingWip * progress / 100 : progress >= addPoint ? endingWip : 0
    const endingCost = endingWip * aRate + endingBUnits * bRate + endingWip * progress / 100 * cRate
    const totalCost = materialA + materialB + conversion
    return { matAEu, matBEu, convEu, aRate, bRate, cRate, endingBUnits, endingCost, completedCost: totalCost - endingCost }
  }, [completed, endingWip, progress, mode, addPoint, materialA, materialB, conversion])

  const hasB = mode === 'continuous' ? progress > 0 : progress >= addPoint

  return <section className="additional-material-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Visual Lab 10</p>
        <h2>追加材料：「いつ入れたか」で換算量が変わる</h2>
        <p>月末仕掛品200個だから材料も必ず200個分、とは限りません。<strong>追加材料の投入時点を月末仕掛品が通過したか</strong>を最初に見ます。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>総合原価計算 ＞ 材料の追加投入</strong>
        <span>何を？</span><strong>追加材料Bの完成品換算量</strong>
        <span>なぜ？</span><strong>月末仕掛品に材料B原価を持たせるか決めるため</strong>
      </div>
    </header>

    <div className="am-first"><span>問題文を見たら？</span><strong>「材料Bは加工進捗○%時点で投入」を探し、月末仕掛品の進捗度と比べる。</strong></div>

    <div className="am-layout">
      <aside className="am-controls">
        <div className="am-mode"><button className={mode === 'point' ? 'active' : ''} onClick={() => setMode('point')}>一定点で一括投入</button><button className={mode === 'continuous' ? 'active' : ''} onClick={() => setMode('continuous')}>加工に応じて平均投入</button></div>
        <Range label="完成品" value={completed} min={200} max={1200} step={50} suffix="個" onChange={setCompleted} />
        <Range label="月末仕掛品" value={endingWip} min={50} max={500} step={25} suffix="個" onChange={setEndingWip} />
        <Range label="月末加工進捗度" value={progress} min={0} max={100} step={5} suffix="%" onChange={setProgress} />
        {mode === 'point' && <Range label="材料Bの投入点" value={addPoint} min={0} max={100} step={5} suffix="%" onChange={setAddPoint} />}
        <Range label="材料A原価（始点投入）" value={materialA} min={100000} max={900000} step={25000} suffix="円" onChange={setMaterialA} />
        <Range label="材料B原価（追加材料）" value={materialB} min={50000} max={600000} step={25000} suffix="円" onChange={setMaterialB} />
        <Range label="加工費" value={conversion} min={100000} max={700000} step={25000} suffix="円" onChange={setConversion} />
      </aside>

      <div className="am-main">
        <div className="am-track">
          <div className="am-line" />
          <Marker left={0} label="材料A" sub="始点投入" />
          {mode === 'point' && <Marker left={addPoint} label="材料B" sub={`${addPoint}%で投入`} />}
          <Marker left={progress} label="月末WIP" sub={`${progress}%`} special />
          <Marker left={100} label="完成" sub="100%" />
        </div>

        <div className={hasB ? 'am-judgment has' : 'am-judgment not-yet'}>
          <span>月末仕掛品は材料Bを持っている？</span>
          <strong>{mode === 'continuous' ? '進捗分だけ持つ' : hasB ? '持っている' : 'まだ持っていない'}</strong>
          <p>{mode === 'continuous'
            ? `材料Bを加工に応じて平均投入する想定なので、月末${endingWip}個のうち換算量は${Math.round(calc.endingBUnits)}個分。`
            : hasB
              ? `月末仕掛品は${progress}%まで進んでおり、投入点${addPoint}%を通過済み。材料Bは${endingWip}個分すべて投入済み。`
              : `月末仕掛品は${progress}%、材料Bは${addPoint}%で投入。まだ投入点に届かないので月末仕掛品の材料B換算量は0。`}</p>
        </div>

        <div className="am-eu-grid">
          <EuCard title="材料A" eu={calc.matAEu} rate={calc.aRate} note="工程始点投入 → 月末WIPも100%" />
          <EuCard title="追加材料B" eu={calc.matBEu} rate={calc.bRate} note={mode === 'continuous' ? '加工進捗に応じる' : hasB ? '投入点通過 → 月末WIPも100%' : '投入点前 → 月末WIPは0%'} />
          <EuCard title="加工費" eu={calc.convEu} rate={calc.cRate} note="加工進捗度を反映" />
        </div>

        <div className="am-cost-split"><div><span>完成品原価</span><strong>{yen(calc.completedCost)}</strong></div><div><span>月末仕掛品原価</span><strong>{yen(calc.endingCost)}</strong></div></div>
        <div className="am-memory"><b>反射：</b><span>材料ごとに「いつ投入？」を見る。始点投入・途中一括投入・平均投入で、同じ月末仕掛品でも完成品換算量が変わる。</span></div>
      </div>
    </div>
  </section>
}

function Marker({ left, label, sub, special = false }: { left: number; label: string; sub: string; special?: boolean }) {
  const style = { left: `${left}%` }
  return <div className={special ? 'am-marker special' : 'am-marker'} style={style}><b>{label}</b><span>{sub}</span><i /></div>
}
function EuCard({ title, eu, rate, note }: { title: string; eu: number; rate: number; note: string }) {
  return <div><span>{title}</span><strong>{Math.round(eu).toLocaleString('ja-JP')}個分</strong><b>{yen(rate)} / 換算単位</b><small>{note}</small></div>
}
function Range({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="am-range"><span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
