import { useMemo, useState } from 'react'
import { learningLocations } from './data/concepts'

type View = 'factory' | 'journal' | 'taccount' | 'statements'
type Focus = 'material' | 'wip' | 'finished' | 'sold'

const yen = (v: number) => `${v.toLocaleString('ja-JP')}万円`

function App() {
  const [view, setView] = useState<View>('factory')
  const [focus, setFocus] = useState<Focus>('material')
  const [purchase, setPurchase] = useState(100)
  const [materialUsed, setMaterialUsed] = useState(80)
  const [labor, setLabor] = useState(50)
  const [overhead, setOverhead] = useState(30)
  const [completed, setCompleted] = useState(140)
  const [sold, setSold] = useState(100)

  const values = useMemo(() => {
    const material = Math.max(0, purchase - materialUsed)
    const availableWip = materialUsed + labor + overhead
    const safeCompleted = Math.min(completed, availableWip)
    const wip = availableWip - safeCompleted
    const safeSold = Math.min(sold, safeCompleted)
    const product = safeCompleted - safeSold
    return { material, wip, product, cogs: safeSold, availableWip, safeCompleted, safeSold }
  }, [purchase, materialUsed, labor, overhead, completed, sold])

  const loc = learningLocations[focus]

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">簿記2級・工業簿記</p>
          <h1>原価の旅</h1>
          <p className="lead">同じ原価が、工場・仕訳・T勘定・B/S・P/Lでどう見えるかをつなげて理解する。</p>
        </div>
        <div className="version">v0.1 vertical slice</div>
      </header>

      <section className="location-card">
        <div><span>どこ？</span><strong>{loc.where}</strong></div>
        <div><span>何を？</span><strong>{loc.what}</strong></div>
        <div><span>なぜ？</span><strong>{loc.why}</strong></div>
      </section>

      <nav className="journey" aria-label="原価の旅">
        {[
          ['material', '材料'], ['wip', '仕掛品'], ['finished', '製品'], ['sold', '売上原価']
        ].map(([id, label], i) => (
          <button key={id} className={focus === id ? 'journey-step active' : 'journey-step'} onClick={() => setFocus(id as Focus)}>
            <span>{i + 1}</span>{label}
          </button>
        ))}
      </nav>

      <section className="workspace">
        <aside className="controls panel">
          <h2>条件を動かす</h2>
          <Range label="材料購入" value={purchase} max={160} onChange={setPurchase} />
          <Range label="材料投入" value={materialUsed} max={purchase} onChange={setMaterialUsed} />
          <Range label="直接労務費" value={labor} max={100} onChange={setLabor} />
          <Range label="製造間接費" value={overhead} max={100} onChange={setOverhead} />
          <Range label="完成振替" value={completed} max={values.availableWip} onChange={setCompleted} />
          <Range label="販売分原価" value={sold} max={values.safeCompleted} onChange={setSold} />
          <p className="control-note">数字を変えると、すべての見え方が同時に変わります。</p>
        </aside>

        <section className="main-panel panel">
          <div className="tabs">
            <Tab active={view === 'factory'} onClick={() => setView('factory')}>工場</Tab>
            <Tab active={view === 'journal'} onClick={() => setView('journal')}>仕訳</Tab>
            <Tab active={view === 'taccount'} onClick={() => setView('taccount')}>T勘定</Tab>
            <Tab active={view === 'statements'} onClick={() => setView('statements')}>B/S・P/L</Tab>
          </div>

          {view === 'factory' && <FactoryView values={values} focus={focus} />}
          {view === 'journal' && <JournalView purchase={purchase} materialUsed={materialUsed} labor={labor} overhead={overhead} completed={values.safeCompleted} sold={values.safeSold} />}
          {view === 'taccount' && <TAccountView purchase={purchase} materialUsed={materialUsed} labor={labor} overhead={overhead} values={values} />}
          {view === 'statements' && <StatementsView values={values} />}
        </section>
      </section>

      <section className="insight panel">
        <h2>ここで覚える一言</h2>
        <p><strong>原価は消えるのではなく、居場所が変わる。</strong> 売れるまでは材料・仕掛品・製品としてB/Sに残り、売れた瞬間に売上原価としてP/Lへ移る。</p>
      </section>
    </main>
  )
}

function Range({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  const safeMax = Math.max(0, Math.round(max))
  return <label className="range-row">
    <span><strong>{label}</strong><b>{yen(value)}</b></span>
    <input type="range" min="0" max={safeMax} step="5" value={Math.min(value, safeMax)} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={active ? 'tab active' : 'tab'} onClick={onClick}>{children}</button>
}

function FactoryView({ values, focus }: { values: { material: number; wip: number; product: number; cogs: number }; focus: Focus }) {
  const boxes = [
    ['material', '材料倉庫', values.material],
    ['wip', '製造中', values.wip],
    ['finished', '製品倉庫', values.product],
    ['sold', '売上原価', values.cogs],
  ] as const
  return <div className="factory-view">
    <div className="factory-flow">
      {boxes.map(([id, label, value], idx) => <div className="flow-group" key={id}>
        <div className={focus === id ? 'cost-box focus' : 'cost-box'}>
          <small>{label}</small><strong>{yen(value)}</strong>
        </div>
        {idx < boxes.length - 1 && <div className="arrow">→</div>}
      </div>)}
    </div>
    <div className="bspl-split"><span>B/Sに残る：材料・仕掛品・製品</span><span>P/Lへ：売上原価</span></div>
  </div>
}

function JournalView({ purchase, materialUsed, labor, overhead, completed, sold }: any) {
  const rows = [
    ['材料を購入', '材料', purchase, '現金等', purchase],
    ['材料を製造へ投入', '仕掛品', materialUsed, '材料', materialUsed],
    ['直接労務費を投入', '仕掛品', labor, '賃金等', labor],
    ['製造間接費を配賦', '仕掛品', overhead, '製造間接費', overhead],
    ['完成品へ振替', '製品', completed, '仕掛品', completed],
    ['販売分を費用化', '売上原価', sold, '製品', sold],
  ]
  return <div className="journal-list">
    {rows.map((r) => <div className="journal-row" key={r[0]}>
      <small>{r[0]}</small><div><span>{r[1]}</span><b>{yen(Number(r[2]))}</b><em>/</em><span>{r[3]}</span><b>{yen(Number(r[4]))}</b></div>
    </div>)}
  </div>
}

function TAccountView({ purchase, materialUsed, labor, overhead, values }: any) {
  const accounts = [
    ['材料', `購入 ${yen(purchase)}`, `仕掛品へ ${yen(materialUsed)}`, `残高 ${yen(values.material)}`],
    ['仕掛品', `材料 ${yen(materialUsed)} + 労務 ${yen(labor)} + 間接費 ${yen(overhead)}`, `製品へ ${yen(values.safeCompleted)}`, `残高 ${yen(values.wip)}`],
    ['製品', `仕掛品から ${yen(values.safeCompleted)}`, `売上原価へ ${yen(values.safeSold)}`, `残高 ${yen(values.product)}`],
  ]
  return <div className="tgrid">{accounts.map((a) => <div className="tcard" key={a[0]}><h3>{a[0]}</h3><div className="tline"><span>借方</span><span>貸方</span></div><div className="tbody"><p>{a[1]}</p><p>{a[2]}</p></div><strong>{a[3]}</strong></div>)}</div>
}

function StatementsView({ values }: any) {
  return <div className="statements">
    <div className="statement-card"><h3>B/S 棚卸資産</h3><p>材料 <b>{yen(values.material)}</b></p><p>仕掛品 <b>{yen(values.wip)}</b></p><p>製品 <b>{yen(values.product)}</b></p><strong>合計 {yen(values.material + values.wip + values.product)}</strong></div>
    <div className="statement-card"><h3>P/L</h3><p>売上原価 <b>{yen(values.cogs)}</b></p><small>売れた分だけ、ここで初めて費用になります。</small></div>
  </div>
}

export default App
