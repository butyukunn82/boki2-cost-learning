import { useMemo, useState } from 'react'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`

export default function DepartmentAllocationLab() {
  const [machining, setMachining] = useState(900000)
  const [assembly, setAssembly] = useState(700000)
  const [power, setPower] = useState(300000)
  const [repair, setRepair] = useState(240000)

  const calc = useMemo(() => {
    // 第1次配賦：補助部門費を他の補助部門も含めて配賦（自部門を除く）
    const powerToMachining = power * .4
    const powerToAssembly = power * .4
    const powerToRepair = power * .2

    const repairToMachining = repair * .45
    const repairToAssembly = repair * .35
    const repairToPower = repair * .2

    // 第2次配賦：第1次配賦で補助部門が受け取った額だけを製造部門へ直接配賦
    const powerReceived = repairToPower
    const repairReceived = powerToRepair

    // 製造部門だけの比率へ正規化
    const powerSecondToMachining = powerReceived * .5
    const powerSecondToAssembly = powerReceived * .5
    const repairSecondToMachining = repairReceived * (.45 / (.45 + .35))
    const repairSecondToAssembly = repairReceived * (.35 / (.45 + .35))

    const machiningFinal = machining + powerToMachining + repairToMachining + powerSecondToMachining + repairSecondToMachining
    const assemblyFinal = assembly + powerToAssembly + repairToAssembly + powerSecondToAssembly + repairSecondToAssembly
    const total = machining + assembly + power + repair

    return {
      powerToMachining, powerToAssembly, powerToRepair,
      repairToMachining, repairToAssembly, repairToPower,
      powerReceived, repairReceived,
      powerSecondToMachining, powerSecondToAssembly,
      repairSecondToMachining, repairSecondToAssembly,
      machiningFinal, assemblyFinal, total,
    }
  }, [machining, assembly, power, repair])

  return <section className="department-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Visual Lab 07</p>
        <h2>部門別計算：簡便法の相互配賦を「2回の移動」で見る</h2>
        <p>補助部門同士もサービスをやり取りするので、1回で消しません。<strong>第1次で相互関係を反映し、第2次で残った補助部門費を製造部門だけへ配ります。</strong></p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>製造間接費 ＞ 部門別計算 ＞ 補助部門費配賦</strong>
        <span>何を？</span><strong>動力部・修繕部の原価を機械部・組立部へ移す</strong>
        <span>なぜ？</span><strong>最終的に製造部門費へ集め、製品へ配賦できる状態にする</strong>
      </div>
    </header>

    <div className="variance-first-action">
      <span>問題文を見たら、まず何を見る？</span>
      <strong>「直接配賦法」か「相互配賦法」か。相互配賦法なら第1次と第2次の2段階を先に書く。</strong>
    </div>

    <div className="dept-layout">
      <aside className="dept-controls">
        <h3>部門費を動かす</h3>
        <DeptRange label="機械部（製造）" value={machining} max={1400000} onChange={setMachining} />
        <DeptRange label="組立部（製造）" value={assembly} max={1200000} onChange={setAssembly} />
        <DeptRange label="動力部（補助）" value={power} max={600000} onChange={setPower} />
        <DeptRange label="修繕部（補助）" value={repair} max={500000} onChange={setRepair} />
        <div className="dept-rule"><span>固定配賦比率（学習用）</span><b>動力 → 機械40% / 組立40% / 修繕20%</b><b>修繕 → 機械45% / 組立35% / 動力20%</b></div>
      </aside>

      <div className="dept-stages">
        <article className="dept-stage">
          <header><span>第1次配賦</span><strong>補助部門どうしも含めて配る</strong></header>
          <div className="dept-grid">
            <DeptBox name="機械部" type="製造" base={machining} in1={calc.powerToMachining + calc.repairToMachining} />
            <DeptBox name="組立部" type="製造" base={assembly} in1={calc.powerToAssembly + calc.repairToAssembly} />
            <DeptBox name="動力部" type="補助" base={power} out={power} in1={calc.repairToPower} />
            <DeptBox name="修繕部" type="補助" base={repair} out={repair} in1={calc.powerToRepair} />
          </div>
          <div className="dept-arrows">
            <span>動力部 → 修繕部 {yen(calc.powerToRepair)}</span>
            <span>修繕部 → 動力部 {yen(calc.repairToPower)}</span>
          </div>
          <p>補助部門の元の部門費はいったん全部配る。ただし、他の補助部門から受け取った分が新しく残ります。</p>
        </article>

        <article className="dept-stage second-stage">
          <header><span>第2次配賦</span><strong>残った補助部門費を製造部門だけへ</strong></header>
          <div className="second-flows">
            <div><b>動力部に残った {yen(calc.powerReceived)}</b><span>→ 機械 {yen(calc.powerSecondToMachining)}</span><span>→ 組立 {yen(calc.powerSecondToAssembly)}</span></div>
            <div><b>修繕部に残った {yen(calc.repairReceived)}</b><span>→ 機械 {yen(calc.repairSecondToMachining)}</span><span>→ 組立 {yen(calc.repairSecondToAssembly)}</span></div>
          </div>
          <p>第2次では製造部門だけを分母にする。補助部門へもう一度戻すと配賦が終わらなくなるためです。</p>
        </article>
      </div>
    </div>

    <div className="dept-final">
      <div><span>最終 機械部費</span><strong>{yen(calc.machiningFinal)}</strong></div>
      <div><span>最終 組立部費</span><strong>{yen(calc.assemblyFinal)}</strong></div>
      <div><span>合計検算</span><strong>{yen(calc.machiningFinal + calc.assemblyFinal)}</strong><small>元の全部門費 {yen(calc.total)}</small></div>
    </div>

    <div className="method-memory"><strong>反射用：</strong><span>相互配賦法（簡便法）＝第1次は補助部門間も配る → 第2次は受け取った残りを製造部門だけへ。</span></div>
  </section>
}

function DeptBox({ name, type, base, in1 = 0, out = 0 }: { name: string; type: string; base: number; in1?: number; out?: number }) {
  return <div className={`dept-box ${type === '補助' ? 'aux' : 'mfg'}`}><span>{type}</span><h3>{name}</h3><p>元の部門費 <b>{yen(base)}</b></p>{in1 > 0 && <p>第1次で受取 <b>+{yen(in1)}</b></p>}{out > 0 && <p>元の部門費を配賦 <b>-{yen(out)}</b></p>}</div>
}

function DeptRange({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return <label className="dept-range"><span><b>{label}</b><strong>{yen(value)}</strong></span><input type="range" min="0" max={max} step="20000" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
