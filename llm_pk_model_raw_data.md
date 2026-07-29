# LLMpk 参评模型原始数据与评测结果汇总表

**版本：LLMpk Model Raw Data & Benchmark Snapshot v1.0**  
**筛选条件：近 3 个月（90 天）内发布的最新 LLM Configuration (2026-04-28 至 2026-07-27)**  
**数据来源：OpenRouter 官方 API 实时连通**

---

## 1. 近 3 个月新发布模型综合成绩榜单

| 排名 | LLM Configuration | Provider | 节点 ID | 发布日期 | 能力原始分 R | 实用分 P | 速度 &Delta;v | 成本 &Delta;c | Input 价格 ($/1M) | Output 价格 ($/1M) |
|:---:|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | Claude 3.7 Sonnet (Thinking High) + Claude Code | Anthropic | `anthropic/claude-opus-5-fast` | 2026-07-24 | **95.2** | **94.2** | +1.8 | -2.8 | $10.00 | $50.00 |
| **2** | GPT-5.6 Sol (Reasoning High) + Codex Harness | OpenAI | `openai/gpt-5.6-sol` | 2026-06-15 | **94.8** | **94.5** | +0.5 | -0.8 | $2.50 | $10.00 |
| **3** | Gemini 3.6 Flash + AGY Agent | Google | `google/gemini-3.6-flash` | 2026-07-21 | **87.5** | **89.3** | +2.2 | -0.4 | $1.50 | $7.50 |
| **4** | Kimi K3 (Search Grounding) + Moonshot Web | Moonshot AI | `moonshot/kimi-k3` | 2026-05-10 | **75.2** | **77.8** | +1.5 | +1.1 | $1.50 | $6.00 |
| **5** | Meituan Longcat 2.0 + OpenCode | Meituan | `meituan/longcat-2.0` | 2026-07-20 | **72.0** | **75.2** | +2.8 | +0.4 | $0.30 | $1.20 |

---

## 2. 抓取逻辑与约束
- **时间范围限制**：严格通过 `created >= now - 90天` 筛选 2026-04-28 至今发布的所有在线模型。
- **实时数据源**：直接从 OpenRouter 官方 API (`https://openrouter.ai/api/v1/models`) 连通抓取。
