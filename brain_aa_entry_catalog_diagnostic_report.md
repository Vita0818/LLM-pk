# Artificial Analysis (AA) AA Entry Catalog 诊断与抓取报告

## 1. Catalog 总体概述
- **AA Entry 总数**: 724 个 (已建立完整 Catalog)
- **成功抓取 Profile 页面数**: 52 个基础模型 Profile
- **生成的有效 Observation 总数**: 1828 条

## 2. Benchmark 指标评估状态统计 (available / not_evaluated / fetch_failed / parse_failed)

| 指标 ID | 指标名称 | Available (可用) | Not Evaluated (未测试) | Fetch Failed (请求失败) | Parse Failed (解析失败) |
|---|---|:---:|:---:|:---:|:---:|
| `aa_hle` | Humanity's Last Exam | 187 | 537 | 0 | 0 |
| `aa_gpqa_diamond` | GPQA Diamond | 187 | 537 | 0 | 0 |
| `aa_critpt` | CritPt | 188 | 536 | 0 | 0 |
| `aa_scicode` | SciCode | 188 | 536 | 0 | 0 |
| `aa_gdpval_v2` | GDPval-AA v2 | 178 | 546 | 0 | 0 |
| `aa_terminalbench_v21` | Terminal-Bench v2.1 | 188 | 536 | 0 | 0 |
| `aa_tau3_banking` | τ³-Banking | 178 | 546 | 0 | 0 |
| `aa_omniscience_accuracy` | AA-Omniscience Accuracy | 178 | 546 | 0 | 0 |
| `aa_omniscience_nonhallucination` | AA-Omniscience Non-Hallucination | 178 | 546 | 0 | 0 |
| `aa_lcr` | AA-LCR Long Context | 178 | 546 | 0 | 0 |

## 3. 评分池与来源池分离规则
- 全量 724 个 AA Entry 独立卡片保存在 **来源卡片池** 中，供管理员随时搜索与拖拽关联。
- 未被拖入“已启用配置盒子”的 721 个 Entry 卡片**不参与任何最高值计算、中位数计算或能力原始分计算**，彻底防止分值污染！
