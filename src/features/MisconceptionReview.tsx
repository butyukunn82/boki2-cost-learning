import { useEffect, useMemo, useState } from 'react'

type FirstMoveHistory = { tag: string; correct: boolean; fast: boolean; ms: number; at: number }
type CbtHistory = { at: number; score: number; secondsUsed: number; weakTopics: string[] }
type Drill = { key: string; title: string; cue: string; answer: string; options: string[]; explanation: string; trap: string }
type ReviewHistory = { key: string; correct: boolean; at: number }

const FIRST_KEY = 'boki2-cost-learning:first-move-history:v1'
const CBT_KEY = 'boki2-cbt-history-v1'
const REVIEW_KEY = 'boki2-misconception-review-v1'

const drills: Drill[] = [
  { key: '数量と換算量', title: '数量と完成品換算量', cue: '月末仕掛品200個、加工進捗度40%。材料は工程始点投入。加工費の完成品換算量は？', answer: '80個', options: ['80個','200個','120個','40個'], explanation: '加工費だけ200×40%=80個分。材料は200個分だが、ここで聞かれているのは加工費。', trap: '進捗度を材料にも掛けない。' },
  { key: '完成品換算量', title: '材料と加工を分ける', cue: '材料が工程始点で全量投入されるとき、月末仕掛品150個・加工進捗60%。材料の完成品換算量は？', answer: '150個', options: ['150個','90個','60個','250個'], explanation: '材料は始点で全量投入済みなので150個全部。', trap: '加工進捗60%は材料には使わない。' },
  { key: '製造原価報告書', title: '製造原価報告書の骨格', cue: '当期製品製造原価を求める基本式は？', answer: '月初仕掛品＋当期総製造費用−月末仕掛品', options: ['月初仕掛品＋当期総製造費用−月末仕掛品','当期総製造費用−月初仕掛品＋月末仕掛品','売上高−売上原価','材料費＋販売費＋一般管理費'], explanation: '仕掛品勘定に入った原価のうち、月末に残っていない分が完成して製品へ出た原価。', trap: '月末仕掛品は費用として消えず、次期へ残る。' },
  { key: 'CVP初動', title: 'CVPの最初の一手', cue: '変動費率65%、固定費350,000円。損益分岐点売上高を求める前に、まず何を出す？', answer: '貢献利益率35%', options: ['貢献利益率35%','変動費率を固定費に掛ける','固定費率65%','販売数量'], explanation: '売上高ベースのCVPは固定費÷貢献利益率。まず1−変動費率。', trap: '変動費率で割らない。' },
  { key: '損益分岐点', title: '損益分岐点', cue: '固定費240,000円、貢献利益率40%。損益分岐点売上高は？', answer: '600,000円', options: ['600,000円','96,000円','400,000円','960,000円'], explanation: '240,000÷0.4=600,000円。', trap: '固定費×貢献利益率ではない。' },
  { key: '材料差異', title: '価格差異の数量', cue: '材料価格差異を計算するとき、価格差(AP−SP)に掛ける数量は？', answer: '実際数量AQ', options: ['実際数量AQ','標準数量SQ','完成品数量','基準操業度'], explanation: '価格差異は「実際に買った・使った数量について価格が何円ずれたか」。', trap: '価格差異にSQを掛けない。' },
  { key: '標準原価', title: '数量差異の価格', cue: '材料数量差異を計算するとき、数量差(AQ−SQ)に掛ける価格は？', answer: '標準価格SP', options: ['標準価格SP','実際価格AP','平均価格','販売価格'], explanation: '数量の使い過ぎだけを測りたいので、価格は標準に固定する。', trap: 'APを使うと価格差も混ざる。' },
  { key: '直接労務費差異', title: '賃率差異の時間', cue: '賃率差異を計算するとき、賃率差(AR−SR)に掛ける時間は？', answer: '実際時間AH', options: ['実際時間AH','標準時間SH','基準操業度','完成品数量'], explanation: '賃率差異は「実際に働いた時間について、1時間あたり賃率が何円ずれたか」を測るので実際時間AHを使う。', trap: '賃率差異に標準時間SHを掛けない。' },
  { key: '製造間接費差異', title: 'シュラッター図の現在地', cue: 'シュラッター図は何の差異を分解する図？', answer: '製造間接費', options: ['製造間接費','直接材料費','売上原価','販売費'], explanation: 'シュラッター図は製造間接費の予算差異・能率差異・操業度差異を見る。', trap: '会社全体の利益分析図ではない。' },
  { key: '全部vs直接', title: '固定製造間接費の居場所', cue: '生産1,000個、販売800個。在庫が増えた。全部原価計算で固定製造間接費の未販売分はどこへ？', answer: 'B/Sの製品', options: ['B/Sの製品','全額P/L','売掛金','材料'], explanation: '全部原価計算では固定製造間接費も製品原価。未販売分は在庫としてB/Sに残る。', trap: '直接原価計算と混同しない。' },
  { key: '固定製造間接費', title: '全部原価と直接原価', cue: '在庫が増えるとき、全部原価計算の利益が直接原価計算より高くなりやすい理由は？', answer: '固定製造間接費の一部が在庫に残るから', options: ['固定製造間接費の一部が在庫に残るから','売上が増えるから','変動費が消えるから','固定費が発生しないから'], explanation: '全部原価では固定製造間接費の一部が製品在庫に繰り延べられる。', trap: '売上高の違いが原因ではない。' },
  { key: '個別原価計算', title: '製造指図書', cue: '「製造指図書 No.101」が出た。最初に何をする？', answer: 'No.101ごとに直接費を集める', options: ['No.101ごとに直接費を集める','月全体を平均する','CVPを計算する','完成品換算量を出す'], explanation: '個別原価計算は指図書が原価を集める箱。', trap: '総合原価計算の数量ボックスを書かない。' },
  { key: '製造指図書', title: '予定配賦を指図書へ入れる', cue: '製造指図書No.101の直接労務費80,000円、予定配賦率75%。製造間接費はいくら入れる？', answer: '60,000円', options: ['60,000円','80,000円','20,000円','106,667円'], explanation: '80,000×75%=60,000円をNo.101へ予定配賦する。', trap: '実際発生額をそのまま指図書へ入れない。' },
  { key: '総合原価計算', title: '総合原価計算の初動', cue: '同一製品の大量生産、月末仕掛品あり。まず何を整理する？', answer: '数量の流れ', options: ['数量の流れ','仕訳だけ','販売単価','固定費率'], explanation: '完成品・月末仕掛品へ原価を分ける前に数量ボックスを固定する。', trap: '単価計算から始めない。' },
  { key: '追加材料', title: '途中一括投入', cue: '追加材料Bを工程60%地点で一括投入。月末仕掛品の進捗度40%。材料Bの完成品換算量は？', answer: '0個', options: ['0個','40%分','100%分','完成品と同じ'], explanation: '月末仕掛品は60%地点にまだ到達していないため、追加材料Bは未投入。', trap: '加工進捗度40%をそのまま材料Bへ掛けない。' },
  { key: '正常仕損', title: '正常仕損の負担先', cue: '正常仕損点70%、月末仕掛品進捗40%。正常仕損費を誰が負担する？', answer: '完成品のみ', options: ['完成品のみ','完成品と月末仕掛品','月末仕掛品のみ','売上原価'], explanation: '月末仕掛品は仕損点70%にまだ到達していないので、正常仕損費を負担しない。', trap: '月末仕掛品が仕損点を通過したかを必ず比較する。' },
  { key: '工程別原価計算', title: '前工程費と進捗度', cue: '第2工程の月末仕掛品が加工進捗40%。前工程費にも40%を掛ける？', answer: '掛けない', options: ['掛けない','40%を掛ける','50%を掛ける','材料費だけ掛ける'], explanation: '前工程費は第2工程へ入った時点で前工程が100%完成済みの原価。第2工程の進捗度を掛けるのは当工程加工費。', trap: '前工程費を第2工程の加工費と同じ扱いにしない。' },
  { key: '等級別原価計算', title: '等価係数の意味', cue: '等級別原価計算で原価配分の基礎にする「積数」は？', answer: '数量×等価係数', options: ['数量×等価係数','数量×販売価格','原価÷数量','固定費×数量'], explanation: '品質・大きさ等の差を等価係数で補正し、数量×等価係数で配分基準を作る。', trap: '単純な数量比だけで配らない。' },
  { key: '部門別計算', title: '簡便法の相互配賦', cue: '簡便法の相互配賦法で第2次配賦するとき、補助部門が第1次で受け取った額をどこへ配る？', answer: '製造部門だけ', options: ['製造部門だけ','補助部門だけ','全部門へもう一度','売上原価へ直接'], explanation: '第1次で補助部門間のやり取りを反映した後、第2次では残った受取額を製造部門だけへ配って配賦を終える。', trap: '補助部門へ再度戻すと配賦が終わらない。' },
  { key: '勘定連絡', title: '間接費の入口', cue: '間接材料費・間接労務費・間接経費はまずどこへ集める？', answer: '製造間接費', options: ['製造間接費','仕掛品へ直行','製品','売上原価'], explanation: '製品へ直接たどれない原価はいったん製造間接費へ集め、後で配賦する。', trap: '直接費と同じルートにしない。' },
]

function readJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}

function matchDrill(tag: string) {
  return drills.find((d) => d.key === tag) ?? drills.find((d) => tag.includes(d.key) || d.key.includes(tag))
}

export default function MisconceptionReview() {
  const [revision, setRevision] = useState(0)
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [history, setHistory] = useState<ReviewHistory[]>(() => readJson<ReviewHistory[]>(REVIEW_KEY, []))

  useEffect(() => { localStorage.setItem(REVIEW_KEY, JSON.stringify(history.slice(-200))) }, [history])

  const queue = useMemo(() => {
    const first = readJson<FirstMoveHistory[]>(FIRST_KEY, [])
    const cbt = readJson<CbtHistory[]>(CBT_KEY, [])
    const weights = new Map<string, number>()
    first.forEach((x) => { if (!x.correct || !x.fast) weights.set(x.tag, (weights.get(x.tag) ?? 0) + 1) })
    cbt.forEach((x) => x.weakTopics.forEach((t) => weights.set(t, (weights.get(t) ?? 0) + 2)))
    history.slice(-20).forEach((x) => { if (x.correct) weights.set(x.key, Math.max(0, (weights.get(x.key) ?? 0) - 1)) })

    const ranked = [...weights.entries()].sort((a,b) => b[1]-a[1])
      .map(([tag, weight]) => ({ drill: matchDrill(tag), weight, source: tag }))
      .filter((x): x is { drill: Drill; weight: number; source: string } => !!x.drill && x.weight > 0)

    const unique = ranked.filter((x, i, arr) => arr.findIndex((y) => y.drill.key === x.drill.key) === i)
    return unique.length ? unique.slice(0, 6) : drills.slice(0, 4).map((drill) => ({ drill, weight: 0, source: 'ウォームアップ' }))
  }, [revision, history])

  const current = queue[index % queue.length]
  const correct = choice === current.drill.answer

  const answer = (option: string) => {
    if (choice) return
    setChoice(option)
    setHistory((h) => [...h, { key: current.drill.key, correct: option === current.drill.answer, at: Date.now() }])
  }

  const next = () => {
    setChoice(null)
    setIndex((i) => (i + 1) % queue.length)
    setRevision((v) => v + 1)
  }

  return <section className="misconception-review panel">
    <header className="review-head">
      <div><p className="eyebrow">弱点復習</p><h2>誤概念を15秒で矯正する</h2><p>間違えた問題番号ではなく、<strong>「何を勘違いしたか」</strong>を集計して短い修正問題を返します。</p></div>
      <div className="review-queue-count"><span>現在の復習キュー</span><strong>{queue.length}</strong><small>弱点がなければウォームアップを表示</small></div>
    </header>

    <div className="review-priority">
      {queue.map((x, i) => <button key={`${x.drill.key}-${i}`} className={i === index % queue.length ? 'active' : ''} onClick={() => { setIndex(i); setChoice(null) }}><span>{i + 1}</span><div><b>{x.drill.title}</b><small>{x.source} · 弱点度 {x.weight}</small></div></button>)}
    </div>

    <div className="review-card">
      <div className="review-label"><span>{current.drill.title}</span><b>15秒修正</b></div>
      <h3>{current.drill.cue}</h3>
      <div className="review-options">{current.drill.options.map((op) => {
        const isAnswer = op === current.drill.answer
        const selected = op === choice
        const cls = choice ? isAnswer ? 'correct' : selected ? 'wrong' : 'dim' : ''
        return <button className={cls} key={op} disabled={!!choice} onClick={() => answer(op)}>{op}</button>
      })}</div>
      {choice && <div className={correct ? 'review-feedback correct-box' : 'review-feedback wrong-box'}><strong>{correct ? '修正できました' : 'ここを修正'}</strong><p>{current.drill.explanation}</p><small>ひっかけ警戒：{current.drill.trap}</small><button onClick={next}>次の弱点 →</button></div>}
    </div>

    <div className="review-history"><span>直近の矯正</span><strong>{history.length ? `${history.slice(-20).filter((x) => x.correct).length}/${Math.min(20, history.length)} 正解` : 'まだ履歴なし'}</strong><small>正解すると、その誤概念の優先度を少し下げます。</small></div>
  </section>
}
