import type { CbtQuestion } from './cbtTemplates'

function rng(seed: number) {
  let x = seed || 1
  return () => {
    x = (x * 1103515245 + 12345) >>> 0
    return x / 4294967296
  }
}

function pick<T>(values: T[], random: () => number): T {
  return values[Math.floor(random() * values.length)]
}

function fmt(v: number) {
  return Math.round(v).toLocaleString('ja-JP')
}

export function buildSupplementalCbtQuestions(seed: number): CbtQuestion[] {
  const random = rng(seed + 27183)

  const stage1Units = pick([600, 800, 1000, 1200], random)
  const endingWip = pick([100, 150, 200], random)
  const safeEnding = Math.min(endingWip, stage1Units - 100)
  const completed = stage1Units - safeEnding
  const stage1UnitCost = pick([700, 800, 900, 1000], random)
  const stage1Cost = stage1Units * stage1UnitCost
  const progress = pick([40, 50, 60], random)
  const stage2Added = pick([240000, 300000, 360000, 420000], random)
  const convEu = completed + safeEnding * progress / 100
  const addedPerEu = stage2Added / convEu
  const endingTransferred = stage1UnitCost * safeEnding
  const endingAdded = Math.round(addedPerEu * safeEnding * progress / 100)

  const machining = pick([700000, 800000, 900000, 1000000], random)
  const assembly = pick([500000, 600000, 700000, 800000], random)
  const power = pick([200000, 250000, 300000, 350000], random)
  const repair = pick([160000, 200000, 240000, 280000], random)

  const powerToMachining = power * .4
  const powerToAssembly = power * .4
  const powerToRepair = power * .2
  const repairToMachining = repair * .45
  const repairToAssembly = repair * .35
  const repairToPower = repair * .2
  const powerReceived = repairToPower
  const repairReceived = powerToRepair
  const machiningFinal = machining + powerToMachining + repairToMachining + powerReceived * .5 + repairReceived * (.45 / .8)
  const assemblyFinal = assembly + powerToAssembly + repairToAssembly + powerReceived * .5 + repairReceived * (.35 / .8)

  return [
    {
      id: 101,
      templateId: 'process-stage-transfer',
      title: '工程別総合原価計算',
      topic: '工程別原価計算',
      stem: `第1工程から第2工程へ${fmt(stage1Units)}個、総額${fmt(stage1Cost)}円が振り替えられた。第2工程の月末仕掛品は${fmt(safeEnding)}個、加工進捗度${progress}%、第2工程追加加工費は${fmt(stage2Added)}円である。月末仕掛品に含まれる前工程費と、第2工程加工費を入力しなさい（加工費は円未満四捨五入）。`,
      fields: [
        { key: 'transferred', label: '月末仕掛品の前工程費（円）', type: 'number' },
        { key: 'added', label: '月末仕掛品の第2工程加工費（円）', type: 'number' },
      ],
      answers: { transferred: String(Math.round(endingTransferred)), added: String(endingAdded) },
      point: 20,
      diagnosis: `前工程費は第2工程へ入った時点で100%引継ぎ。${fmt(stage1UnitCost)}円/個×${fmt(safeEnding)}個＝${fmt(endingTransferred)}円。第2工程加工費だけ進捗度を反映する。`,
    },
    {
      id: 102,
      templateId: 'reciprocal-department-allocation',
      title: '部門別計算・簡便法の相互配賦',
      topic: '部門別計算',
      stem: `機械部${fmt(machining)}円、組立部${fmt(assembly)}円、動力部${fmt(power)}円、修繕部${fmt(repair)}円。第1次配賦は、動力部→機械40%・組立40%・修繕20%、修繕部→機械45%・組立35%・動力20%。第2次では補助部門が第1次で受け取った額だけを製造部門へ配る。最終の機械部費と組立部費を入力しなさい（円未満四捨五入）。`,
      fields: [
        { key: 'machining', label: '最終 機械部費（円）', type: 'number' },
        { key: 'assembly', label: '最終 組立部費（円）', type: 'number' },
      ],
      answers: { machining: String(Math.round(machiningFinal)), assembly: String(Math.round(assemblyFinal)) },
      point: 20,
      diagnosis: '簡便法の相互配賦は、第1次で補助部門間のやり取りを反映し、第2次で受取額だけを製造部門へ配る。最後に全部門費合計と一致するか検算する。',
    },
  ]
}
