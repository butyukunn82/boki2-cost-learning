import { useEffect, useMemo, useState } from 'react'
import { corePatterns, journalPatterns, solvePatterns, type CorePattern } from '../data/corePatterns'

type Mode = 'journal' | 'solve' | 'all'
type PatternStat = { attempts: number; correct: number; fast: number; lastMs: number }
type Stats = Record<string, PatternStat>

const STORAGE_KEY = 'boki2-core-pattern-stats-v1'

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Stats : {}
  } catch {
    return {}
  }
}

export default function CorePatternTrainer() {
  const [mode, setMode] = useState<Mode>('journal')
  const [index, setIndex] = useState(0)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [selected, setSelected] = useState<string | null>(null)
  const [showList, setShowList] = useState(false)
  const [stats, setStats] = useState<Stats>(() => loadStats())

  const pool = mode === 'journal' ? journalPatterns : mode === 'solve' ? solvePatterns : corePatterns
  const pattern = pool[index % pool.length]

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  }, [stats])

  const options = useMemo(() => {
    const answer = pattern.firstAction
    const others = pool
      .filter((p) => p.id !== pattern.id)
      .slice((index * 3) % Math.max(pool.length - 1, 1))
      .concat(pool)
      .filter((p, i, arr) => p.id !== pattern.id && arr.findIndex((x) => x.firstAction === p.firstAction) === i)
      .slice(0, 3)
      .map((p) => p.firstAction)
    const base = [answer, ...others]
    const shift = index % base.length
    return [...base.slice(shift), ...base.slice(0, shift)]
  }, [pattern, pool, index])

  const currentStat = stats[pattern.id]
  const correct = selected === pattern.firstAction

  const choose = (choice: string) => {
    if (selected) return
    const ms = Date.now() - startedAt
    const isCorrect = choice === pattern.firstAction
    const isFast = isCorrect && ms <= 5000
    setSelected(choice)
    setStats((prev) => {
      const old = prev[pattern.id] ?? { attempts: 0, correct: 0, fast: 0, lastMs: 0 }
      return {
        ...prev,
        [pattern.id]: {
          attempts: old.attempts + 1,
          correct: old.correct + (isCorrect ? 1 : 0),
          fast: old.fast + (isFast ? 1 : 0),
          lastMs: ms,
        },
      }
    })
  }

  const next = () => {
    setIndex((i) => (i + 1) % pool.length)
    setSelected(null)
    setStartedAt(Date.now())
  }

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode)
    setIndex(0)
    setSelected(null)
    setStartedAt(Date.now())
    setShowList(false)
  }

  const summary = useMemo(() => {
    const ids = pool.map((p) => p.id)
    const attempted = ids.filter((id) => stats[id]?.attempts).length
    const mastered = ids.filter((id) => {
      const s = stats[id]
      return s && s.correct >= 2 && s.fast >= 1 && s.correct / s.attempts >= .8
    }).length
    return { attempted, mastered }
  }, [pool, stats])

  return (
    <section className="core-pattern-trainer panel">
      <header className="pattern-header">
        <div>
          <p className="eyebrow">工業簿記 30型</p>
          <h2>仕訳・勘定移動12型 ＋ 解き順18型</h2>
          <p>問題文を見たら、まず<strong>「どの型か → 最初に何をするか」</strong>を5秒以内に返す。仕訳はその後に確認します。</p>
        </div>
        <div className="pattern-progress">
          <div><span>着手</span><b>{summary.attempted}/{pool.length}</b></div>
          <div><span>反射化</span><b>{summary.mastered}/{pool.length}</b></div>
        </div>
      </header>

      <div className="pattern-tabs">
        <button className={mode === 'journal' ? 'active' : ''} onClick={() => changeMode('journal')}>仕訳・勘定移動 12</button>
        <button className={mode === 'solve' ? 'active' : ''} onClick={() => changeMode('solve')}>解き順 18</button>
        <button className={mode === 'all' ? 'active' : ''} onClick={() => changeMode('all')}>30型すべて</button>
        <button className={showList ? 'active ghost' : 'ghost'} onClick={() => setShowList((v) => !v)}>一覧</button>
      </div>

      {showList ? (
        <PatternList patterns={pool} stats={stats} onOpen={(id) => {
          const pos = pool.findIndex((p) => p.id === id)
          setIndex(Math.max(0, pos))
          setSelected(null)
          setStartedAt(Date.now())
          setShowList(false)
        }} />
      ) : (
        <div className="pattern-card">
          <div className="pattern-meta">
            <span>{pattern.id}</span><span>{pattern.category}</span><b>{index % pool.length + 1}/{pool.length}</b>
          </div>

          <div className="pattern-cue">
            <small>問題文の合図</small>
            <h3>{pattern.cue}</h3>
          </div>

          <div className="pattern-question">まず何をする？</div>
          <div className="pattern-options">
            {options.map((option) => {
              const answer = option === pattern.firstAction
              const chosen = selected === option
              let cls = ''
              if (selected) cls = answer ? 'correct' : chosen ? 'wrong' : 'dim'
              return <button key={option} className={cls} disabled={!!selected} onClick={() => choose(option)}>{option}</button>
            })}
          </div>

          {selected && (
            <div className={correct ? 'pattern-feedback ok' : 'pattern-feedback ng'}>
              <div className="feedback-head">
                <strong>{correct ? 'この初動でOK' : 'ここを反射に修正'}</strong>
                {stats[pattern.id] && <span>{(stats[pattern.id].lastMs / 1000).toFixed(1)}秒</span>}
              </div>

              {pattern.kind === 'journal' && pattern.debit && pattern.credit && (
                <div className="journal-answer">
                  <span>借方 <b>{pattern.debit}</b></span>
                  <i>/</i>
                  <span>貸方 <b>{pattern.credit}</b></span>
                </div>
              )}

              <p>{pattern.why}</p>
              <div className="solve-order">
                <span>固定する順番</span>
                <div>{pattern.order.map((step, i) => <b key={step}><em>{i + 1}</em>{step}</b>)}</div>
              </div>
              {pattern.trap && <div className="pattern-trap"><span>ひっかけ警戒</span>{pattern.trap}</div>}
              <button className="next-pattern" onClick={next}>次の型 →</button>
            </div>
          )}

          <div className="pattern-statline">
            <span>この型の履歴</span>
            <b>{currentStat ? `${currentStat.correct}/${currentStat.attempts} 正解・5秒以内 ${currentStat.fast}回` : '未挑戦'}</b>
          </div>
        </div>
      )}
    </section>
  )
}

function PatternList({ patterns, stats, onOpen }: { patterns: CorePattern[]; stats: Stats; onOpen: (id: string) => void }) {
  return <div className="pattern-list">
    {patterns.map((p) => {
      const s = stats[p.id]
      const mastered = s && s.correct >= 2 && s.fast >= 1 && s.correct / s.attempts >= .8
      return <button key={p.id} onClick={() => onOpen(p.id)} className={mastered ? 'mastered' : s ? 'attempted' : ''}>
        <span>{p.id} · {p.category}</span>
        <strong>{p.cue}</strong>
        <small>{mastered ? '反射化' : s ? `${s.correct}/${s.attempts} 正解` : '未挑戦'}</small>
      </button>
    })}
  </div>
}
