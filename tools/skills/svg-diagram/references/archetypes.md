# 五类骨架（复制后改内容）

通用约定：`<style>` 见 `tokens.md`；箭头 marker 定义一次，全局复用；`viewBox` 从 0 0 开始。

## 0. 通用头部

```html
<svg width="100%" viewBox="0 0 720 400" role="img" xmlns="http://www.w3.org/2000/svg">
  <title>标题</title>
  <desc>一句话说明这张图画了什么。</desc>
  <defs>
    <style>
      .th { font: 600 13px -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
      .ts { font: 12px -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
      .tn { font: 11px -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
      .tm { font: 12px -apple-system, "Segoe UI", "PingFang SC", sans-serif; }
      .arr { fill: none; stroke: #5F5E5A; stroke-width: 1.5; }
      .arr2 { fill: none; stroke: #B4B2A9; stroke-width: 1.5; }
      .lane { stroke: #B4B2A9; stroke-width: 1; stroke-dasharray: 4 4; }
    </style>
    <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#5F5E5A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
    <marker id="ar2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="#B4B2A9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- 内容 -->

</svg>
```

## 1. 分层架构图

三层堆叠 + 每层若干盒子。数值：层间 y 差 90；盒子宽 150、高 34；同层 gap 20。

```html
<!-- 顶层：三个盒子，中心 x = 130 / 360 / 590 -->
<rect x="40"  y="40" width="150" height="34" rx="8" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="115" y="57" text-anchor="middle" dominant-baseline="central" fill="#444441">盒子 A</text>
<!-- 箭头向下 -->
<path class="arr" d="M115 74L115 106" marker-end="url(#ar)"/>
<!-- 横向长条（承载层） -->
<rect x="40" y="108" width="650" height="34" rx="8" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text class="ts" x="365" y="125" text-anchor="middle" dominant-baseline="central" fill="#085041">中间层 / 通道</text>
```

## 2. 流程图

竖向节点 + 判断分支。节点高 34；分支向右偏移 180。

```html
<rect x="300" y="30" width="150" height="34" rx="8" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="375" y="47" text-anchor="middle" dominant-baseline="central" fill="#444441">收到请求</text>
<path class="arr" d="M375 64L375 96" marker-end="url(#ar)"/>
<text class="tn" x="385" y="84" fill="#5F5E5A">是</text>
```

## 3. 时序 ladder（协议首选）

三条生命线，等距 250；顶部参与者盒子宽 160；消息箭头水平。

```html
<!-- 参与者：中心 x = 120 / 360 / 600 -->
<rect x="40"  y="8" width="160" height="44" rx="8" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="ts" x="120" y="30" text-anchor="middle" dominant-baseline="central" fill="#444441">Alice</text>
<!-- 生命线 -->
<path class="lane" d="M120 52L120 520" fill="none"/>
<!-- 消息：从 Alice 到 Proxy，标签在上方 12px -->
<path class="arr" d="M120 110L360 110" marker-end="url(#ar)"/>
<text class="tm" x="240" y="98" text-anchor="middle" fill="#444441">INVITE</text>
<!-- 反向消息（Proxy → Alice） -->
<path class="arr" d="M360 170L120 170" marker-end="url(#ar)"/>
<text class="tm" x="240" y="158" text-anchor="middle" fill="#444441">100 Trying</text>
```

要点：同一时刻的两条消息**不要重叠**（y 差 ≥20）；响应箭头方向与请求相反；消息多时把 y 步长压到 50。

## 4. 状态机

圆角矩形表示状态（宽 120 高 34），箭头带标签。起始状态用实心小圆，终止用双圈。

```html
<circle cx="60" cy="60" r="6" fill="#444441"/>
<path class="arr" d="M68 60L118 60" marker-end="url(#ar)"/>
<rect x="120" y="43" width="120" height="34" rx="17" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text class="ts" x="180" y="60" text-anchor="middle" dominant-baseline="central" fill="#085041">Calling</text>
```

## 5. 对照图

左右两栏 + 中间分隔。左栏宽 300，右栏宽 300，中间留 40 给分隔虚线。

```html
<rect x="30" y="40" width="300" height="260" rx="12" fill="#F1EFE8" stroke="#5F5E5A" stroke-width="0.5"/>
<text class="th" x="54" y="62" fill="#444441">方案 A</text>
<path class="arr2" d="M360 170L390 170" stroke-dasharray="3 3"/>
<rect x="390" y="40" width="300" height="260" rx="12" fill="#E1F5EE" stroke="#0F6E56" stroke-width="0.5"/>
<text class="th" x="414" y="62" fill="#085041">方案 B</text>
```
