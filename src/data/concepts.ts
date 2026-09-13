export type LearningLocation = {
  where: string
  what: string
  why: string
}

export const learningLocations: Record<string, LearningLocation> = {
  material: {
    where: '原価の旅 ＞ 材料',
    what: '材料を購入し、工場へ投入する流れを見ています。',
    why: '材料が資産から製造途中の原価へ変わる瞬間を理解するためです。',
  },
  wip: {
    where: '原価の旅 ＞ 仕掛品',
    what: '材料・労務費・製造間接費を仕掛品へ集めています。',
    why: '製品を作るために使った原価を製造途中として集計するためです。',
  },
  finished: {
    where: '原価の旅 ＞ 製品',
    what: '完成した原価を仕掛品から製品へ移しています。',
    why: '完成したものと、まだ製造途中のものを分けるためです。',
  },
  sold: {
    where: '原価の旅 ＞ 売上原価',
    what: '売れた製品の原価だけを費用へ移しています。',
    why: '売れ残りはB/Sの資産、売れた分だけP/Lの費用になることを理解するためです。',
  },
}
