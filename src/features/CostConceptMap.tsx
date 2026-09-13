type MapMode = 'learn' | 'lab'

type Node = {
  id: string
  title: string
  plain: string
  where: string
  group: 'flow' | 'costing' | 'standard' | 'profit'
  mode: MapMode
  topic: string
}

const nodes: Node[] = [
  { id: 'materials', title: '材料・労務・経費', plain: '原価が発生する', where: '工場の入口', group: 'flow', mode: 'learn', topic: 'journey' },
  { id: 'overhead', title: '製造間接費', plain: '直接追えない原価をいったん集める', where: '製造中', group: 'flow', mode: 'learn', topic: 'journey' },
  { id: 'department', title: '部門別計算', plain: '間接費を部門へ分け直す', where: '製造間接費の中', group: 'flow', mode: 'learn', topic: 'department' },
  { id: 'wip', title: '仕掛品', plain: '製造中の原価の居場所', where: '製造中', group: 'flow', mode: 'learn', topic: 'journey' },
  { id: 'product', title: '製品', plain: '完成したが、まだ売れていない原価', where: '完成後', group: 'flow', mode: 'learn', topic: 'journey' },
  { id: 'cogs', title: '売上原価', plain: '売れた瞬間に費用になる', where: '販売後', group: 'flow', mode: 'learn', topic: 'journey' },
  { id: 'job', title: '個別原価計算', plain: '指図書ごとに原価を集める', where: '仕掛品の計算方法', group: 'costing', mode: 'learn', topic: 'job-order' },
  { id: 'process', title: '総合原価計算', plain: '大量生産を完成品と月末仕掛品へ分ける', where: '仕掛品の計算方法', group: 'costing', mode: 'learn', topic: 'process' },
  { id: 'method', title: '平均法 / FIFO', plain: '月初仕掛品を混ぜるか分けるか', where: '総合原価計算', group: 'costing', mode: 'learn', topic: 'methods' },
  { id: 'addition', title: '追加材料', plain: 'いつ材料を入れたかを見る', where: '総合原価計算', group: 'costing', mode: 'learn', topic: 'additional-material' },
  { id: 'loss', title: '正常仕損', plain: '失われた原価を誰が負担するか', where: '総合原価計算', group: 'costing', mode: 'learn', topic: 'spoilage-process' },
  { id: 'stage', title: '工程別', plain: '前工程費を次工程へ引き継ぐ', where: '総合原価計算', group: 'costing', mode: 'learn', topic: 'spoilage-process' },
  { id: 'grade', title: '組別・等級別', plain: '種類・等級へ原価を分ける', where: '総合原価計算', group: 'costing', mode: 'learn', topic: 'group-grade' },
  { id: 'mcr', title: '製造原価報告書', plain: '仕掛品から製品へ出た原価をまとめる', where: '仕掛品→製品', group: 'costing', mode: 'learn', topic: 'mcr' },
  { id: 'standard-card', title: '標準原価カード', plain: '製品1個の標準原価レシピを作る', where: '標準原価計算の入口', group: 'standard', mode: 'lab', topic: 'standard-card' },
  { id: 'material-var', title: '材料費差異', plain: '価格と数量のズレを見る', where: '標準原価計算', group: 'standard', mode: 'lab', topic: 'material-variance' },
  { id: 'labor-var', title: '労務費差異', plain: '賃率と時間のズレを見る', where: '標準原価計算', group: 'standard', mode: 'lab', topic: 'labor-variance' },
  { id: 'oh-var', title: '製造間接費差異', plain: '予算・能率・操業度のズレを見る', where: '標準原価計算', group: 'standard', mode: 'lab', topic: 'overhead-variance' },
  { id: 'direct', title: '全部原価 / 直接原価', plain: '固定製造間接費をどこに置くか', where: '製品原価と期間費用', group: 'profit', mode: 'lab', topic: 'direct-costing' },
  { id: 'cvp', title: 'CVP', plain: 'いくら売れば利益が出るか', where: '利益計画', group: 'profit', mode: 'lab', topic: 'cvp' },
]

const groups = [
  { key: 'flow', title: '① 原価の旅', description: 'まず「原価はどこにいるか」を見る' },
  { key: 'costing', title: '② 原価を測る・分ける', description: '仕掛品や完成品へいくら持たせるか' },
  { key: 'standard', title: '③ 標準と実際を比べる', description: '標準を作り、差が出た理由を分解する' },
  { key: 'profit', title: '④ 利益につなげる', description: '原価を経営判断へ使う' },
] as const

export default function CostConceptMap({ onNavigate }: { onNavigate: (mode: MapMode, topic: string) => void }) {
  return <section className="concept-map panel">
    <header className="lab-heading">
      <div>
        <p className="eyebrow">全体地図</p>
        <h2>工業簿記で「今どこ？」を見失わない</h2>
        <p>論点をバラバラに暗記しません。<strong>原価が生まれる → 製造中に集まる → 完成する → 売れる → 差を分析する → 利益計画に使う</strong>という1本の世界に置きます。カードをタップすると、その論点へ移動します。</p>
      </div>
      <div className="lab-location">
        <span>どこ？</span><strong>工業簿記・原価計算の全体</strong>
        <span>何を？</span><strong>各論点の位置と役割</strong>
        <span>なぜ？</span><strong>「何の計算をしているか分からない」を防ぐため</strong>
      </div>
    </header>

    <div className="map-backbone">
      <Step label="発生" title="材料・労務・経費" />
      <Arrow />
      <Step label="製造中" title="製造間接費 / 仕掛品" />
      <Arrow />
      <Step label="完成" title="製品" />
      <Arrow />
      <Step label="販売" title="売上原価" />
      <Arrow />
      <Step label="結果" title="利益" />
    </div>

    <div className="concept-groups">
      {groups.map((group) => <article key={group.key} className={`concept-group ${group.key}`}>
        <header><span>{group.title}</span><small>{group.description}</small></header>
        <div className="concept-node-grid">
          {nodes.filter((node) => node.group === group.key).map((node) => <button type="button" key={node.id} className="concept-node" onClick={() => onNavigate(node.mode, node.topic)}>
            <span>{node.where}</span>
            <strong>{node.title}</strong>
            <p>{node.plain}</p>
            <em>この論点を開く →</em>
          </button>)}
        </div>
      </article>)}
    </div>

    <div className="concept-bridges">
      <Bridge from="個別・総合原価計算" to="製造原価報告書" text="製造中の原価を、完成品と月末仕掛品へ分ける" />
      <Bridge from="標準原価カード" to="差異分析" text="1個の標準を作る → SQ・SHを出す → 実際と比べる" />
      <Bridge from="差異分析" to="改善" text="差がある → 価格・数量・時間・操業度など原因へ分解" />
      <Bridge from="直接原価計算" to="CVP" text="変動費と固定費を分ける → 利益計画へ使う" />
    </div>

    <div className="concept-memory"><strong>迷ったら戻る：</strong><span>①いま原価はどこにいる？ ②何を分けようとしている？ ③その計算結果は次にどこへ行く？</span></div>
  </section>
}

function Step({ label, title }: { label: string; title: string }) {
  return <div className="map-step"><span>{label}</span><strong>{title}</strong></div>
}
function Arrow() { return <b className="map-arrow">→</b> }
function Bridge({ from, to, text }: { from: string; to: string; text: string }) {
  return <div className="concept-bridge"><span>{from}</span><b>→</b><span>{to}</span><small>{text}</small></div>
}
