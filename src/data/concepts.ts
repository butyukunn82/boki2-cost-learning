export type LearningLocation = {
  where: string
  what: string
  why: string
  firstLook: string
}

export const learningLocations: Record<string, LearningLocation> = {
  material: {
    where: '原価の旅 ＞ 材料',
    what: '買った材料を、直接材料と間接材料に分けて製造へ流しています。',
    why: '同じ「材料」でも、直接費は仕掛品へ直行し、間接費はいったん製造間接費へ集まる違いを理解するためです。',
    firstLook: 'その材料は、どの製品に使ったか直接わかる？',
  },
  wip: {
    where: '原価の旅 ＞ 仕掛品',
    what: '直接材料・直接労務費・配賦された製造間接費を仕掛品へ集めています。',
    why: '製品を作るために使った原価を、製造途中の資産として集計するためです。',
    firstLook: '仕掛品に入る原価は「直接費＋配賦された製造間接費」。',
  },
  finished: {
    where: '原価の旅 ＞ 製品',
    what: '完成した原価を仕掛品から製品へ移しています。',
    why: '完成したものと、まだ製造途中のものを分けるためです。',
    firstLook: '完成した分だけを仕掛品から製品へ移す。',
  },
  sold: {
    where: '原価の旅 ＞ 売上原価',
    what: '売れた製品の原価だけを費用へ移しています。',
    why: '売れ残りはB/Sの資産、売れた分だけP/Lの費用になることを理解するためです。',
    firstLook: '売れたか、まだ残っているか。ここがB/SとP/Lの境目です。',
  },
}
