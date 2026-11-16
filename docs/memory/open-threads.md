> 一句话：未决问题与待办。每条必须有触发条件或关闭日期，否则不许记。

# open-threads

## 待办（M1 遗留）

- [x] ~~红链 `concepts/dialog`~~ 已建 `wiki/concepts/dialog.md`（2026-11-16，status: draft）
  - 升 `current` 的条件：编译 §12.2 并在 L1 抓包里核对一次 route set
- [ ] `flows/basic-call.md` 仍是 `status: draft`
  - 升 `current` 的前提：① 抓一份真实 pcap 对照 ② 补一个 drill

## 待办（M2）

- [x] ~~L0-3 写进 `plan.yaml`~~ 已落（2026-11-16，用户授权 agent 代改；l0-1 判据收窄并标 done）
- [ ] **"✓ 已支撑"的定义**要不要落进 `docs/`：目前绿勾只等于"slug 存在"，不覆盖判据
  - 触发：下一次有任务真要按绿勾判断"能不能开工"时
- [x] ~~**L0-1** 读 §4 + §24.1/§24.2~~ 图已画对（2026-11-16），判据拆分见上
- [ ] **L1-0 实验环境**：按 `docs/04-lab-toolbox.md` 建 docker 镜像 + 前 3 个 recipe
  - 已定：v1 = Dockerfile + run.sh + recipes/00,01,02；未动手
  - 已验证：本机 sipsak/sipp/tshark **均未安装**，docker 29.7.2 **可用**，sudo 需密码
  - 待验证：`baresip`/`pjsua` 包名；`--network host` 下 tshark 能否看到宿主侧流量
- [ ] **L1-1 抓包**：需要两台软电话或 `sipp` uas + `pjsua`
  - 触发：L1-0 完成时
- [ ] `vocab/candidates.yaml` 晋升流程（含晋升脚本或手工口令）
- [ ] `wiki/questions/` 首批真问题 + file-back 样板

## 待验证

- [ ] 三级索引是否真的必要
  - 假设：页面数过 150 后 `index.md` 单页开始难扫
  - 验证时机：wiki 页面数达到 100 时用 `npm run check` 统计

## 待决

- [x] ~~AGENTS.md §2 按 ADR-0007 拆行~~ 已改（2026-11-16，用户授权）：元数据人+agent / 判据与 status 仅人 / 词库正式本人

- [ ] `docs/memory/journal.md` 是否按月分文件
  - 触发：单文件超过 500 行

## 待办（M4：译文层与站点版式）

- [ ] **P4 续译批次 1**（已译 8/302 节）：§17.1.1.2、§17.2.1、§16.2–16.6、§13.1、§13.2、§10.2、§10.3
  - 顺序理由：这七组是 L1–L2 要读的全部；§16/§17 是 L2 的重心
  - 每条译完即跑 `npm run zh:check`；`status` 只到 `draft`
- [ ] 批次 1 完成后做**独立规范段落复审**（换上下文重读英文 + 现有中文，只报不一致、不改文风）
  - 触发：§17 主体译完时
- [ ] `status: reviewed` 一节都没有——**这活只能人干**。建议起始点：§8.1.1.7、§24.2（报文可逐行对）
- [ ] 对照模式的**逐句行对齐**（现在只做节级并列）
  - 触发：读的时候发现"找不到对应句"超过三次，再考虑做句级切分
- [ ] `vocab/candidates.yaml` 还没收 GLOSSARY 里的 60 个词
  - 卡点：入池要求真实音标，我不用记忆填音标；要走 `scripts/vocab-lookup.mjs` 查过再写
  - 触发：下次批量补全候选词时一起做

## 待你点头（AGENTS.md 只由人改）

- [ ] `AGENTS.md` §2 目录表加一行：`sip/zh/` ｜ 中文译文（可再生产物） ｜ LLM 可写，人标 `reviewed`
- [ ] `AGENTS.md` §3 硬规则加一条：**规范词不译**——`MUST` / `MUST NOT` / `SHOULD` / `MAY` 等保留英文原词，
  译文层校验以 `npm run zh:check` 为准（否则"不得"与"不应"会混）
  - 理由与实现见 ADR-0006
