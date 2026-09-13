import { useEffect, useMemo, useState } from 'react'

type ReflexQuestion = {
  cue: string
  context?: string
  answer: string
  options: string[]
  why: string
  tag: string
  trap?: string
}

type HistoryItem = {
  tag: string
  correct: boolean
  fast: boolean
  ms: number
  at: number
}

const STORAGE_KEY = 'boki2-cost-learning:first-move-history:v1'

const questions: ReflexQuestion[] = [
  {
    cue: '月末仕掛品 200個・加工進捗度60%',
    context: '材料は工程始点で全量投入',
    answer: '材料と加工費の完成品換算量を分ける',
    options: ['材料と加工費の完成品換算量を分ける', '200個すべてに60%を掛ける', 'まず単価を計算する', '固定費を探す'],
    why: '材料は始点投入なら200個分、加工費は200×60%=120個分。最初にここを分けないと後が全部ずれます。',
    tag: '数量と換算量',
    trap: '「進捗度を何にでも掛ける」癖を止める。',
  },
  {
    cue: '固定費300,000円・変動費率60%',
    context: '損益分岐点売上高を求める',
    answer: '貢献利益率40%を出す',
    options: ['貢献利益率40%を出す', '300,000×60%を計算する', '販売数量を探す', '固定費を変動費で割る'],
    why: '売上高ベースのCVPでは「固定費÷貢献利益率」が核。変動費率60%なら貢献利益率は40%。',
    tag: 'CVP初動',
  },
  {
    cue: '標準価格SP・実際価格AP・標準数量SQ・実際数量AQ',
    context: '直接材料費差異を分析する',
    answer: '4つを価格2つ・数量2つに整理する',
    options: ['4つを価格2つ・数量2つに整理する', 'AP×SQを最初に出す', '差異をいきなり2等分する', '実際原価だけ計算する'],
    why: '差異分析はSP/AP/SQ/AQの取り違えが最大の事故。まず4つの役割を固定します。',
    tag: '材料差異',
  },
  {
    cue: '基準操業度・実際操業度・標準操業度',
    context: '製造間接費差異を分析する',
    answer: '3つの操業度をシュラッター図の横軸に置く',
    options: ['3つの操業度をシュラッター図の横軸に置く', 'P/Lを作る', '材料価格差異を計算する', '製品数量に進捗度を掛ける'],
    why: 'シュラッター図は製造間接費の差異図。まず3つの操業度の位置関係を固定すると迷いにくい。',
    tag: '製造間接費差異',
  },
  {
    cue: '生産1,000個・販売800個',
    context: '全部原価と直接原価の利益を比較',
    answer: '200個の在庫増加と固定製造間接費の行き先を見る',
    options: ['200個の在庫増加と固定製造間接費の行き先を見る', '売上高だけ比較する', '材料費差異を出す', '販売単価を固定費で割る'],
    why: '両方式の利益差の核心は、売れ残った在庫に固定製造間接費が残るかどうかです。',
    tag: '全部vs直接',
  },
  {
    cue: '製造指図書 No.101 / No.102',
    context: '製品ごとの原価を集計',
    answer: '個別原価計算と判断して指図書ごとに集める',
    options: ['個別原価計算と判断して指図書ごとに集める', '総合原価計算のボックス図を書く', 'CVP分析をする', '標準価格と実際価格を比較する'],
    why: '「製造指図書」は個別原価計算の強い合図。問題文の型判定を即座にします。',
    tag: '個別原価計算',
  },
  {
    cue: '同一製品を連続大量生産・月末仕掛品あり',
    context: '完成品原価と月末仕掛品原価を求める',
    answer: '総合原価計算と判断し数量の流れを整理する',
    options: ['総合原価計算と判断し数量の流れを整理する', '製造指図書を探す', 'まず仕訳を書く', '固定費率を計算する'],
    why: '大量生産＋月末仕掛品なら、まず数量ボックス。単価計算はその後です。',
    tag: '総合原価計算',
  },
  {
    cue: '間接材料費・間接労務費・間接経費',
    context: '工場で発生した原価の仕訳',
    answer: 'いったん製造間接費に集める',
    options: ['いったん製造間接費に集める', 'すべて仕掛品へ直行させる', 'すべて製品へ入れる', '売上原価へ振り替える'],
    why: '間接費は製品へ直接たどれないので、製造間接費へ集めてから仕掛品へ配賦します。',
    tag: '勘定連絡',
  },
]

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function FirstMoveTrainer() {
  const [index, setIndex] = useState(0)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [result, setResult] = useState<{ choice: string; correct: boolean; ms: number } | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-300)))
  }, [history])

  const q = questions[index]
  const score = useMemo(() => {
    const correct = history.filter((h) => h.correct).length
    const reflex = history.filter((h) => h.correct && h.fast).length
    const avgMs = history.length ? history.reduce((sum, h) => sum + h.ms, 0) / history.length : 0
    return { correct, reflex, avgMs }
  }, [history])

  const weakSummary = useMemo(() => {
    const map = new Map<string, { weak: number; total: number }>()
    history.forEach((h) => {
      const current = map.get(h.tag) ?? { weak: 0, total: 0 }
      current.total += 1
      if (!h.correct || !h.fast) current.weak += 1
      map.set(h.tag, current)
    })
    return [...map.entries()]
      .filter(([, v]) => v.weak > 0)
      .sort((a, b) => b[1].weak / b[1].total - a[1].weak / a[1].total)
      .slice(0, 4)
  }, [history])

  const answer = (choice: string) => {
    if (result) return
    const ms = Date.now() - startedAt
    const correct = choice === q.answer
    setResult({ choice, correct, ms })
    setHistory((h) => [...h, { tag: q.tag, correct, fast: correct && ms <= 5000, ms, at: Date.now() }])
  }

  const next = () => {
    setIndex((i) => (i + 1) % questions.length)
    setResult(null)
    setStartedAt(Date.now())
  }

  const resetHistory = () => {
    setHistory([])
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <section className="first-move-trainer panel">
      <header className="trainer-header">
        <div>
          <p className="eyebrow">反射トレーニング</p>
          <h2>3〜5秒で「最初の一手」だけ答える</h2>
          <p>最後まで計算しません。問題文を見て、<strong>何の問題か・まず何をするか</strong>を自動化します。</p>
        </div>
        <div className="trainer-score">
          <div><span>正解</span><b>{score.correct}/{history.length}</b></div>
          <div><span>5秒以内</span><b>{score.reflex}</b></div>
          <div><span>平均初動</span><b>{history.length ? `${(score.avgMs / 1000).toFixed(1)}秒` : '—'}</b></div>
        </div>
      </header>

      <div className="reflex-card">
        <div className="reflex-meta"><span>{q.tag}</span><b>Q {index + 1}/{questions.length}</b></div>
        <h3>{q.cue}</h3>
        {q.context && <p>{q.context}</p>}
        <div className="reflex-prompt">まず何をする？</div>

        <div className="reflex-options">
          {q.options.map((option) => {
            const chosen = result?.choice === option
            const isAnswer = option === q.answer
            const cls = result ? (isAnswer ? 'correct' : chosen ? 'wrong' : 'dim') : ''
            return <button key={option} className={cls} onClick={() => answer(option)} disabled={!!result}>{option}</button>
          })}
        </div>

        {result && <div className={result.correct ? (result.ms <= 5000 ? 'reflex-result fast' : 'reflex-result slow') : 'reflex-result wrong-result'}>
          <div className="result-head">
            <strong>{result.correct ? (result.ms <= 5000 ? '反射できています' : '正解。ただし本番ではもう少し速く') : '初動を修正'}</strong>
            <span>{(result.ms / 1000).toFixed(1)}秒</span>
          </div>
          <p>{q.why}</p>
          {q.trap && <small>ひっかけ警戒：{q.trap}</small>}
          <button onClick={next}>次の初動 →</button>
        </div>}
      </div>

      <div className="trainer-diagnosis">
        <div>
          <span>判定ルール</span>
          <strong>正解＋5秒以内 = 反射化</strong>
          <small>正解でも遅ければ復習対象。誤答なら「誤り方」のタグを残します。</small>
        </div>
        <div>
          <span>弱点ランキング</span>
          <strong>{weakSummary.length ? weakSummary.map(([tag, v]) => `${tag} ${v.weak}/${v.total}`).join(' / ') : 'まだありません'}</strong>
          <small>正答でも5秒を超えた回答は「弱点」に数えています。</small>
        </div>
      </div>

      {history.length > 0 && <button className="history-reset" onClick={resetHistory}>反射履歴をリセット</button>}
    </section>
  )
}
