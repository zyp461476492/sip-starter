> 一句话：未决问题与待办。每条必须有触发条件或关闭日期，否则不许记。

# open-threads

## 待办（M1 遗留）

- [ ] 红链 `concepts/dialog`（被 `concepts/transaction` 与 `flows/basic-call` 引用）
  - 触发：开始编译 §12 Dialogs 时
- [ ] `flows/basic-call.md` 仍是 `status: draft`
  - 升 `current` 的前提：① 抓一份真实 pcap 对照 ② 补一个 drill

## 待办（M2）

- [ ] **L0-1**（下一个开工项）读 §4 + §24.1/§24.2，40min，不写代码（`plan.yaml` 的 `est`）
- [ ] **L1-0 工具链**：本机是否已有 `sipsak` / `sipp` / `tshark`
  - 触发：进入 L1 前一天确认；缺的写 docker 命令，不要卡在装环境
- [ ] **L1-1 抓包**：需要两台软电话或 `sipp` uas + `pjsua`
  - 触发：L1-0 完成时
- [ ] `vocab/candidates.yaml` 晋升流程（含晋升脚本或手工口令）
- [ ] `wiki/questions/` 首批真问题 + file-back 样板

## 待验证

- [ ] 三级索引是否真的必要
  - 假设：页面数过 150 后 `index.md` 单页开始难扫
  - 验证时机：wiki 页面数达到 100 时用 `npm run check` 统计

## 待决

- [ ] `docs/memory/journal.md` 是否按月分文件
  - 触发：单文件超过 500 行
