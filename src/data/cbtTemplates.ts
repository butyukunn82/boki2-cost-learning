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

type QuestionDraft = Omit<CbtQuestion, 'id'>

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

function shuffle<T>(values: T[], random: () => number): T[] {
  const next = [...values]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
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

  const beginWipCost = pick([80000, 100000, 120000, 150000], random)
  const mcrMaterial = pick([360000, 420000, 480000, 540000], random)
  const mcrLabor = pick([240000, 280000, 320000, 360000], random)
  const mcrOh = pick([180000, 220000, 260000, 300000], random)
  const endingWipCost = pick([120000, 150000, 180000, 210000], random)
  const currentManufacturing = mcrMaterial + mcrLabor + mcrOh
  const cogm = beginWipCost + currentManufacturing - endingWipCost

  const jobDm = pick([90000, 120000, 150000, 180000], random)
  const jobDl = pick([60000, 80000, 100000, 120000], random)
  const ohRate = pick([60, 80, 100, 120], random)
  const appliedOh = jobDl * ohRate / 100
  const jobCost = jobDm + jobDl + appliedOh

  const addEnding = pick([100, 150, 200, 250], random)
  const addProgress = pick([20, 40, 60, 80], random)
  const addPoint = pick([30, 50, 70], random)
  const addMaterialEu = addProgress >= addPoint ? addEnding : 0

  const spoilPoint = pick([30, 50, 70], random)
  const spoilEndingProgress = pick([20, 40, 60, 80], random)
  const spoilBurden = spoilEndingProgress >= spoilPoint ? '完成品と月末仕掛品の両方' : '完成品のみ'

  const gradeACount = pick([400, 500, 600], random)
  const gradeBCount = pick([200, 250, 300], random)
  const gradeBCoeff = pick([0.5, 0.8], random)
  const equivalentTotal = gradeACount + gradeBCount * gradeBCoeff
  const equivalentUnitCost = pick([400, 500, 600], random)
  const gradeTotalCost = equivalentTotal * equivalentUnitCost
  const gradeBCost = gradeBCount * gradeBCoeff * equivalentUnitCost

  const candidates: QuestionDraft[] = [
    {
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
      templateId: 'manufacturing-cost-report',
      title: '製造原価報告書',
      topic: '製造原価報告書',
      stem: `月初仕掛品原価${fmt(beginWipCost)}円、直接材料費${fmt(mcrMaterial)}円、直接労務費${fmt(mcrLabor)}円、製造間接費${fmt(mcrOh)}円、月末仕掛品原価${fmt(endingWipCost)}円である。当期総製造費用と当期製品製造原価を入力しなさい。`,
      fields: [
        { key: 'current', label: '当期総製造費用（円）', type: 'number' },
        { key: 'cogm', label: '当期製品製造原価（円）', type: 'number' },
      ],
      answers: { current: String(currentManufacturing), cogm: String(cogm) },
      point: 20,
      diagnosis: `当期総製造費用＝材料＋労務＋製造間接費＝${fmt(currentManufacturing)}円。製品製造原価＝月初＋当期総製造費用−月末＝${fmt(cogm)}円。`,
    },
    {
      templateId: 'job-order-costing',
      title: '個別原価計算',
      topic: '製造指図書',
      stem: `製造指図書No.101の直接材料費は${fmt(jobDm)}円、直接労務費は${fmt(jobDl)}円である。製造間接費を直接労務費の${ohRate}%で予定配賦する。予定配賦製造間接費とNo.101の製造原価を入力しなさい。`,
      fields: [
        { key: 'appliedOh', label: '予定配賦製造間接費（円）', type: 'number' },
        { key: 'jobCost', label: 'No.101 製造原価（円）', type: 'number' },
      ],
      answers: { appliedOh: String(appliedOh), jobCost: String(jobCost) },
      point: 20,
      diagnosis: `予定配賦額＝直接労務費×${ohRate}%＝${fmt(appliedOh)}円。指図書別原価は直接材料費＋直接労務費＋予定配賦額。`,
    },
    {
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
      templateId: 'additional-material-point',
      title: '追加材料の投入点',
      topic: '追加材料',
      stem: `月末仕掛品は${fmt(addEnding)}個、加工進捗度${addProgress}%。追加材料Bは工程の${addPoint}%地点で一括投入される。月末仕掛品に含まれる材料Bの完成品換算量を入力しなさい。`,
      fields: [{ key: 'materialBEu', label: '材料B 完成品換算量（個）', type: 'number' }],
      answers: { materialBEu: String(addMaterialEu) },
      point: 20,
      diagnosis: addProgress >= addPoint
        ? `月末仕掛品は${addPoint}%の投入点を通過済み。材料Bは${fmt(addEnding)}個分すべて投入済み。`
        : `月末仕掛品は${addPoint}%の投入点に未到達。材料Bはまだ投入されていないので0個。`,
    },
    {
      templateId: 'normal-spoilage-burden',
      title: '正常仕損の負担先',
      topic: '正常仕損',
      stem: `正常仕損は工程の${spoilPoint}%地点で発生し、月末仕掛品の加工進捗度は${spoilEndingProgress}%である。正常仕損費の負担先として適切なものを選びなさい。`,
      fields: [{ key: 'burden', label: '正常仕損費の負担先', type: 'select', options: ['完成品のみ', '完成品と月末仕掛品の両方', '月末仕掛品のみ', '売上原価'] }],
      answers: { burden: spoilBurden },
      point: 20,
      diagnosis: spoilEndingProgress >= spoilPoint
        ? '月末仕掛品も仕損発生点を通過しているため、完成品と月末仕掛品の両方が正常仕損費を負担する。'
        : '月末仕掛品は仕損発生点に未到達なので、正常仕損費は完成品のみが負担する。',
    },
    {
      templateId: 'grade-costing',
      title: '等級別総合原価計算',
      topic: '等級別原価計算',
      stem: `A等級${fmt(gradeACount)}個（等価係数1.0）、B等級${fmt(gradeBCount)}個（等価係数${gradeBCoeff}）を生産し、完成品総合原価は${fmt(gradeTotalCost)}円である。B等級へ配分する原価を入力しなさい。`,
      fields: [{ key: 'gradeB', label: 'B等級の原価（円）', type: 'number' }],
      answers: { gradeB: String(gradeBCost) },
      point: 20,
      diagnosis: `積数は数量×等価係数。B等級は${fmt(gradeBCount)}×${gradeBCoeff}の積数で総原価を配分し、${fmt(gradeBCost)}円。`,
    },
    {
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

  return shuffle(candidates, random)
    .slice(0, 5)
    .map((q, index) => ({ ...q, id: index + 1 }))
}
