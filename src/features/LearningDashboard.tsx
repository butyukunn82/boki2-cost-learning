import { useMemo, useState } from 'react'

type FirstMoveHistory = { tag: string; correct: boolean; fast: boolean; ms: number; at: number }
type PatternStat = { attempts: number; correct: number; fast: number; lastMs: number }
type PatternStats = Record<string, PatternStat>
type CbtHistory = { at: number; score: number; secondsUsed: number; weakTopics: string[] }

const FIRST_KEY = 'boki2-cost-learning:first-move-history:v1'
const PATTERN_KEY = 'boki2-core-pattern-stats-v1'
const CBT_KEY = 'boki2-cbt-history-v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

export default function LearningDashboard() {
  const [refresh, setRefresh] = useState(0)

  const data = useMemo(() => {
    const first = readJson<FirstMoveHistory[]>(FIRST_KEY, [])
    const patterns = readJson<PatternStats>(PATTERN_KEY, {})
    const cbt = readJson<CbtHistory[]>(CBT_KEY, [])

    const firstCorrect = first.filter((x) => x.correct).length
    const firstFast = first.filter((x) => x.correct && x.fast).length
    const firstAvg = first.length ? first.reduce((s, x) => s + x.ms, 0) / first.length : 0

    const patternRows = Object.values(patterns)
    const patternAttempts = patternRows.reduce((s, x) => s + x.attempts, 0)
    const patternCorrect = patternRows.reduce((s, x) => s + x.correct, 0)
    const patternMastered = Object.values(patterns).filter((s) => s.attempts > 0 && s.correct >= 2 && s.fast >= 1 && s.correct / s.attempts >= .8).length

    const latestCbt = cbt.at(-1)
    const bestCbt = cbt.length ? Math.max(...cbt.map((x) => x.score)) : null
    const avgCbt = cbt.length ? cbt.reduce((s, x) => s + x.score, 0) / cbt.length : null

    const weak = new Map<string, number>()
    first.forEach((x) => { if (!x.correct || !x.fast) weak.set(x.tag, (weak.get(x.tag) ?? 0) + 1) })
    cbt.forEach((x) => x.weakTopics.forEach((t) => weak.set(t, (weak.get(t) ?? 0) + 2)))
    const weakRanking = [...weak.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

    const masteryScore = Math.round(
      Math.min(100, (
        (first.length ? firstFast / first.length : 0) * 35 +
        (patternRows.length ? patternMastered / 30 : 0) * 35 +
        ((latestCbt?.score ?? 0) / 100) * 30
      ) * 100) / 100
    )

    let next = 'まず「初動反射」を10問やって、現在の反応速度を測る。'
    if (first.length >= 5 && firstFast / first.length < .6) next = '初動反射を優先。正解より「5秒以内」を増やす。'
    else if (patternMastered < 10 && patternAttempts >= 5) next = '工業簿記30型を優先。未反射の型を5つ固める。'
    else if (latestCbt && latestCbt.score < 70) next = `CBTで落とした「${latestCbt.weakTopics.join(' / ') || '未回答'}」をLabへ戻って復習する。`
    else if (latestCbt?.score && latestCbt.score >= 70) next = 'CBTで70点超え。次は時間短縮と未出論点の穴埋めへ進む。'

    return { first, firstCorrect, firstFast, firstAvg, patterns, patternAttempts, patternCorrect, patternMastered, cbt, latestCbt, bestCbt, avgCbt, weakRanking, masteryScore, next }
  }, [refresh])

  const clearAll = () => {
    if (!window.confirm('この端末に保存した学習履歴をすべて消しますか？')) return
    ;[FIRST_KEY, PATTERN_KEY, CBT_KEY].forEach((key) => localStorage.removeItem(key))
    setRefresh((v) => v + 1)
  }

  return <section className="learning-dashboard panel">
    <header className="dashboard-head">
      <div>
        <p className="eyebrow">学習ダッシュボード</p>
        <h2>「正解したか」ではなく、どこまで反射になったかを見る</h2>
        <p>初動速度・30型・CBTを同じ画面へ集約します。データは現在この端末のブラウザ内に保存しています。</p>
      </div>
      <button className="dashboard-refresh" onClick={() => setRefresh((v) => v + 1)}>最新の履歴を読み直す</button>
    </header>

    <div className="dashboard-kpis">
      <Kpi label="総合習熟の目安" value={`${data.masteryScore}%`} sub="速度35%＋30型35%＋CBT30%" />
      <Kpi label="初動反射" value={`${data.firstFast}/${data.first.length}`} sub={data.first.length ? `平均 ${(data.firstAvg / 1000).toFixed(1)}秒` : 'まだ履歴なし'} />
      <Kpi label="30型 反射化" value={`${data.patternMastered}/30`} sub={data.patternAttempts ? `累計 ${data.patternCorrect}/${data.patternAttempts} 正解` : 'まだ履歴なし'} />
      <Kpi label="CBT 最新 / 最高" value={data.latestCbt ? `${data.latestCbt.score} / ${data.bestCbt}` : '—'} sub={data.avgCbt !== null ? `平均 ${data.avgCbt.toFixed(1)}点・${data.cbt.length}回` : 'まだ受験履歴なし'} />
    </div>

    <div className="dashboard-grid">
      <article className="dashboard-card next-card">
        <span>次にやること</span>
        <strong>{data.next}</strong>
        <small>弱いものから自動で優先順位を付ける簡易版です。</small>
      </article>

      <article className="dashboard-card">
        <span>弱点ランキング</span>
        {data.weakRanking.length ? <div className="weak-bars">{data.weakRanking.map(([name, count], i) => <div key={name}><b>{i + 1}. {name}</b><span><i style={{ width: `${Math.min(100, count * 12)}%` }} /></span><em>{count}</em></div>)}</div> : <strong>まだ弱点データがありません</strong>}
      </article>

      <article className="dashboard-card">
        <span>初動反射の状態</span>
        <div className="dashboard-stat-list">
          <p><b>回答数</b><strong>{data.first.length}</strong></p>
          <p><b>正解</b><strong>{data.firstCorrect}</strong></p>
          <p><b>正解＋5秒以内</b><strong>{data.firstFast}</strong></p>
        </div>
      </article>

      <article className="dashboard-card">
        <span>CBT履歴</span>
        {data.cbt.length ? <div className="cbt-history-mini">{data.cbt.slice(-5).reverse().map((x) => <div key={x.at}><b>{x.score}点</b><span>{new Date(x.at).toLocaleDateString('ja-JP')}</span><small>{x.weakTopics.length ? `弱点: ${x.weakTopics.join(' / ')}` : '全問正解'}</small></div>)}</div> : <strong>まだCBT履歴がありません</strong>}
      </article>
    </div>

    <div className="dashboard-foot">
      <span>この端末だけに保存中。将来、必要ならクラウド同期を追加できます。</span>
      <button onClick={clearAll}>学習履歴をすべてリセット</button>
    </div>
  </section>
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="dashboard-kpi"><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>
}
