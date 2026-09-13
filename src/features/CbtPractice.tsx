import { useEffect, useMemo, useRef, useState } from 'react'

type Field = {
  key: string
  label: string
  type: 'number' | 'select'
  options?: string[]
}

type CbtQuestion = {
  id: number
  title: string
  topic: string
  stem: string
  fields: Field[]
  answers: Record<string, string>
  point: number
  diagnosis: string
}

type CbtHistory = {
  at: number
  score: number
  secondsUsed: number
  weakTopics: string[]
}

const CBT_HISTORY_KEY = 'boki2-cbt-history-v1'

const questions: CbtQuestion[] = [
  {
    id: 1,
    title: '材料の消費と仕訳',
    topic: '勘定連絡',
    stem: '直接材料費60,000円、間接材料費10,000円を製造に投入した。直接材料費の借方科目と、間接材料費の借方科目を選びなさい。',
    fields: [
      { key: 'direct', label: '直接材料費の借方', type: 'select', options: ['仕掛品', '製造間接費', '製品', '売上原価'] },
      { key: 'indirect', label: '間接材料費の借方', type: 'select', options: ['仕掛品', '製造間接費', '製品', '売上原価'] },
    ],
    answers: { direct: '仕掛品', indirect: '製造間接費' },
    point: 20,
    diagnosis: '直接費は仕掛品へ直行、間接費は製造間接費へ集める。'
  },
  {
    id: 2,
    title: '総合原価計算',
    topic: '完成品換算量',
    stem: '月末仕掛品200個、加工進捗度50%。材料は工程始点で全量投入する。月末仕掛品の材料の完成品換算量と、加工費の完成品換算量を入力しなさい。',
    fields: [
      { key: 'matEu', label: '材料 完成品換算量（個）', type: 'number' },
      { key: 'convEu', label: '加工費 完成品換算量（個）', type: 'number' },
    ],
    answers: { matEu: '200', convEu: '100' },
    point: 20,
    diagnosis: '工程始点投入の材料には加工進捗度を掛けない。'
  },
  {
    id: 3,
    title: '直接材料費差異',
    topic: '標準原価',
    stem: '標準価格500円、実際価格520円、標準数量1,000個、実際数量1,100個。価格差異と数量差異の金額を入力しなさい（不利差異は正の数で入力）。',
    fields: [
      { key: 'priceVar', label: '価格差異（円）', type: 'number' },
      { key: 'qtyVar', label: '数量差異（円）', type: 'number' },
    ],
    answers: { priceVar: '22000', qtyVar: '50000' },
    point: 20,
    diagnosis: '価格差異は実際数量AQ、数量差異は標準価格SPを使う。'
  },
  {
    id: 4,
    title: 'CVP分析',
    topic: '損益分岐点',
    stem: '固定費300,000円、変動費率60%である。損益分岐点売上高を入力しなさい。',
    fields: [{ key: 'beSales', label: '損益分岐点売上高（円）', type: 'number' }],
    answers: { beSales: '750000' },
    point: 20,
    diagnosis: '貢献利益率40%を先に出し、固定費÷貢献利益率。'
  },
  {
    id: 5,
    title: '全部原価と直接原価',
    topic: '固定製造間接費',
    stem: '生産量1,000個、販売量800個、固定製造間接費300,000円。期首・期末に仕掛品はない。全部原価計算で期末製品に繰り延べられる固定製造間接費と、全部原価計算の利益が直接原価計算より多くなる金額を入力しなさい。',
    fields: [
      { key: 'fixedInv', label: '期末製品に含まれる固定製造間接費（円）', type: 'number' },
      { key: 'profitDiff', label: '利益差（円）', type: 'number' },
    ],
    answers: { fixedInv: '60000', profitDiff: '60000' },
    point: 20,
    diagnosis: '固定製造間接費300円/個×期末在庫200個＝60,000円。'
  },
]

const normalize = (v: string) => v.replace(/[,，\s円個]/g, '').trim()

function saveHistory(item: CbtHistory) {
  try {
    const raw = localStorage.getItem(CBT_HISTORY_KEY)
    const current = raw ? JSON.parse(raw) as CbtHistory[] : []
    localStorage.setItem(CBT_HISTORY_KEY, JSON.stringify([...current, item].slice(-50)))
  } catch {
    // 学習継続を優先し、保存失敗では試験を止めない
  }
}

export default function CbtPractice() {
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
  }, [answers])

  useEffect(() => {
    if (!submitted || recorded.current) return
    const weakTopics = questions
      .filter((q) => !result.perQuestion.find((r) => r.id === q.id)?.correct)
      .map((q) => q.topic)
    saveHistory({ at: Date.now(), score: result.score, secondsUsed: 90 * 60 - secondsLeft, weakTopics })
    recorded.current = true
  }, [submitted, result, secondsLeft])

  const q = questions[current]
  const answeredCount = questions.filter((question) => question.fields.every((f) => (answers[`${question.id}:${f.key}`] ?? '').trim() !== '')).length
  const time = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  const startExam = () => {
    recorded.current = false
    setStarted(true)
  }

  if (!started) {
    return <section className="cbt-practice panel">
      <div className="cbt-start">
        <p className="eyebrow">CBT Practice</p>
        <h2>工業簿記 CBT操作・本番演習</h2>
        <p>公式画面のコピーではなく、日商簿記2級ネット試験の<strong>選択・入力・問題切替・見直し・90分</strong>という操作要素を独自UIで練習します。</p>
        <div className="cbt-notice"><strong>v1：</strong>工業簿記・原価計算のオリジナル5題。商業簿記はまだ含めません。</div>
        <button onClick={startExam}>90分タイマーで開始</button>
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
      <div className="cbt-submit"><span>本番想定：途中では正誤を表示しません。</span><button onClick={() => setSubmitted(true)}>採点して終了</button></div>
    </> : <CbtResult result={result} answers={answers} onRetry={() => { recorded.current = false; setSubmitted(false); setStarted(false); setCurrent(0); setAnswers({}); setFlagged([]); setSecondsLeft(90 * 60) }} />}
  </section>
}

function CbtResult({ result, answers, onRetry }: { result: { score: number; perQuestion: { id: number; correct: boolean; checks: boolean[] }[] }; answers: Record<string, string>; onRetry: () => void }) {
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
    <button className="cbt-retry" onClick={onRetry}>最初からやり直す</button>
  </div>
}
