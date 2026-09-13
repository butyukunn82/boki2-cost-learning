import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`

export default function ManufacturingCostReportLab() {
  const [beginWip, setBeginWip] = useState(120000)
  const [directMaterial, setDirectMaterial] = useState(480000)
  const [directLabor, setDirectLabor] = useState(320000)
  const [overhead, setOverhead] = useState(260000)
  const [endingWip, setEndingWip] = useState(180000)

  const calc = useMemo(() => {
    const currentManufacturing = directMaterial + directLabor + overhead
    const totalToAccount = beginWip + currentManufacturing
    const safeEnding = Math.min(endingWip, totalToAccount)
    const cogm = totalToAccount - safeEnding
    return { currentManufacturing, totalToAccount, safeEnding, cogm }
  }, [beginWip, directMaterial, directLabor, overhead, endingWip])

  return <section className="mcr-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Bridge Lab</p>
        <h2>製造原価報告書：仕掛品から完成品へいくら出た？</h2>
        <p>報告書を別暗記にしません。<strong>仕掛品勘定の中を文章形式に並べ直したもの</strong>として理解します。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>仕掛品 ＞ 完成 ＞ 製品</strong>
        <span>何を？</span><strong>当期製品製造原価</strong>
        <span>なぜ？</span><strong>当期に完成して製品へ振り替えた原価を求めるため</strong>
      </div>
    </header>

    <div className="mcr-first"><span>問題を見たら？</span><strong>月初仕掛品 ＋ 当期製造費用 − 月末仕掛品 ＝ 当期製品製造原価</strong></div>

    <div className="mcr-layout">
      <aside className="mcr-controls">
        <Range label="月初仕掛品原価" value={beginWip} max={400000} onChange={setBeginWip} />
        <Range label="直接材料費" value={directMaterial} max={900000} onChange={setDirectMaterial} />
        <Range label="直接労務費" value={directLabor} max={700000} onChange={setDirectLabor} />
        <Range label="製造間接費" value={overhead} max={700000} onChange={setOverhead} />
        <Range label="月末仕掛品原価" value={calc.safeEnding} max={calc.totalToAccount} onChange={setEndingWip} />
      </aside>

      <div className="mcr-main">
        <div className="mcr-two-view">
          <article className="mcr-report">
            <h3>製造原価報告書</h3>
            <Row label="直接材料費" value={directMaterial} />
            <Row label="直接労務費" value={directLabor} />
            <Row label="製造間接費" value={overhead} />
            <Row label="当期総製造費用" value={calc.currentManufacturing} strong />
            <Row label="＋ 月初仕掛品原価" value={beginWip} />
            <Row label="合計" value={calc.totalToAccount} strong />
            <Row label="− 月末仕掛品原価" value={calc.safeEnding} />
            <Row label="当期製品製造原価" value={calc.cogm} final />
          </article>

          <article className="mcr-taccount">
            <h3>仕掛品 T勘定</h3>
            <div className="mcr-t-head"><span>借方：入ってきた原価</span><span>貸方：出ていく/残る原価</span></div>
            <div className="mcr-t-body">
              <div><p>月初 {yen(beginWip)}</p><p>直接材料 {yen(directMaterial)}</p><p>直接労務 {yen(directLabor)}</p><p>製造間接費 {yen(overhead)}</p></div>
              <div><p>製品へ {yen(calc.cogm)}</p><p>月末残高 {yen(calc.safeEnding)}</p></div>
            </div>
            <div className="mcr-balance"><span>借方合計 {yen(calc.totalToAccount)}</span><b>=</b><span>貸方合計 {yen(calc.cogm + calc.safeEnding)}</span></div>
          </article>
        </div>

        <div className="mcr-flow">
          <div><span>当期投入</span><strong>{yen(calc.currentManufacturing)}</strong></div><b>＋</b><div><span>前月から製造中</span><strong>{yen(beginWip)}</strong></div><b>−</b><div><span>まだ未完成</span><strong>{yen(calc.safeEnding)}</strong></div><b>＝</b><div className="mcr-result"><span>完成して製品へ</span><strong>{yen(calc.cogm)}</strong></div>
        </div>
        <div className="mcr-memory"><b>反射：</b><span>製造原価報告書は「仕掛品から製品へ出た金額」を求める表。月末仕掛品は消えず、次期のB/Sに残る。</span></div>
      </div>
    </div>
  </section>
}

function Row({ label, value, strong = false, final = false }: { label: string; value: number; strong?: boolean; final?: boolean }) {
  return <div className={`${strong ? 'mcr-row strong' : 'mcr-row'}${final ? ' final' : ''}`}><span>{label}</span><b>{yen(value)}</b></div>
}
function Range({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  const safeMax = Math.max(0, Math.round(max))
  return <label className="mcr-range"><span><b>{label}</b><strong>{yen(value)}</strong></span><input type="range" min="0" max={safeMax} step="10000" value={Math.min(value, safeMax)} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
