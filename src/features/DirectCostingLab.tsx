import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`
const qty = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}個`

export default function DirectCostingLab() {
  const [production, setProduction] = useState(1000)
  const [sales, setSales] = useState(800)
  const [price, setPrice] = useState(1200)
  const [variableMfgPerUnit, setVariableMfgPerUnit] = useState(600)
  const [fixedMfgOverhead, setFixedMfgOverhead] = useState(300000)

  const calc = useMemo(() => {
    const safeSales = Math.min(sales, production)
    const endingQty = production - safeSales
    const fixedPerUnit = fixedMfgOverhead / Math.max(production, 1)
    const absorptionUnitCost = variableMfgPerUnit + fixedPerUnit
    const directUnitCost = variableMfgPerUnit
    const revenue = price * safeSales

    const absorptionCogs = absorptionUnitCost * safeSales
    const absorptionInventory = absorptionUnitCost * endingQty
    const absorptionIncome = revenue - absorptionCogs
    const fixedInAbsorptionInventory = fixedPerUnit * endingQty

    const directCogs = directUnitCost * safeSales
    const directInventory = directUnitCost * endingQty
    const directIncome = revenue - directCogs - fixedMfgOverhead
    const incomeDifference = absorptionIncome - directIncome

    return {
      safeSales,
      endingQty,
      fixedPerUnit,
      absorptionUnitCost,
      directUnitCost,
      revenue,
      absorptionCogs,
      absorptionInventory,
      absorptionIncome,
      fixedInAbsorptionInventory,
      directCogs,
      directInventory,
      directIncome,
      incomeDifference,
    }
  }, [production, sales, price, variableMfgPerUnit, fixedMfgOverhead])

  return (
    <section className="direct-cost-lab panel">
      <header className="lab-heading">
        <div>
          <p className="eyebrow">Visual Lab 04</p>
          <h2>全部原価と直接原価：「固定製造間接費の居場所」だけ追う</h2>
          <p>名前を先に覚えません。同じ工場・同じ売上でも、<strong>固定製造間接費を製品に持たせるか、当期費用にするか</strong>で利益が変わることを見ます。</p>
        </div>
        <div className="lab-location">
          <span>どこ？</span><strong>製品原価の範囲 ＞ 在庫評価 ＞ 利益計算</strong>
          <span>何を？</span><strong>固定製造間接費がB/Sに残るか、P/Lへ落ちるか</strong>
          <span>なぜ？</span><strong>全部原価計算と直接原価計算で営業利益が違う理由を理解する</strong>
        </div>
      </header>

      <div className="variance-first-action">
        <span>問題文を見たら、まず何を見る？</span>
        <strong>生産量と販売量の差＝在庫増減を見る。次に、固定製造間接費がその在庫に含まれるかを確認する。</strong>
      </div>

      <div className="direct-cost-layout">
        <aside className="variance-controls">
          <h3>同じ会社の条件</h3>
          <DRange label="生産量" value={production} min={200} max={1600} step={50} suffix="個" onChange={(v) => { setProduction(v); setSales((s) => Math.min(s, v)) }} />
          <DRange label="販売量" value={calc.safeSales} min={0} max={production} step={50} suffix="個" onChange={setSales} />
          <DRange label="販売単価" value={price} min={700} max={1800} step={50} suffix="円" onChange={setPrice} />
          <DRange label="変動製造原価/個" value={variableMfgPerUnit} min={200} max={1000} step={50} suffix="円" onChange={setVariableMfgPerUnit} />
          <DRange label="固定製造間接費" value={fixedMfgOverhead} min={50000} max={600000} step={25000} suffix="円" onChange={setFixedMfgOverhead} />
          <div className="oh-rate-summary">
            <span>期末在庫数量</span><b>{qty(calc.endingQty)}</b>
            <span>固定費率/個</span><b>{yen(calc.fixedPerUnit)}</b>
          </div>
        </aside>

        <div className="costing-comparison">
          <CostingWorld
            kind="全部原価計算"
            subtitle="固定製造間接費も製品原価へ入れる"
            unitCost={calc.absorptionUnitCost}
            inventory={calc.absorptionInventory}
            cogs={calc.absorptionCogs}
            periodFixed={fixedMfgOverhead - calc.fixedInAbsorptionInventory}
            fixedInventory={calc.fixedInAbsorptionInventory}
            income={calc.absorptionIncome}
            revenue={calc.revenue}
            direct={false}
          />
          <CostingWorld
            kind="直接（部分）原価計算"
            subtitle="製品原価に入れるのは変動製造原価だけ"
            unitCost={calc.directUnitCost}
            inventory={calc.directInventory}
            cogs={calc.directCogs}
            periodFixed={fixedMfgOverhead}
            fixedInventory={0}
            income={calc.directIncome}
            revenue={calc.revenue}
            direct
          />
        </div>
      </div>

      <div className="fixed-cost-paths">
        <div className="path-title">
          <span>固定製造間接費 {yen(fixedMfgOverhead)}</span>
          <strong>同じ金額なのに「居場所」が違う</strong>
        </div>
        <div className="path-columns">
          <div className="cost-path absorption-path">
            <b>全部原価計算</b>
            <div className="path-flow"><span>固定製造間接費</span><i>→</i><span>製品原価</span><i>→</i><span className="asset-box">未販売分 {yen(calc.fixedInAbsorptionInventory)} はB/S</span></div>
          </div>
          <div className="cost-path direct-path">
            <b>直接原価計算</b>
            <div className="path-flow"><span>固定製造間接費</span><i>→</i><span className="expense-box">全額 {yen(fixedMfgOverhead)} を当期P/L</span></div>
          </div>
        </div>
      </div>

      <div className="profit-bridge">
        <div><span>全部原価の利益</span><strong>{yen(calc.absorptionIncome)}</strong></div>
        <div className="profit-difference"><span>利益差</span><strong>{yen(Math.abs(calc.incomeDifference))}</strong><small>= 在庫に残った固定製造間接費 {yen(calc.fixedInAbsorptionInventory)}</small></div>
        <div><span>直接原価の利益</span><strong>{yen(calc.directIncome)}</strong></div>
      </div>

      <div className="partial-name-explainer">
        <b>「Partial（パーシャル）」って何が部分なの？</b>
        <p><strong>製造原価の一部分＝変動製造原価だけ</strong>を製品に持たせる、という意味で捉えます。固定製造間接費は製品に乗せず、期間費用として扱います。</p>
      </div>

      <div className="variance-memory-rule">
        <strong>反射用：</strong>
        <span>在庫が増えると、全部原価では固定製造間接費の一部がB/Sへ残る。その分だけ当期利益は直接原価より高くなりやすい。</span>
      </div>
    </section>
  )
}

function CostingWorld({ kind, subtitle, unitCost, inventory, cogs, periodFixed, fixedInventory, income, revenue, direct }: { kind: string; subtitle: string; unitCost: number; inventory: number; cogs: number; periodFixed: number; fixedInventory: number; income: number; revenue: number; direct: boolean }) {
  return <article className={direct ? 'costing-world direct-world' : 'costing-world absorption-world'}>
    <header><span>{kind}</span><small>{subtitle}</small></header>
    <div className="cost-stack">
      <div><span>製品原価/個</span><strong>{yen(unitCost)}</strong></div>
      <div className="bs-row"><span>B/S 期末製品</span><strong>{yen(inventory)}</strong>{!direct && <small>うち固定費 {yen(fixedInventory)}</small>}</div>
      <div className="pl-row"><span>P/L 売上原価</span><strong>{yen(cogs)}</strong></div>
      <div className="pl-row"><span>P/L 当期固定費</span><strong>{yen(periodFixed)}</strong></div>
    </div>
    <div className="world-profit"><span>売上 {yen(revenue)} に対する簡易利益</span><strong>{yen(income)}</strong></div>
  </article>
}

function DRange({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="variance-range">
    <span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
}
