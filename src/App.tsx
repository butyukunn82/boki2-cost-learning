import { useMemo, useState } from 'react'
import { learningLocations } from './data/concepts'

type View = 'factory' | 'journal' | 'taccount' | 'statements'
type Focus = 'material' | 'wip' | 'finished' | 'sold'

type Values = {
  material: number
  overhead: number
  wip: number
  product: number
  cogs: number
  availableWip: number
  safeCompleted: number
  safeSold: number
  safeDirectMaterial: number
  safeIndirectMaterial: number
}

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}万円`

const flowSteps = [
  { title: '材料を買う', cue: 'まず「材料」という資産が増える。まだ費用ではありません。', focus: 'material' as Focus, route: 'purchase' },
  { title: '直接材料を投入', cue: 'どの製品に使ったか直接わかる材料は、仕掛品へ直行します。', focus: 'wip' as Focus, route: 'direct' },
  { title: '間接費を集める', cue: '間接材料・間接労務費・間接経費は、いったん製造間接費へ集めます。', focus: 'wip' as Focus, route: 'overhead-in' },
  { title: '製造間接費を配賦', cue: '集めた製造間接費を、配賦して仕掛品へ入れます。', focus: 'wip' as Focus, route: 'overhead-out' },
  { title: '完成品へ振り替える', cue: '完成した分だけ、仕掛品から製品へ居場所が変わります。', focus: 'finished' as Focus, route: 'complete' },
  { title: '売れた分を費用化', cue: '売れた瞬間に、製品という資産から売上原価という費用へ移ります。', focus: 'sold' as Focus, route: 'sold' },
]

function App() {
  const [view, setView] = useState<View>('factory')
  const [focus, setFocus] = useState<Focus>('material')
  const [step, setStep] = useState(0)
  const [purchase, setPurchase] = useState(120)
  const [directMaterial, setDirectMaterial] = useState(70)
  const [indirectMaterial, setIndirectMaterial] = useState(10)
  const [directLabor, setDirectLabor] = useState(40)
  const [indirectLabor, setIndirectLabor] = useState(12)
  const [indirectExpense, setIndirectExpense] = useState(18)
  const [completed, setCompleted] = useState(120)
  const [sold, setSold] = useState(90)

  const values = useMemo<Values>(() => {
    const safeDirectMaterial = Math.min(directMaterial, purchase)
    const safeIndirectMaterial = Math.min(indirectMaterial, Math.max(0, purchase - safeDirectMaterial))
    const material = Math.max(0, purchase - safeDirectMaterial - safeIndirectMaterial)
    const overhead = safeIndirectMaterial + indirectLabor + indirectExpense
    const availableWip = safeDirectMaterial + directLabor + overhead
    const safeCompleted = Math.min(completed, availableWip)
    const wip = availableWip - safeCompleted
    const safeSold = Math.min(sold, safeCompleted)
    const product = safeCompleted - safeSold
    return { material, overhead, wip, product, cogs: safeSold, availableWip, safeCompleted, safeSold, safeDirectMaterial, safeIndirectMaterial }
  }, [purchase, directMaterial, indirectMaterial, directLabor, indirectLabor, indirectExpense, completed, sold])

  const loc = learningLocations[focus]
  const activeStep = flowSteps[step]

  const moveStep = (next: number) => {
    const index = (next + flowSteps.length) % flowSteps.length
    setStep(index)
    setFocus(flowSteps[index].focus)
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">簿記2級・工業簿記</p>
          <h1>原価の旅</h1>
          <p className="lead">原価は消えません。材料・仕掛品・製品・費用へと「居場所」が変わります。直接費と間接費の別ルートも同時に追います。</p>
        </div>
        <div className="version">v0.2 moving flow</div>
      </header>

      <section className="location-card">
        <div><span>どこ？</span><strong>{loc.where}</strong></div>
        <div><span>何を？</span><strong>{loc.what}</strong></div>
        <div><span>なぜ？</span><strong>{loc.why}</strong></div>
      </section>

      <section className="first-look panel">
        <div>
          <span className="mini-label">問題を見たら、まず何を見る？</span>
          <strong>{loc.firstLook}</strong>
        </div>
        <div className="step-player">
          <button onClick={() => moveStep(step - 1)} aria-label="前の流れ">←</button>
          <div>
            <small>流れ {step + 1} / {flowSteps.length}</small>
            <b>{activeStep.title}</b>
            <span>{activeStep.cue}</span>
          </div>
          <button onClick={() => moveStep(step + 1)} aria-label="次の流れ">→</button>
        </div>
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
          <Range label="材料購入" value={purchase} max={180} onChange={setPurchase} />
          <div className="control-group">
            <p>材料の使い方</p>
            <Range label="直接材料" value={directMaterial} max={Math.max(0, purchase - indirectMaterial)} onChange={setDirectMaterial} />
            <Range label="間接材料" value={indirectMaterial} max={Math.max(0, purchase - directMaterial)} onChange={setIndirectMaterial} />
          </div>
          <div className="control-group">
            <p>人・経費</p>
            <Range label="直接労務費" value={directLabor} max={100} onChange={setDirectLabor} />
            <Range label="間接労務費" value={indirectLabor} max={60} onChange={setIndirectLabor} />
            <Range label="間接経費" value={indirectExpense} max={80} onChange={setIndirectExpense} />
          </div>
          <Range label="完成振替" value={completed} max={values.availableWip} onChange={setCompleted} />
          <Range label="販売分原価" value={sold} max={values.safeCompleted} onChange={setSold} />
          <p className="control-note">数字を変えると、工場・仕訳・T勘定・B/S・P/Lが同時に変わります。</p>
        </aside>

        <section className="main-panel panel">
          <div className="tabs">
            <Tab active={view === 'factory'} onClick={() => setView('factory')}>工場</Tab>
            <Tab active={view === 'journal'} onClick={() => setView('journal')}>仕訳</Tab>
            <Tab active={view === 'taccount'} onClick={() => setView('taccount')}>T勘定</Tab>
            <Tab active={view === 'statements'} onClick={() => setView('statements')}>B/S・P/L</Tab>
          </div>

          {view === 'factory' && <FactoryView values={values} focus={focus} route={activeStep.route} directLabor={directLabor} indirectLabor={indirectLabor} indirectExpense={indirectExpense} />}
          {view === 'journal' && <JournalView purchase={purchase} directMaterial={values.safeDirectMaterial} indirectMaterial={values.safeIndirectMaterial} directLabor={directLabor} indirectLabor={indirectLabor} indirectExpense={indirectExpense} overhead={values.overhead} completed={values.safeCompleted} sold={values.safeSold} />}
          {view === 'taccount' && <TAccountView purchase={purchase} directMaterial={values.safeDirectMaterial} indirectMaterial={values.safeIndirectMaterial} directLabor={directLabor} indirectLabor={indirectLabor} indirectExpense={indirectExpense} values={values} />}
          {view === 'statements' && <StatementsView values={values} />}
        </section>
      </section>

      <section className="compare-strip panel">
        <div><span>直接費</span><strong>製品に直接たどれる → 仕掛品へ直行</strong><small>直接材料費・直接労務費</small></div>
        <div><span>間接費</span><strong>製品に直接たどれない → 製造間接費へ集めて配賦</strong><small>間接材料費・間接労務費・間接経費</small></div>
      </section>

      <section className="insight panel">
        <h2>ここで覚える一言</h2>
        <p><strong>「直接か間接か」で入口が分かれ、売れたかどうかで出口が分かれる。</strong> 直接費は仕掛品へ直行。間接費は製造間接費を経由。売れるまではB/S、売れた瞬間にP/Lへ移ります。</p>
      </section>
    </main>
  )
}

function Range({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  const safeMax = Math.max(0, Math.round(max))
  const safeValue = Math.min(value, safeMax)
  return <label className="range-row">
    <span><strong>{label}</strong><b>{yen(safeValue)}</b></span>
    <input type="range" min="0" max={safeMax} step="2" value={safeValue} onChange={(e) => onChange(Number(e.target.value))} />
  </label>
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={active ? 'tab active' : 'tab'} onClick={onClick}>{children}</button>
}

function FlowArrow({ active, label, className = '' }: { active: boolean; label?: string; className?: string }) {
  const classes = `${className} flow-arrow${active ? ' active' : ''}`.trim()
  return <div className={classes}>
    {label && <small>{label}</small>}
    <div className="arrow-line"><i /></div>
  </div>
}

function FactoryView({ values, focus, route, directLabor, indirectLabor, indirectExpense }: { values: Values; focus: Focus; route: string; directLabor: number; indirectLabor: number; indirectExpense: number }) {
  return <div className="factory-view">
    <div className="route-legend">
      <span><i className="legend-dot direct" />直接ルート</span>
      <span><i className="legend-dot indirect" />間接ルート</span>
    </div>

    <div className="factory-map">
      <div className={focus === 'material' ? 'cost-node material focus' : 'cost-node material'}>
        <small>材料倉庫</small><strong>{yen(values.material)}</strong>
      </div>

      <div className="direct-lane">
        <FlowArrow active={route === 'direct'} label="直接材料" />
        <div className="source-chip">直接労務 {yen(directLabor)}</div>
        <FlowArrow active={route === 'direct'} />
      </div>

      <div className={focus === 'wip' ? 'cost-node wip focus' : 'cost-node wip'}>
        <small>仕掛品</small><strong>{yen(values.wip)}</strong>
        <em>製造中の資産</em>
      </div>

      <FlowArrow className="to-finished" active={route === 'complete'} label="完成" />

      <div className={focus === 'finished' ? 'cost-node finished focus' : 'cost-node finished'}>
        <small>製品</small><strong>{yen(values.product)}</strong>
        <em>完成したが未販売</em>
      </div>

      <div className="boundary">
        <span>B/S</span><b>資産と費用の境界</b><span>P/L</span>
      </div>

      <FlowArrow className="to-sold" active={route === 'sold'} label="販売" />

      <div className={focus === 'sold' ? 'cost-node sold focus' : 'cost-node sold'}>
        <small>売上原価</small><strong>{yen(values.cogs)}</strong>
        <em>ここで初めて費用</em>
      </div>

      <div className="indirect-source">
        <small>間接費の発生</small>
        <b>間接材料 {yen(values.safeIndirectMaterial)}</b>
        <b>間接労務 {yen(indirectLabor)}</b>
        <b>間接経費 {yen(indirectExpense)}</b>
      </div>
      <FlowArrow className="to-overhead" active={route === 'overhead-in'} label="集める" />
      <div className={route === 'overhead-in' || route === 'overhead-out' ? 'cost-node overhead active-overhead' : 'cost-node overhead'}>
        <small>製造間接費</small><strong>{yen(values.overhead)}</strong>
        <em>いったんプール</em>
      </div>
      <FlowArrow className="overhead-to-wip" active={route === 'overhead-out'} label="配賦" />
    </div>

    <div className="factory-caption">
      <strong>いま動いているルート：</strong>
      <span>{route === 'direct' ? '直接費 → 仕掛品' : route.startsWith('overhead') ? '間接費 → 製造間接費 → 仕掛品' : route === 'complete' ? '仕掛品 → 製品' : route === 'sold' ? '製品 → 売上原価' : '材料を購入して資産として保有'}</span>
    </div>
  </div>
}

function JournalView({ purchase, directMaterial, indirectMaterial, directLabor, indirectLabor, indirectExpense, overhead, completed, sold }: { purchase: number; directMaterial: number; indirectMaterial: number; directLabor: number; indirectLabor: number; indirectExpense: number; overhead: number; completed: number; sold: number }) {
  const rows = [
    ['材料を購入', '材料', purchase, '現金等', purchase],
    ['直接材料を投入', '仕掛品', directMaterial, '材料', directMaterial],
    ['間接材料を投入', '製造間接費', indirectMaterial, '材料', indirectMaterial],
    ['直接労務費を投入', '仕掛品', directLabor, '賃金等', directLabor],
    ['間接労務費が発生', '製造間接費', indirectLabor, '賃金等', indirectLabor],
    ['間接経費が発生', '製造間接費', indirectExpense, '現金等', indirectExpense],
    ['製造間接費を配賦', '仕掛品', overhead, '製造間接費', overhead],
    ['完成品へ振替', '製品', completed, '仕掛品', completed],
    ['販売分を費用化', '売上原価', sold, '製品', sold],
  ]
  return <div className="journal-list">
    {rows.map((r) => <div className="journal-row" key={String(r[0])}>
      <small>{r[0]}</small><div><span>{r[1]}</span><b>{yen(Number(r[2]))}</b><em>/</em><span>{r[3]}</span><b>{yen(Number(r[4]))}</b></div>
    </div>)}
  </div>
}

function TAccountView({ purchase, directMaterial, indirectMaterial, directLabor, indirectLabor, indirectExpense, values }: { purchase: number; directMaterial: number; indirectMaterial: number; directLabor: number; indirectLabor: number; indirectExpense: number; values: Values }) {
  const accounts = [
    ['材料', `購入 ${yen(purchase)}`, `直接 ${yen(directMaterial)} + 間接 ${yen(indirectMaterial)}`, `残高 ${yen(values.material)}`],
    ['製造間接費', `間接材料 ${yen(indirectMaterial)} + 間接労務 ${yen(indirectLabor)} + 間接経費 ${yen(indirectExpense)}`, `仕掛品へ配賦 ${yen(values.overhead)}`, '配賦後残高 0万円'],
    ['仕掛品', `直接材料 ${yen(directMaterial)} + 直接労務 ${yen(directLabor)} + 配賦 ${yen(values.overhead)}`, `製品へ ${yen(values.safeCompleted)}`, `残高 ${yen(values.wip)}`],
    ['製品', `仕掛品から ${yen(values.safeCompleted)}`, `売上原価へ ${yen(values.safeSold)}`, `残高 ${yen(values.product)}`],
  ]
  return <div className="tgrid four">{accounts.map((a) => <div className="tcard" key={a[0]}><h3>{a[0]}</h3><div className="tline"><span>借方</span><span>貸方</span></div><div className="tbody"><p>{a[1]}</p><p>{a[2]}</p></div><strong>{a[3]}</strong></div>)}</div>
}

function StatementsView({ values }: { values: Values }) {
  const inventory = values.material + values.wip + values.product
  return <div className="statements">
    <div className="statement-card asset"><h3>B/S 棚卸資産</h3><p>材料 <b>{yen(values.material)}</b></p><p>仕掛品 <b>{yen(values.wip)}</b></p><p>製品 <b>{yen(values.product)}</b></p><strong>合計 {yen(inventory)}</strong><small>まだ売れていない原価は「将来売上を生む資産」としてここに残ります。</small></div>
    <div className="statement-card expense"><h3>P/L 費用</h3><p>売上原価 <b>{yen(values.cogs)}</b></p><strong>費用化 {yen(values.cogs)}</strong><small>売れた分だけが、資産から費用へ移ります。</small></div>
    <div className="statement-bridge"><span>{yen(inventory)} はまだB/S</span><b>販売すると →</b><span>{yen(values.cogs)} はP/L</span></div>
  </div>
}

export default App
