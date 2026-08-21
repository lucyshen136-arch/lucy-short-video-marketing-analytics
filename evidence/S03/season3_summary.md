# Season 3 总结：视频三层分层、完整结构与数据字典

**作者：** 慧珍（Lucy）  
**日期：** 2026-08-21  
**所属单元：** S03 — Label Guide and Pilot Validation（学习与结构冻结阶段）  
**文档性质：** 本次学习记录 + 字段体系与字典成果索引  
**依据文档：** `data/sample/视频三层特征.md`

---

## 1. 本次学到了什么

### 1.1 核心认识：研究一条视频不能只抄页面数字

完整描述一条短视频，需要**三层分开、逐层填写**：

| 层级 | 回答的问题 | 依赖什么 | 谁能填 |
|------|------------|----------|--------|
| **第 1 层：元数据** | 谁、在哪、何时发、公开互动多少 | 对着平台页面核对 | Lucy 抄数 |
| **第 2 层：内容与营销** | 怎么开头、怎么讲、想带到哪一步 | **把片子看完** | 只能 Lucy 标 |
| **第 3 层：个人反应** | Lucy 看完后真实感受与意愿 | **自己诚实回忆** | 只能 Lucy 填 |

**关键原则：** 三层不要混在同一类标签里。

- 「旅行 vlog」→ 第 2 层（内容类型）
- 「播放量 7140」→ 第 1 层（公开表现）
- 「我信不信」→ 第 3 层（个人反应）

这与 Season 1 的平台推荐逻辑形成对照：平台用停留等行为**推断**兴趣标签；本项目用可审计的三层结构，把**公开事实、内容手法、个人反应**分开记录，便于后续与 AI 建议对照（S15）。

### 1.2 填写边界（必须遵守）

1. 第 1 层缺失留空，**不要把缺失写成 0**。
2. 抄公开数字时必须记 **采集时间**（数字会变）。
3. 第 2、3 层不能靠标题、话题标签或 AI 猜测代替「看完再标」。
4. 结论只能说「在这批样本里观察到……」，不能说「这种手法一定能爆」。
5. 五个研究问题要到**三层都有数据**之后，才能做分组对照。

---

## 2. 制定的完整视频结构（CSV 四类字段）

在三层模型基础上，项目 CSV 模板扩展为 **四类前缀**，统一存放在 `data/sample/public_sample.csv`：

| 类别 | 前缀 | 对应层级 | 含义 |
|------|------|----------|------|
| 原始数据 | `meta_` | 第 1 层 | 标题、作者、链接、时长、发布日期、互动数、采集时间等 |
| 内容与营销 | `content_` | 第 2 层 | Hook、内容类型、叙事、价值主张、说服、证据、漏斗、CTA |
| 个人反应 | `viewer_` | 第 3 层 | 是否完看、记忆、信任、行动意愿 |
| AI 打分 | `ai_` | 待 S15 使用 | AI 对第 2 层的建议值，需人工核验 |

另保留 `source_kind` 区分 `synthetic`（合成示例）与 `observed`（真实录入）。

### 2.1 第 1 层 · meta_*（15 列）

| 字段 | 中文 |
|------|------|
| `meta_video_id` | 项目内稳定编号 |
| `meta_platform` | 平台（douyin / xiaohongshu / bilibili） |
| `meta_public_url` | 公开链接 |
| `meta_title` | 标题 |
| `meta_creator_name` | 作者真实公开昵称 |
| `meta_publish_date` | 发布日期 |
| `meta_duration_seconds` | 时长（秒） |
| `meta_collected_at` | 指标采集时间 |
| `meta_view_count` | 播放量 |
| `meta_like_count` | 点赞 |
| `meta_comment_count` | 评论 |
| `meta_save_count` | 收藏 |
| `meta_share_count` | 分享 |
| `meta_follower_count` | 作者粉丝量 |
| `meta_hashtags` | 话题标签 |

### 2.2 第 2 层 · content_*（8 列）

| 字段 | 中文 |
|------|------|
| `content_type` | 内容类型 / 主题 |
| `content_hook_type` | Hook（开头 1–3 秒如何留人） |
| `content_narrative_structure` | 叙事结构（全片骨架） |
| `content_value_proposition` | 价值主张（自由文本，无则 `none_clear`） |
| `content_persuasion` | 说服机制（标一个主机制） |
| `content_evidence_type` | 证据方式（标一个主证据） |
| `content_funnel_stage` | 漏斗阶段（认知 / 考虑 / 转化） |
| `content_cta_type` | CTA（作者叫观众做什么） |

**Hook 与叙事的区别：** Hook 只管开头；叙事结构管整条片子怎么讲完。

**CTA 与行动意愿的区别：** CTA 是作者发出的指令；Lucy 想不想做，在第 3 层单独记。

### 2.3 第 3 层 · viewer_*（4 列）

| 字段 | 中文 |
|------|------|
| `viewer_continued_watching` | 是否完看（三档） |
| `viewer_memory_score` | 记忆（1–5） |
| `viewer_trust_score` | 信任（1–5） |
| `viewer_action_intent_score` | 行动意愿（1–5） |

### 2.4 第 4 层 · ai_*（待启用）

与 `content_*` 字段一一对应，另加 `ai_label_status`（如 candidate / verified / rejected）。  
**AI 输出是候选，不是金标准**——必须在 S15 与 Lucy 人工标注对照。

---

## 3. 制定的数据字典

本次为第 2、3 层建立了固定选项字典，避免「一条写猎奇、一条写好吓人」这类口语漂移。

### 3.1 内容与营销字典

| 文件 | 用途 |
|------|------|
| `data/content_label_dictionary.md` | 人工阅读：定义 + 标注问题 |
| `data/content_label_dictionary.json` | 机器可读：code + label_zh + definition |

**已定义字段（8 个）：**

| 字段 | 类型 | 要点 |
|------|------|------|
| `content_hook_type` | 枚举 4 项 | `question` 提问 · `result_first` 先给结果 · `conflict_contrast` 冲突/反差 · `strong_visual` 展示结果物或强画面 |
| `content_type` | 枚举 11 项 | 含 travel_vlog、food_review、anime_comic_commentary 等 |
| `content_narrative_structure` | 枚举 6 项 | 含 chronological、problem_solution 等 |
| `content_value_proposition` | 自由文本 | 可填 `none_clear` |
| `content_persuasion` | 枚举 6 项 | 权威、示范、社会认同、稀缺、故事共鸣等 |
| `content_evidence_type` | 枚举 5 项 | 前后对比、使用过程、可核对细节、引用来源、口头承诺 |
| `content_funnel_stage` | 枚举 3 项 | awareness 认知 · consideration 考虑 · conversion 转化 |
| `content_cta_type` | 枚举 8 项 | 含 none、follow、comment_keyword、purchase 等 |

CSV 中填 **code**（英文蛇形）；阅读时用 **label_zh**（中文）。

### 3.2 个人反应字典

| 文件 | 用途 |
|------|------|
| `data/viewer_label_dictionary.md` | 人工阅读 |
| `data/viewer_label_dictionary.json` | 机器可读 |

**已定义字段（4 个）：**

| 字段 | 类型 | 要点 |
|------|------|------|
| `viewer_continued_watching` | 枚举 3 档 | `finished` 看完 · `half_left` 看到一半划走 · `left_early` 开头就划走 |
| `viewer_memory_score` | 1–5 | 建议隔天或稍后再评；1 完全想不起来 → 5 印象清晰 |
| `viewer_trust_score` | 1–5 | 1 不可信 → 3 半信半疑 → 5 很可信；**不是点赞数** |
| `viewer_action_intent_score` | 1–5 | 1 无意愿 → 5 马上想做；**不是 CTA** |

### 3.3 与 S02 字段体系的关系

S02 在 `data/data_dictionary.md` 中冻结了**最小必填元数据**（12 项 + 4 项建议采集）。  
S03 在此基础上：

- 用 `meta_` 前缀统一第 1 层命名；
- 新增第 2、3 层完整字段与枚举字典；
- 预留第 4 层 `ai_*` 供后续 AI 可靠性分析。

---

## 4. 实践：首条真实样本 V001

已在 `data/sample/public_sample.csv` 录入第一条真实视频（`source_kind=observed`）：

| 项目 | 内容 |
|------|------|
| 标题 | 谁会拒绝吃饭时看一集蜡笔小新呢？ |
| 平台 / 链接 | 抖音 · https://v.douyin.com/iNg6o6ZmzYY/ |
| 作者 | 蜡笔小新（粉丝约 101.2 万） |
| 发布日期 | 2026-08-19 |
| 内容类型 | `anime_comic_commentary` |
| Hook | `strong_visual` |
| 叙事 | `chronological` |
| 价值主张 | 打发时间 |
| 漏斗 | `awareness` · CTA `none` |
| 个人反应 | 看完 · 记忆 3 · 信任 3 · 行动意愿 1 |

**待补：** `meta_duration_seconds`、`meta_view_count`（页面未明确显示，需在 App 核对）；互动数字需 Lucy 二次确认。

---

## 5. 三层对照示例（V001 · 蜡笔小新）

```text
第 1 层（meta）：抖音 · 蜡笔小新 · 发布 2026-08-19 · 点赞 7140（快照）…
第 2 层（content）：动漫解说 · 强画面 Hook · 按时间叙事 · 价值=打发时间 · 无 CTA
第 3 层（viewer）：看完 · 记忆一般(3) · 半信半疑(3) · 不想行动(1)
```

**有效观察模式：** 娱乐向内容可以「看完 + 低行动意愿」——作者没喊 CTA，Lucy 也不想搜/买，这是合理组合，不是填错。

---

## 6. 文件索引（S03 成果）

| 路径 | 说明 |
|------|------|
| `data/sample/视频三层特征.md` | 三层特征方法论原文 |
| `data/sample/public_sample.csv` | 四类字段 CSV 模板 + 示例 + V001 |
| `data/content_label_dictionary.md` | 第 2 层枚举字典（阅读版） |
| `data/content_label_dictionary.json` | 第 2 层枚举字典（JSON） |
| `data/viewer_label_dictionary.md` | 第 3 层枚举字典（阅读版） |
| `data/viewer_label_dictionary.json` | 第 3 层枚举字典（JSON） |
| `data/data_dictionary.md` | S02 起元的完整字段说明（含扩展层） |
| `evidence/S03/season3_summary.md` | 本文档 |

---

## 7. 与五个研究问题的衔接

| 研究问题 | 主要依赖层级 |
|----------|--------------|
| Q1 哪些主题/Hook/叙事与继续看、记忆相关？ | 第 2 层 + 第 3 层（continued_watching、memory） |
| Q2 哪些价值主张/说服/证据与信任、行动意愿相关？ | 第 2 层 + 第 3 层（trust、action_intent） |
| Q3 平台/类型/漏斗阶段有何差异？ | 第 1 层 platform + 第 2 层 content_type / funnel |
| Q4 人工标签与 AI 建议何处一致/出错？ | 第 2 层 vs 第 4 层 ai_*（S15） |
| Q5 下一步应检验哪些假设？ | 三层齐备后的分组对照（S11–S14） |

---

## 8. 下一步（S03 之后）

1. 继续按同一结构录入 pilot / Gold 视频（先 meta，再 content，再 viewer）。
2. 每条视频：`meta_collected_at` 与互动数同期采集；缺失留空并记原因。
3. 记忆分建议**隔一段时间**再评，不要刚看完立刻打。
4. 将字典接入 `config/label_taxonomy.json` 与校验代码（S03 正式单元任务）。
5. 三层数据齐后再做分组分析与 SQL 提问；此前不做因果或「一定能爆」类结论。

---

## 9. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-08-21 | 初稿：三层分层、四类 CSV 结构、content/viewer 字典、V001 实践 |
