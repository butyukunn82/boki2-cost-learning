export type CbtField = {
  key: string
  label: string
  type: 'number' | 'select'
  options?: string[]
}

export type CbtQuestion = {
  id: number
  title: string
  topic: string
  stem: string
  fields: CbtField[]
  answers: Record<string, string>
  point: number
  diagnosis: string
  templateId: string
}

function rng(seed: number) {
  let x = seed || 1
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0
    return x / 4294967296
  }
}

function pick<T>(values: T[], random: () => number): T {
  return values[Math.floor(random() * values.length)]
}

function fmt(v: number) {
  return Math.round(v).toLocaleString('ja-JP')
}

export function buildCbtQuestions(seed: number): CbtQuestion[] {
  const random = rng(seed)

  const directMaterial = pick([40000, 50000, 60000, 80000], random)
  const indirectMaterial = pick([8000, 10000, 12000, 15000], random)

  const endingWip = pick([120, 160, 200, 240, 300], random)
  const progress = pick([25, 40, 50, 60, 75], random)
  const convEu = endingWip * progress / 100

  const sp = pick([400, 500, 600, 800], random)
  const sq = pick([800, 1000, 1200], random)
  const aq = sq + pick([80, 100, 120, 150], random)
  const ap = sp + pick([10, 20, 25, 40], random)
  const priceVar = (ap - sp) * aq
  const qtyVar = (aq - sq) * sp

  const variableRate = pick([0.4, 0.5, 0.6, 0.7], random)
  const cmRate = 1 - variableRate
  const fixed = pick([240000, 300000, 360000, 420000], random)
  const beSales = fixed / cmRate

  const production = pick([800, 1000, 1200, 1500], random)
  const endingQty = pick([100, 150, 200], random)
  const sales = production - Math.min(endingQty, production - 100)
  const fixedOh = pick([240000, 300000, 360000, 480000], random)
  const fixedPerUnit = fixedOh / production
  const fixedInEnding = fixedPerUnit * (production - sales)

  return [
    {
      id: 1,
      templateId: 'journal-material-route',
      title: '材料の消費と仕訳',
      topic: '勘定連絡',
      stem: `直接材料費${fmt(directMaterial)}円、間接材料費${fmt(indirectMaterial)}円を製造に投入した。直接材料費の借方科目と、間接材料費の借方科目を選びなさい。`,
      fields: [
        { key: 'direct', label: '直接材料費の借方', type: 'select', options: ['仕掛品', '製造間接費', '製品', '売上原価'] },
        { key: 'indirect', label: '間接材料費の借方', type: 'select', options: ['仕掛品', '製造間接費', '製品', '売上原価'] },
      ],
      answers: { direct: '仕掛品', indirect: '製造間接費' },
      point: 20,
      diagnosis: '直接費は仕掛品へ直行、間接費は製造間接費へ集める。',
    },
    {
      id: 2,
      templateId: 'process-ending-eu',
      title: '総合原価計算',
      topic: '完成品換算量',
      stem: `月末仕掛品${fmt(endingWip)}個、加工進捗度${progress}%。材料は工程始点で全量投入する。月末仕掛品の材料の完成品換算量と、加工費の完成品換算量を入力しなさい。`,
      fields: [
        { key: 'matEu', label: '材料 完成品換算量（個）', type: 'number' },
        { key: 'convEu', label: '加工費 完成品換算量（個）', type: 'number' },
      ],
      answers: { matEu: String(endingWip), convEu: String(convEu) },
      point: 20,
      diagnosis: `材料は${fmt(endingWip)}個分、加工費は${fmt(endingWip)}×${progress}%＝${fmt(convEu)}個分。工程始点投入の材料には加工進捗度を掛けない。`,
    },
    {
      id: 3,
      templateId: 'material-variance',
      title: '直接材料費差異',
      topic: '標準原価',
      stem: `標準価格${fmt(sp)}円、実際価格${fmt(ap)}円、標準数量${fmt(sq)}個、実際数量${fmt(aq)}個。価格差異と数量差異の金額を入力しなさい（不利差異は正の数で入力）。`,
      fields: [
        { key: 'priceVar', label: '価格差異（円）', type: 'number' },
        { key: 'qtyVar', label: '数量差異（円）', type: 'number' },
      ],
      answers: { priceVar: String(priceVar), qtyVar: String(qtyVar) },
      point: 20,
      diagnosis: `価格差異＝(AP−SP)×AQ＝${fmt(priceVar)}円、数量差異＝SP×(AQ−SQ)＝${fmt(qtyVar)}円。`,
    },
    {
      id: 4,
      templateId: 'cvp-break-even',
      title: 'CVP分析',
      topic: '損益分岐点',
      stem: `固定費${fmt(fixed)}円、変動費率${Math.round(variableRate * 100)}%である。損益分岐点売上高を入力しなさい。`,
      fields: [{ key: 'beSales', label: '損益分岐点売上高（円）', type: 'number' }],
      answers: { beSales: String(Math.round(beSales)) },
      point: 20,
      diagnosis: `貢献利益率${Math.round(cmRate * 100)}%を先に出し、${fmt(fixed)}÷${Math.round(cmRate * 100)}%＝${fmt(beSales)}円。`,
    },
    {
      id: 5,
      templateId: 'absorption-direct-profit-gap',
      title: '全部原価と直接原価',
      topic: '固定製造間接費',
      stem: `生産量${fmt(production)}個、販売量${fmt(sales)}個、固定製造間接費${fmt(fixedOh)}円。期首・期末に仕掛品はない。全部原価計算で期末製品に繰り延べられる固定製造間接費と、全部原価計算の利益が直接原価計算より多くなる金額を入力しなさい。`,
      fields: [
        { key: 'fixedInv', label: '期末製品に含まれる固定製造間接費（円）', type: 'number' },
        { key: 'profitDiff', label: '利益差（円）', type: 'number' },
      ],
      answers: { fixedInv: String(Math.round(fixedInEnding)), profitDiff: String(Math.round(fixedInEnding)) },
      point: 20,
      diagnosis: `固定費率${fmt(fixedPerUnit)}円/個×期末在庫${fmt(production - sales)}個＝${fmt(fixedInEnding)}円。`,
    },
  ]
}
