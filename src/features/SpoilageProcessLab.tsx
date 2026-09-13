import { useMemo, useState } from 'react'

type LossPointMode = 'known' | 'unknown'

const money = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}円`

export default function SpoilageProcessLab() {
  const [tab, setTab] = useState<'loss' | 'stage'>('loss')
  return <section className="spoilage-process-lab panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">Visual Lab 07</p>
        <h2>正常仕損・工程別総合原価計算</h2>
        <p>「仕損を誰が負担するか」と「前工程費が次工程へどう渡るか」を、別々の暗記ではなく原価の移動として理解します。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>仕掛品 ＞ 総合原価計算 ＞ 仕損・工程別</strong>
        <span>何を？</span><strong>失われた原価の負担先／前工程費の引継ぎ</strong>
        <span>なぜ？</span><strong>月末仕掛品原価と完成品原価を正しく分けるため</strong>
      </div>
    </header>

    <div className="spoilage-tabs">
      <button className={tab === 'loss' ? 'active' : ''} onClick={() => setTab('loss')}>正常仕損</button>
      <button className={tab === 'stage' ? 'active' : ''} onClick={() => setTab('stage')}>工程別原価計算</button>
    </div>
    {tab === 'loss' ? <NormalLossPanel /> : <ProcessStagePanel />}
  </section>
}

function NormalLossPanel() {
  const [mode, setMode] = useState<LossPointMode>('known')
  const [lossPoint, setLossPoint] = useState(70)
  const [endingProgress, setEndingProgress] = useState(40)
  const [completed, setCompleted] = useState(700)
  const [endingWip, setEndingWip] = useState(200)
  const [normalLoss, setNormalLoss] = useState(100)

  const judgment = mode === 'unknown' ? 'both' : endingProgress >= lossPoint ? 'both' : 'completed'
  const endingMaterialEu = endingWip
  const endingConversionEu = endingWip * endingProgress / 100
  const lossMaterialEu = normalLoss
  const lossConversionEu = mode === 'known' ? normalLoss * lossPoint / 100 : null

  return <div className="loss-panel">
    <div className="loss-controls">
      <div className="loss-mode">
        <button className={mode === 'known' ? 'active' : ''} onClick={() => setMode('known')}>仕損発生点が分かる</button>
        <button className={mode === 'unknown' ? 'active' : ''} onClick={() => setMode('unknown')}>発生点が不明</button>
      </div>
      <Range label="完成品数量" value={completed} min={100} max={1200} step={50} suffix="個" onChange={setCompleted} />
      <Range label="月末仕掛品数量" value={endingWip} min={0} max={500} step={25} suffix="個" onChange={setEndingWip} />
      <Range label="月末加工進捗度" value={endingProgress} min={0} max={100} step={5} suffix="%" onChange={setEndingProgress} />
      {mode === 'known' && <Range label="正常仕損の発生点" value={lossPoint} min={0} max={100} step={5} suffix="%" onChange={setLossPoint} />}
      <Range label="正常仕損数量" value={normalLoss} min={0} max={300} step={25} suffix="個" onChange={setNormalLoss} />
    </div>

    <div className="loss-visual">
      <div className="process-track">
        <div className="track-line" />
        <div className="track-marker start" style={{ left: '0%' }}><b>0%</b><span>工程始点</span></div>
        {mode === 'known' && <div className="track-marker loss" style={{ left: `${lossPoint}%` }}><b>{lossPoint}%</b><span>正常仕損</span></div>}
        <div className="track-marker wip" style={{ left: `${endingProgress}%` }}><b>{endingProgress}%</b><span>月末仕掛品</span></div>
        <div className="track-marker end" style={{ left: '100%' }}><b>100%</b><span>完成</span></div>
      </div>

      <div className={judgment === 'completed' ? 'loss-judgment completed-only' : 'loss-judgment both'}>
        <span>負担判定</span>
        <strong>{judgment === 'completed' ? '完成品のみ負担' : '完成品＋月末仕掛品の両者負担'}</strong>
        <p>{mode === 'unknown'
          ? '仕損発生点が分からない場合は、月末仕掛品が仕損点を通過したか判定できないため、両者負担として扱う練習にします。'
          : judgment === 'completed'
            ? `月末仕掛品は${endingProgress}%まで。仕損点${lossPoint}%にまだ到達していないので、正常仕損費を月末仕掛品へ負担させません。`
            : `月末仕掛品は${endingProgress}%まで進み、仕損点${lossPoint}%を通過しています。完成品と月末仕掛品の両方が正常仕損を負担します。`}</p>
      </div>

      <div className="loss-cards">
        <div><span>完成品</span><strong>{completed.toLocaleString('ja-JP')}個</strong><small>必ず仕損点を通過</small></div>
        <div><span>月末仕掛品</span><strong>{endingWip.toLocaleString('ja-JP')}個 × {endingProgress}%</strong><small>{judgment === 'both' ? '仕損を負担する側' : '仕損点前なので負担しない'}</small></div>
        <div><span>正常仕損</span><strong>{normalLoss.toLocaleString('ja-JP')}個</strong><small>異常仕損とは分けて考える</small></div>
      </div>

      <div className="loss-equivalent-grid">
        <article>
          <span>月末仕掛品の材料換算量</span>
          <strong>{Math.round(endingMaterialEu).toLocaleString('ja-JP')}個分</strong>
          <small>材料は工程始点で全量投入する前提。加工進捗度は掛けない。</small>
        </article>
        <article>
          <span>月末仕掛品の加工換算量</span>
          <strong>{Math.round(endingConversionEu).toLocaleString('ja-JP')}個分</strong>
          <small>{endingWip.toLocaleString('ja-JP')}個 × {endingProgress}%</small>
        </article>
        <article>
          <span>仕損の材料換算量</span>
          <strong>{Math.round(lossMaterialEu).toLocaleString('ja-JP')}個分</strong>
          <small>始点投入材料は、仕損品にもすでに100%入っている。</small>
        </article>
        <article>
          <span>仕損の加工換算量</span>
          <strong>{lossConversionEu === null ? '発生点を確認' : `${Math.round(lossConversionEu).toLocaleString('ja-JP')}個分`}</strong>
          <small>{lossConversionEu === null ? '発生点不明なら問題の条件に従って処理する。' : `${normalLoss.toLocaleString('ja-JP')}個 × 仕損点${lossPoint}%`}</small>
        </article>
      </div>

      <div className="loss-memory">
        <b>反射：</b><span>①仕損点と月末進捗度で負担先を決める → ②材料費と加工費を分ける → ③材料は投入時点、加工は進捗度で換算量を作る。</span>
      </div>
      <div className="loss-note">「仕損100個＝材料も加工も100個分」ではありません。始点投入材料は100個分でも、加工費は仕損が発生した地点までしか投入されていません。</div>
    </div>
  </div>
}

function ProcessStagePanel() {
  const [stage1Units, setStage1Units] = useState(800)
  const [stage1Cost, setStage1Cost] = useState(720000)
  const [stage2AddedCost, setStage2AddedCost] = useState(360000)
  const [endingWip, setEndingWip] = useState(200)
  const [progress, setProgress] = useState(50)

  const calc = useMemo(() => {
    const transferredPerUnit = stage1Cost / Math.max(stage1Units, 1)
    const completed = Math.max(0, stage1Units - endingWip)
    const transferredEnding = transferredPerUnit * endingWip
    const transferredCompleted = transferredPerUnit * completed
    const convEu = completed + endingWip * progress / 100
    const addedPerEu = stage2AddedCost / Math.max(convEu, 1)
    const addedEnding = addedPerEu * endingWip * progress / 100
    const addedCompleted = addedPerEu * completed
    return {
      transferredPerUnit, completed, transferredEnding, transferredCompleted,
      convEu, addedPerEu, addedEnding, addedCompleted,
      endingCost: transferredEnding + addedEnding,
      completedCost: transferredCompleted + addedCompleted,
    }
  }, [stage1Units, stage1Cost, stage2AddedCost, endingWip, progress])

  return <div className="stage-panel">
    <div className="stage-controls">
      <Range label="第1工程完成量" value={stage1Units} min={200} max={1400} step={50} suffix="個" onChange={(v) => { setStage1Units(v); setEndingWip((w) => Math.min(w, v)) }} />
      <Range label="第1工程完成品原価" value={stage1Cost} min={200000} max={1800000} step={50000} suffix="円" onChange={setStage1Cost} />
      <Range label="第2工程の追加加工費" value={stage2AddedCost} min={100000} max={1000000} step={50000} suffix="円" onChange={setStage2AddedCost} />
      <Range label="第2工程 月末仕掛品" value={endingWip} min={0} max={stage1Units} step={50} suffix="個" onChange={setEndingWip} />
      <Range label="第2工程 加工進捗度" value={progress} min={0} max={100} step={10} suffix="%" onChange={setProgress} />
    </div>

    <div className="stage-visual">
      <div className="stage-flow">
        <div className="stage-box"><span>第1工程</span><strong>{stage1Units.toLocaleString('ja-JP')}個</strong><b>{money(stage1Cost)}</b><small>ここで完成した原価</small></div>
        <div className="stage-arrow"><span>前工程費</span><b>→</b><small>{money(calc.transferredPerUnit)} / 個</small></div>
        <div className="stage-box second"><span>第2工程</span><strong>前工程費＋当工程加工費</strong><b>追加 {money(stage2AddedCost)}</b><small>前工程費は「材料のように100%持ち込まれた原価」と捉える</small></div>
      </div>

      <div className="stage-split">
        <article><span>第2工程 完成品</span><strong>{calc.completed.toLocaleString('ja-JP')}個</strong><p>前工程費 {money(calc.transferredCompleted)}</p><p>当工程加工費 {money(calc.addedCompleted)}</p><b>合計 {money(calc.completedCost)}</b></article>
        <article><span>第2工程 月末仕掛品</span><strong>{endingWip.toLocaleString('ja-JP')}個・進捗{progress}%</strong><p>前工程費 {money(calc.transferredEnding)}</p><p>当工程加工費 {money(calc.addedEnding)}</p><b>合計 {money(calc.endingCost)}</b></article>
      </div>

      <div className="stage-eu">
        <div><span>前工程費の換算量</span><strong>{stage1Units.toLocaleString('ja-JP')}個分</strong><small>第2工程へ入った時点で前工程は100%完成済み</small></div>
        <div><span>第2工程加工費の換算量</span><strong>{Math.round(calc.convEu).toLocaleString('ja-JP')}個分</strong><small>月末仕掛品だけ進捗度を掛ける</small></div>
      </div>

      <div className="loss-memory"><b>反射：</b><span>工程別では「前工程費」と「当工程で追加した原価」を分ける。前工程費に第2工程の進捗度を掛けない。</span></div>
    </div>
  </div>
}

function Range({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (v: number) => void }) {
  return <label className="sp-range"><span><b>{label}</b><strong>{value.toLocaleString('ja-JP')}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={Math.min(value, max)} onChange={(e) => onChange(Number(e.target.value))} /></label>
}
