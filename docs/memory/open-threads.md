> 一句话：未决问题与待办。每条必须有触发条件或关闭日期，否则不许记。

# open-threads

## 待办（M1 遗留）

- [ ] 红链 `concepts/dialog`（被 `concepts/transaction` 与 `flows/basic-call` 引用）
  - 触发：开始编译 §12 Dialogs 时
- [ ] `flows/basic-call.md` 仍是 `status: draft`
  - 升 `current` 的前提：① 抓一份真实 pcap 对照 ② 补一个 drill

## 待办（M2）

- [ ] `plan/plan.yaml` 铺完 SIP 八阶段全部任务
  - 触发：M1 样板页人工核对通过后
- [ ] `sip/labs/drills/` 第一个练习：REGISTER 全流程 + 401/407 两次重发
  - 需要：一条真实的 401 挑战报文样例（可从 §22.1 推，或补一份抓包）
- [ ] 生词晋升流程：`vocab/candidates.yaml` → `terms.yaml` 的口令或脚本
  - 触发：候选池首次积累到 10 条

## 待验证

- [ ] 三级索引是否真的必要
  - 假设：页面数过 150 后 `index.md` 单页开始难扫
  - 验证时机：wiki 页面数达到 100 时用 `npm run check` 统计

## 待决

- [ ] `docs/memory/journal.md` 是否按月分文件
  - 触发：单文件超过 500 行
