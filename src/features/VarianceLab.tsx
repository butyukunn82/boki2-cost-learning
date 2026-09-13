import { useMemo, useState } from 'react'

type Stage = 'standard' | 'quantity' | 'actual' | 'overlay'

const money = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`
const units = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}個`

export default function VarianceLab() {
  const [standardPrice, setStandardPrice] = useState(500)
  const [actualPrice, setActualPrice] = useState(540)
  const [standardQty, setStandardQty] = useState(100)
  const [actualQty, setActualQty] = useState(115)
  const [stage, setStage] = useState<Stage>('overlay')

  const calc = useMemo(() => {
    const standardCost = standardPrice * standardQty
    const middleCost = standardPrice * actualQty
    const actualCost = actualPrice * actualQty

    // 簿記2級で一般的な「不利を＋、有利を−」の見せ方。
    // 数量差異：標準価格 × (実際数量 − 標準数量)
    // 価格差異：実際数量 × (実際価格 − 標準価格)
    const quantityVariance = standardPrice * (actualQty - standardQty)
    const priceVariance = actualQty * (actualPrice - standardPrice)
    const totalVariance = actualCost - standardCost
    const overlap = (actualPrice - standardPrice) * (actualQty - standardQty)

    return {
      standardCost,
      middleCost,
      actualCost,
      quantityVariance,
      priceVariance,
      totalVariance,
      overlap,
    }
  }, [standardPrice, actualPrice, standardQty, actualQty])

  const maxPrice = Math.max(standardPrice, actualPrice, 1) * 1.12
  const maxQty = Math.max(standardQty, actualQty, 1) * 1.12
  const chartW = 520
  const chartH = 300
  const left = 62
  const top = 22
  const innerW = 410
  const innerH = 220
  const x = (q: number) => left + (q / maxQty) * innerW
  const y = (p: number) => top + innerH - (p / maxPrice) * innerH
  const rect = (q: number, p: number) => ({
    x: left,
    y: y(p),
    width: Math.max(0, x(q) - left),
    height: Math.max(0, top + innerH - y(p)),
  })

  const standardRect = rect(standardQty, standardPrice)
  const middleRect = rect(actualQty, standardPrice)
  const actualRect = rect(actualQty, actualPrice)

  const quantityLabel = varianceLabel(calc.quantityVariance)
  const priceLabel = varianceLabel(calc.priceVariance)
  const totalLabel = varianceLabel(calc.totalVariance)

  return (
    <section className="variance-lab panel">
      <header className="lab-heading">
        <div>
          <p className="eyebrow">Visual Lab 02</p>
          <h2>直接材料費差異：価格と数量を分ける</h2>
          <p>「標準」から「実際」へ一気に飛ばず、途中に <strong>標準価格 × 実際数量</strong> を置くと、差異が2つに分かれます。</p>
        </div>
        <div className="lab-location">
          <span>どこ？</span>
          <strong>標準原価計算 ＞ 直接材料費 ＞ 差異分析</strong>
          <span>何を？</span>
          <strong>標準原価と実際原価の差を「数量」と「価格」に分解</strong>
          <span>なぜ？</span>
          <strong>ズレの原因を、使い過ぎと買値の違いに切り分けるため</strong>
        </div>
      </header>

      <div className="variance-first-action">
        <span>問題文を見たら、まず何をする？</span>
        <strong>SP・AP・SQ・AQを4つに分ける。次に「数量→価格」の順で標準から実際へ橋をかける。</strong>
      </div>

      <div className="variance-stage-buttons" aria-label="差異分解の段階">
        <button className={stage === 'standard' ? 'active' : ''} onClick={() => setStage('standard')}>1 標準</button>
        <button className={stage === 'quantity' ? 'active' : ''} onClick={() => setStage('quantity')}>2 数量を実際へ</button>
        <button className={stage === 'actual' ? 'active' : ''} onClick={() => setStage('actual')}>3 価格を実際へ</button>
        <button className={stage === 'overlay' ? 'active' : ''} onClick={() => setStage('overlay')}>重ねて見る</button>
      </div>

      <div className="variance-layout">
        <aside className="variance-controls">
          <h3>条件を動かす</h3>
          <NumberRange label="標準価格 SP" value={standardPrice} min={100} max={900} step={10} suffix="円" onChange={setStandardPrice} />
          <NumberRange label="実際価格 AP" value={actualPrice} min={100} max={900} step={10} suffix="円" onChange={setActualPrice} />
          <NumberRange label="標準数量 SQ" value={standardQty} min={20} max={180} step={5} suffix="個" onChange={setStandardQty} />
          <NumberRange label="実際数量 AQ" value={actualQty} min={20} max={180} step={5} suffix="個" onChange={setActualQty} />
          <div className="symbol-key">
            <b>SP</b><span>Standard Price 標準価格</span>
            <b>AP</b><span>Actual Price 実際価格</span>
            <b>SQ</b><span>Standard Quantity 標準数量</span>
            <b>AQ</b><span>Actual Quantity 実際数量</span>
          </div>
        </aside>

        <div className="variance-visual">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="価格と数量の長方形による直接材料費差異の分解図">
            <line x1={left} y1={top + innerH} x2={left + innerW + 10} y2={top + innerH} className="axis" />
            <line x1={left} y1={top + innerH} x2={left} y2={top - 4} className="axis" />
            <text x={left + innerW / 2} y={286} className="axis-label">数量（横）</text>
            <text x={15} y={top + innerH / 2} className="axis-label vertical">価格（縦）</text>

            {(stage === 'standard' || stage === 'quantity' || stage === 'actual' || stage === 'overlay') && (
              <rect {...standardRect} className="rect-standard" />
            )}
            {(stage === 'quantity' || stage === 'actual' || stage === 'overlay') && (
              <rect {...middleRect} className="rect-middle" />
            )}
            {(stage === 'actual' || stage === 'overlay') && (
              <rect {...actualRect} className="rect-actual" />
            )}

            <line x1={x(standardQty)} y1={top} x2={x(standardQty)} y2={top + innerH} className="guide standard-guide" />
            <line x1={x(actualQty)} y1={top} x2={x(actualQty)} y2={top + innerH} className="guide actual-guide" />
            <line x1={left} y1={y(standardPrice)} x2={left + innerW} y2={y(standardPrice)} className="guide standard-guide" />
            <line x1={left} y1={y(actualPrice)} x2={left + innerW} y2={y(actualPrice)} className="guide actual-guide" />

            <text x={x(standardQty)} y={260} textAnchor="middle" className="tick standard-text">SQ {standardQty}</text>
            <text x={x(actualQty)} y={276} textAnchor="middle" className="tick actual-text">AQ {actualQty}</text>
            <text x={left - 8} y={y(standardPrice) + 4} textAnchor="end" className="tick standard-text">SP {standardPrice}</text>
            <text x={left - 8} y={y(actualPrice) + 4} textAnchor="end" className="tick actual-text">AP {actualPrice}</text>
          </svg>

          <div className="stage-explanation">
            {stage === 'standard' && <><b>① 標準の世界</b><span>SP × SQ = {money(calc.standardCost)}</span><p>「本来この価格で、この数量だけ使うはずだった」という基準点です。</p></>}
            {stage === 'quantity' && <><b>② まず数量だけ実際へ</b><span>SP × AQ = {money(calc.middleCost)}</span><p>価格は標準のまま固定して、数量だけSQ→AQへ動かします。この増減が数量差異です。</p></>}
            {stage === 'actual' && <><b>③ 次に価格を実際へ</b><span>AP × AQ = {money(calc.actualCost)}</span><p>すでに数量はAQです。そのAQ全部に対して価格をSP→APへ変えるので、重複部分も価格差異側に入ります。</p></>}
            {stage === 'overlay' && <><b>3つを重ねる</b><span>標準 → 中間 → 実際</span><p>差異を「数量を変える段階」と「価格を変える段階」に分けているだけです。公式はこの動きを式にしたものです。</p></>}
          </div>
        </div>
      </div>

      <div className="variance-results">
        <VarianceCard title="数量差異" formula="SP × (AQ − SQ)" amount={calc.quantityVariance} label={quantityLabel} detail={`${money(standardPrice)}ではなく、標準価格 ${standardPrice}円 × (${actualQty}個 − ${standardQty}個)`} />
        <VarianceCard title="価格差異" formula="AQ × (AP − SP)" amount={calc.priceVariance} label={priceLabel} detail={`実際数量 ${actualQty}個 × (${actualPrice}円 − ${standardPrice}円)`} />
        <VarianceCard title="合計差異" formula="実際原価 − 標準原価" amount={calc.totalVariance} label={totalLabel} detail={`${money(calc.actualCost)} − ${money(calc.standardCost)}`} />
      </div>

      <div className="overlap-explainer">
        <div>
          <span>いちばん引っかかる所</span>
          <h3>価格と数量が両方ズレた「重複部分」はなぜ価格差異？</h3>
          <p>このLabでは <strong>①数量を先にAQへ動かし、②そのAQ全体に対して価格をAPへ動かす</strong> 順序にしています。だから、両方がズレた部分は②の価格変更で生まれ、価格差異に含まれます。</p>
        </div>
        <div className="overlap-number">
          <small>重複部分（理解用）</small>
          <strong>{money(Math.abs(calc.overlap))}</strong>
          <span>(AP − SP) × (AQ − SQ)</span>
          <em>※これは独立した第3の差異として計上するのではなく、分解の理解用です。</em>
        </div>
      </div>

      <div className="variance-memory-rule">
        <strong>反射用：</strong>
        <span>数量差異は「標準価格」で測る。価格差異は「実際数量」で測る。</span>
      </div>
    </section>
  )
}

function NumberRange({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="variance-range">
    <span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
}

function VarianceCard({ title, formula, amount, label, detail }: { title: string; formula: string; amount: number; label: string; detail: string }) {
  return <article className={amount > 0 ? 'variance-card unfavorable' : amount < 0 ? 'variance-card favorable' : 'variance-card'}>
    <span>{title}</span>
    <small>{formula}</small>
    <strong>{money(Math.abs(amount))}</strong>
    <b>{label}</b>
    <p>{detail}</p>
  </article>
}

function varianceLabel(value: number) {
  if (value > 0) return '不利差異'
  if (value < 0) return '有利差異'
  return '差異なし'
}
