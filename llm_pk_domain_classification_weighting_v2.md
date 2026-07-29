# LLM PK 领域归类与权重方案

**版本：Domain Classification & Weighting v2.1**

本文档只定义六个能力领域、原子指标归属和领域内权重。归一化、缺失值处理、
覆盖门槛、总分聚合和实用分算法继续沿用现有 Scoring 版本，不在本次变更中修改。

---

# 1. 设计原则

1. 六个领域继续等权，各占能力分的 \(1/6\)。
2. 每个原子指标只进入一个领域。
3. Coding 与 Engineering 分开：前者衡量代码推理与实现，后者衡量端到端工程和专业工作。
4. 原 Reliability 不再作为独立领域；事实非幻觉归入 Search & Knowledge，Agent 错误恢复与工具幻觉归入 Agentic Work。
5. 当前内置配置中覆盖率较高的指标获得较高权重，但任务代表性仍然优先于单纯覆盖率。
6. 综合指标与其组成项不得重复计分。

---

# 2. 六个能力领域

| 领域 | 总分权重 | 主要含义 |
|---|---:|---|
| Chatting | 16.67% | 指令遵循、多轮对话、表达与开放式提示 |
| Math & Science | 16.67% | 数学、科学和高难度学术推理 |
| Coding | 16.67% | 代码生成、算法、科学计算与文本式编程 |
| Engineering | 16.67% | 软件工程、终端任务、专业工作与代码库执行 |
| Agentic Work | 16.67% | 多步业务任务、生产 Agent 控制、纠错与工具可靠性 |
| Search & Knowledge | 16.67% | 开放域知识、非幻觉、长上下文检索与联网搜索 |

---

# 3. Chatting

| 指标 | 来源 | 领域内权重 |
|---|---|---:|
| Instruction Following | Arena Text | 30% |
| Multi-Turn | Arena Text | 30% |
| Creative Writing | Arena Text | 20% |
| Hard Prompts | Arena Text | 20% |
| **合计** |  | **100%** |

四项在当前 35 个内置配置中的覆盖率均为 80.0%，因此权重主要按照任务重要性分配。

---

# 4. Math & Science

| 指标 | 来源 | 领域内权重 |
|---|---|---:|
| Humanity’s Last Exam | Artificial Analysis | 30% |
| GPQA Diamond | Artificial Analysis | 30% |
| CritPt | Artificial Analysis | 20% |
| Arena Math | Arena Text | 20% |
| **合计** |  | **100%** |

三项 AA 指标覆盖率为 97.1%，Arena Math 为 74.3%。HLE 与 GPQA 作为覆盖广且代表性较强的核心评测，各占 30%。

---

# 5. Coding

Coding 只评价代码推理与实现，不再混入端到端软件工程、WebDev 或生产 Agent Harness。

| 指标 | 来源 | 当前覆盖率 | 领域内权重 |
|---|---|---:|---:|
| SciCode | Artificial Analysis | 97.1% | 55% |
| Arena Text Coding | Arena Text | 80.0% | 45% |
| **合计** |  |  | **100%** |

SciCode 覆盖率更高，因此获得略高权重；Arena Text Coding 保留真实用户编程体验信号。

---

# 6. Engineering

Engineering 将原 Coding & Engineering 中的端到端工程指标，与 Professional Work
中的专业交付和终端操作组合为同一领域。

| 指标 | 来源 | 当前覆盖率 | 领域内权重 |
|---|---|---:|---:|
| GDPval-AA v2 | Artificial Analysis | 85.7% | 20% |
| Terminal-Bench v2.1 | Artificial Analysis | 88.6% | 30% |
| AA Coding Agent · DeepSWE | Artificial Analysis | 34.3% | 13.33% |
| AA Coding Agent · SWE-Atlas-QnA | Artificial Analysis | 34.3% | 13.33% |
| AA Coding Agent · Terminal-Bench v2 | Artificial Analysis | 34.3% | 13.33% |
| Code Arena WebDev Overall | Arena Code | 57.1% | 10% |
| **合计** |  |  | **100%** |

两项高覆盖专业工程指标合计 50%；三项生产 Coding Agent 工程指标合计 40%，
WebDev 作为普通 benchmark 信号占 10%。Terminal-Bench 的当前覆盖略高，因此获得
30%；WebDev 不再被错误地视为可选择的生产 Harness，但单独一项仍不足以形成
Engineering 分。

AA Coding Agent Index 是 DeepSWE、Terminal-Bench v2 和 SWE-Atlas-QnA 的综合值。
它继续保留在来源卡片中用于核对，但不进入能力分，避免与三个组成项重复计分。

---

# 7. Agentic Work

Agentic Work 评价多轮业务任务中的工具执行，以及生产 Agent 环境中的控制、纠错和
任务完成行为。τ³-Banking 因其多轮 API 调用与任务执行属性从 Engineering 移入本领域。

| 指标 | 来源 | 当前覆盖率 | 领域内权重 |
|---|---|---:|---:|
| τ³-Banking | Artificial Analysis | 88.6% | 40% |
| Confirmed Success | Arena Agent | 65.7% | 21% |
| Steerability | Arena Agent | 65.7% | 12% |
| Praise vs Complaint | Arena Agent | 65.7% | 6% |
| Bash Recovery | Arena Agent | 65.7% | 12% |
| Tool Hallucination | Arena Agent | 65.7% | 9% |
| **合计** |  |  | **100%** |

τ³-Banking 覆盖更高，并直接测试多步工具任务，因此承担 40%。五项 Arena Agent
行为信号合计 60%；其中任务成功为核心，控制与错误恢复次之，工具幻觉和用户反馈
作为可靠性与体验信号。

---

# 8. Search & Knowledge

| 指标 | 来源 | 当前覆盖率 | 领域内权重 |
|---|---|---:|---:|
| AA-Omniscience Accuracy | Artificial Analysis | 97.1% | 35% |
| AA-Omniscience Non-Hallucination | Artificial Analysis | 97.1% | 30% |
| AA-LCR | Artificial Analysis | 97.1% | 25% |
| Search Arena | Arena Search | 2.9% | 10% |
| **合计** |  |  | **100%** |

高覆盖的知识准确性、非幻觉和长上下文检索合计 90%。Search Arena 尽管当前覆盖率低，
但它是领域中唯一直接衡量真实联网搜索的指标，因此保留 10% 而不是完全删除。

Search Arena 仍然受配置匹配边界约束：搜索配置的数据不得向无搜索工具的 Chat 配置反向回填。

---

# 9. 原 Reliability 指标去向

| 原指标 | v2.1 归属 | 权重 |
|---|---|---:|
| AA-Omniscience Non-Hallucination | Search & Knowledge | 30% |
| Bash Recovery | Agentic Work | 12% |
| Tool Hallucination | Agentic Work | 9% |

OpenRouter Uptime 继续只作为基础设施元数据，不进入六个能力领域。

---

# 10. 版本边界

本版本只改变领域与指标权重：

- 不改变单项变换；
- 不改变 Max100 / Median50 归一化；
- 不改变缺失指标处理；
- 不改变覆盖率门槛；
- 不改变六领域总分聚合；
- 不改变速度与成本实用分。

以后如需修改上述算法，应发布新的 Scoring Version；领域分类或权重变化则发布新的 Weighting Version。
