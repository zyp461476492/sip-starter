> 一句话：未决问题与待办。每条必须有触发条件或关闭日期，否则不许记。

# open-threads

## 待办（M1 遗留）

- [ ] 红链 `concepts/dialog`（被 `concepts/transaction` 与 `flows/basic-call` 引用）
  - 触发：开始编译 §12 Dialogs 时
- [ ] `flows/basic-call.md` 仍是 `status: draft`
  - 升 `current` 的前提：① 抓一份真实 pcap 对照 ② 补一个 drill

## 待办（M2）

- [ ] **Phase 0 认知地基**（p0-1 … p0-5，下一个开工项）——**先于 α-1**
  - p0-1 通读 §1–§3+§5（这几节**未核对正文**，初版地图靠标题把它们归为“跳”，已改正）
  - 产出：`wiki/concepts/sip-mental-model.md`（现在 `status: draft`，一条答案也没有）
  - 判据：五个“为什么”能带锁点作答（`sip/labs/drills/mental-model.md`）
- [ ] **α-1 消息 round-trip**（Phase 0 之后，drill 已写好：`msg-parse.md`）
  - 卡点：实现语言未定 —— 建议先在本仓 `labs/` 用目标语言写验证件，将来直接搬迁
- [ ] α-4 验收工具链：本机是否装了 `sipsak` / `sipexer` / `sipp` / `tshark`
  - 触发：做 α-4 前一天确认，缺则先装（也可写 docker 命令代替）
- [ ] `vocab/candidates.yaml` 晋升流程（含晋升脚本或手工口令）
- [ ] `wiki/questions/` 首批真问题 + file-back 样板

## 待验证

- [ ] 三级索引是否真的必要
  - 假设：页面数过 150 后 `index.md` 单页开始难扫
  - 验证时机：wiki 页面数达到 100 时用 `npm run check` 统计

## 待决

- [ ] `docs/memory/journal.md` 是否按月分文件
  - 触发：单文件超过 500 行
