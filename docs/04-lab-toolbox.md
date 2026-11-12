> 一句话：L1–L3 的实验环境设计——一个 docker 测试镜像 + 一个入口脚本 + 一组实验配方（recipe）。

# 04 实验工具箱（sip-toolbox）

**状态：设计已定，尚未构建。** 本文件是方案，不是使用手册；构建完成后操作手册落在
`sip/labs/toolbox/README.md`。

## 为什么用镜像而不是在宿主装

1. 宿主 apt 要 `sudo`（本机无免密），docker 不需要
2. **可复现**：工具版本固定在镜像里，三个月后不会因宿主升级而失灵
3. **可糟蹋**：L3 要故意发畸形报文，`--rm` 一次就干净了

镜像属于 `sip/labs/`（实验环境），**不是实现代码**——ADR-0004 的边界不破。

## 镜像内容

| 分类 | 包 | 服务于 |
|---|---|---|
| 信令探针 | `sipsak` | L1-0 冒烟、L3 格式校验 |
| 场景化端点 | `sipp` | L1-1 自环呼叫、L1-3 重传观察、L1-4 401 挑战 |
| 抓包解析 | `tshark` | 全部实验的证据层；`-T fields` 导出可 diff 文本 |
| 手工造包 | `netcat-openbsd` + `python3` | L3-1/3-2 拼报文、改头域 |
| 协议辅助 | `openssl` | γ 阶段 Digest 计算、后续 TLS |
| 诊断 | `iproute2`、`dnsutils`、`jq` | 路由、DNS（3263）、JSON 输出 |
| 可选 | `baresip` / `pjsua` | 终端软电话（**待验证包名**；查不到就不进 v1） |

基础镜像 `debian:bookworm-slim`。不 pin apt 补丁版本，但在 toolbox 的 README 里存一份
`dpkg -l` 快照作为复现依据。

## 网络与挂载约定

| 项 | 决定 | 理由 |
|---|---|---|
| 网络 | 默认 `--network host` | WSL2 下最简单：端口与宿主共享，`tshark` 能看 `eth0`/`lo`。副作用是 5060 可能与宿主冲突 |
| 端口约定 | 5060 主用；冲突时 5062 / 5064 | host 模式同一网络命名空间 |
| 抓包权限 | `--cap-add NET_RAW` | 非 root 抓包的最小能力 |
| 挂载 | `-v "$PWD/sip/labs/captures:/data"` | pcap 与日志统一落 `captures/`，`/data` 为工作目录 |
| 生命周期 | `--rm -it` | 一次会话一个容器，不常驻 |

## 三层结构

```
sip/labs/toolbox/
├── Dockerfile        # 环境定义
├── run.sh            # 唯一入口：build / check / 进容器（docker 参数只在这里定义）
└── recipes/          # 实验配方：怎么让现象发生
```

### recipe 与 drill 的分工

| | drill（`sip/labs/drills/`） | recipe（`sip/labs/toolbox/recipes/`） |
|---|---|---|
| 回答 | **要我证明什么** | **怎么让现象发生** |
| 内容 | 目标 / 判据 / 我踩到的 | 前置 / 命令 / 预期输出 / 失败排查 / 实测记录 |
| 关系 | drill 里写"见 recipes/01" | 不在 recipe 里复制判据 |

## v1 范围（已定）

**镜像 + 前 3 个 recipe**：

| recipe | 对应 task | 做什么 |
|---|---|---|
| `00-basic-call` | L1-1 | `sipp -sn uas` + `sipp -sn uac` 自环，`tshark` 抓包落 `/data` |
| `01-noresponse-retrans` | L1-3 | UAS 故意不响应，量出重传间隔（T1 起倍增，Timer B 64*T1） |
| `02-sipp-401` | L1-4 | UAS 返回 401，看第二次 REGISTER 的 `Authorization` 与 CSeq 递增 |

L3 的 `handcraft` 配方等 L3 真正开跑时再写——现在写大概率是猜的。

> **recipe 里的命令允许是草案**，第一次跑完必须把"实测能用的"写回"实测记录"段。
> 不这么做，recipe 就变成"看上去对的文档"，正是本项目最反对的东西。

## 对 plan.yaml 的影响

| task | 判据升级 |
|---|---|
| L1-0 | `run.sh build` 成功 + `run.sh check` 打出三行版本 + `run.sh` 能进交互 |
| L1-1 / L1-3 / L1-4 | 改为"用对应 recipe 一条命令产出"，判据本身不变 |

## 明确不做

- ❌ 不入 CI、不预构建推送（本地 build 1–2 分钟）
- ❌ 不为瘦身砍工具（tshark 带依赖约 250MB，可接受）
- ❌ 不做多进程拓扑编排（uas/proxy/uac 编排留到 δ 阶段）
- ❌ 镜像里不放实现代码、不放 wiki

## 待验证（动手时先验）

1. `baresip` / `pjsua` 的 apt 包名与可执行文件是否存在 → 查不到就不进 v1（L1-1 用 sipp 自环，本来不需要 GUI）
2. `--network host` 下 `tshark -i any` 能否看到容器外（宿主）产生的流量 —— 影响"Windows 侧软电话"方案是否可行
