import { useEffect, useMemo, useRef, useState } from 'react'
import { buildCbtQuestions, type CbtQuestion } from '../data/cbtTemplates'
import { buildSupplementalCbtQuestions } from '../data/cbtSupplemental'

type CbtHistory = {
  at: number
  score: number
  secondsUsed: number
  weakTopics: string[]
}

const CBT_HISTORY_KEY = 'boki2-cbt-history-v1'
const normalize = (v: string) => v.replace(/[,，\s円個]/g, '').trim()

function buildExamSet(seed: number): CbtQuestion[] {
  const pool = [...buildCbtQuestions(seed), ...buildSupplementalCbtQuestions(seed)]
  let x = (seed * 2654435761) >>> 0
  const random = () => {
    x = (x * 1664525 + 1013904223) >>> 0
    return x / 4294967296
  }
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 5).map((q, index) => ({ ...q, id: index + 1, point: 20 }))
}

function saveHistory(item: CbtHistory) {
  try {
    const raw = localStorage.getItem(CBT_HISTORY_KEY)
    const current = raw ? JSON.parse(raw) as CbtHistory[] : []
    localStorage.setItem(CBT_HISTORY_KEY, JSON.stringify([...current, item].slice(-50)))
  } catch {
    // 保存失敗でも試験は継続する
  }
}

export default function CbtPractice() {
  const [seed, setSeed] = useState(() => Math.floor(Date.now() / 1000) % 1000000)
  const questions = useMemo(() => buildExamSet(seed), [seed])
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<number[]>([])
  const [secondsLeft, setSecondsLeft] = useState(90 * 60)
  const recorded = useRef(false)

  useEffect(() => {
    if (!started || submitted) return
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer)
          setSubmitted(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [started, submitted])

  const result = useMemo(() => {
    let score = 0
    const perQuestion = questions.map((q) => {
      const checks = q.fields.map((f) => normalize(answers[`${q.id}:${f.key}`] ?? '') === normalize(q.answers[f.key]))
      const correct = checks.every(Boolean)
      if (correct) score += q.point
      return { id: q.id, correct, checks }
    })
    return { score, perQuestion }
  }, [answers, questions])

  useEffect(() => {
    if (!submitted || recorded.current) return
    const weakTopics = questions
      .filter((q) => !result.perQuestion.find((r) => r.id === q.id)?.correct)
      .map((q) => q.topic)
    saveHistory({ at: Date.now(), score: result.score, secondsUsed: 90 * 60 - secondsLeft, weakTopics })
    recorded.current = true
  }, [submitted, result, secondsLeft, questions])

  const q = questions[current]
  const answeredCount = questions.filter((question) => question.fields.every((f) => (answers[`${question.id}:${f.key}`] ?? '').trim() !== '')).length
  const time = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  const resetForNewSet = () => {
    recorded.current = false
    setSubmitted(false)
    setStarted(false)
    setCurrent(0)
    setAnswers({})
    setFlagged([])
    setSecondsLeft(90 * 60)
    setSeed((s) => s + 1)
  }

  if (!started) {
    return <section className="cbt-practice panel">
      <div className="cbt-start">
        <p className="eyebrow">CBT Practice</p>
        <h2>工業簿記 CBT操作・本番演習</h2>
        <p>公式画面を模写せず、<strong>選択・入力・問題切替・見直し・90分</strong>という試験行動だけを独自UIで練習します。</p>
        <div className="cbt-notice"><strong>類題生成：</strong>複数論点のテンプレートから毎回5題を抽出。数値・正解・解説を同じデータから自動生成します。</div>
        <button onClick={() => { recorded.current = false; setStarted(true) }}>90分タイマーで開始</button>
      </div>
    </section>
  }

  return <section className="cbt-practice panel">
    <header className="cbt-topbar">
      <div><span>工業簿記 CBT Practice</span><b>問題 {q.id} / {questions.length}</b></div>
      <div className={secondsLeft < 600 ? 'cbt-timer urgent' : 'cbt-timer'}><span>残り時間</span><strong>{time}</strong></div>
    </header>

    {!submitted ? <>
      <div className="cbt-body">
        <aside className="cbt-nav">
          <h3>問題一覧</h3>
          {questions.map((question, i) => {
            const answered = question.fields.every((f) => (answers[`${question.id}:${f.key}`] ?? '').trim())
            const flag = flagged.includes(question.id)
            return <button key={question.id} className={`${current === i ? 'active' : ''} ${answered ? 'answered' : ''} ${flag ? 'flagged' : ''}`} onClick={() => setCurrent(i)}>
              <b>{question.id}</b><span>{answered ? '回答済' : '未回答'}</span>{flag && <em>見直し</em>}
            </button>
          })}
          <div className="cbt-status"><span>回答済</span><b>{answeredCount}/{questions.length}</b><span>見直し</span><b>{flagged.length}</b></div>
        </aside>

        <main className="cbt-question">
          <div className="cbt-question-head"><span>{q.topic}</span><h3>第{q.id}問　{q.title}</h3></div>
          <p className="cbt-stem">{q.stem}</p>
          <div className="cbt-fields">
            {q.fields.map((field) => {
              const key = `${q.id}:${field.key}`
              return <label key={field.key}><span>{field.label}</span>{field.type === 'select' ? <select value={answers[key] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}><option value="">選択してください</option>{field.options?.map((op) => <option key={op}>{op}</option>)}</select> : <input inputMode="numeric" value={answers[key] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))} placeholder="数字のみ入力" />}</label>
            })}
          </div>
          <label className="cbt-flag"><input type="checkbox" checked={flagged.includes(q.id)} onChange={() => setFlagged((f) => f.includes(q.id) ? f.filter((id) => id !== q.id) : [...f, q.id])} />この問題を見直す</label>
          <div className="cbt-actions"><button disabled={current === 0} onClick={() => setCurrent((i) => Math.max(0, i - 1))}>← 前へ</button><button disabled={current === questions.length - 1} onClick={() => setCurrent((i) => Math.min(questions.length - 1, i + 1))}>次へ →</button></div>
        </main>
      </div>
      <div className="cbt-submit"><span>途中では正誤を表示しません。</span><button onClick={() => setSubmitted(true)}>採点して終了</button></div>
    </> : <CbtResult questions={questions} result={result} answers={answers} onRetry={resetForNewSet} />}
  </section>
}

function CbtResult({ questions, result, answers, onRetry }: { questions: CbtQuestion[]; result: { score: number; perQuestion: { id: number; correct: boolean; checks: boolean[] }[] }; answers: Record<string, string>; onRetry: () => void }) {
  return <div className="cbt-result">
    <div className="cbt-score"><span>得点</span><strong>{result.score}</strong><b>/ 100</b><small>{result.score >= 70 ? '70点以上：この演習では合格ライン' : '弱点を確認して再挑戦'}</small></div>
    <div className="cbt-review">
      {questions.map((q) => {
        const r = result.perQuestion.find((x) => x.id === q.id)!
        return <article key={q.id} className={r.correct ? 'ok' : 'ng'}>
          <header><span>第{q.id}問 {q.topic}</span><b>{r.correct ? '○' : '×'}</b></header>
          <p>{q.diagnosis}</p>
          <div>{q.fields.map((f) => <span key={f.key}>{f.label}: <b>{answers[`${q.id}:${f.key}`] || '未回答'}</b> / 正解 <strong>{q.answers[f.key]}</strong></span>)}</div>
        </article>
      })}
    </div>
    <button className="cbt-retry" onClick={onRetry}>数値を変えた新しいセットへ</button>
  </div>
}
