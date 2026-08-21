# 内容与营销字段枚举字典

**版本：** 1.0.0  
**日期：** 2026-08-21  
**依据：** `data/sample/视频三层特征.md`  
**适用范围：** `content_*` 字段（第 2 层：内容与营销）  
**机器可读副本：** `data/content_label_dictionary.json`

## 使用规则

1. 每个枚举字段**只标一个主值**，不要一条视频堆很多同义标签。
2. 必须**完整看完至少一遍**后再标注；不能根据标题、话题标签或 AI 猜测代替。
3. CSV / 表里填 **code**（英文蛇形命名）；阅读和对照时用 **label_zh**。
4. `content_value_proposition` 是自由文本；没有清晰承诺时填 `none_clear`。
5. 第 2 层标签不是观众感受——「信不信」「想不想做」属于第 3 层 `viewer_*`。

---

## content_hook_type · Hook（钩子）

**标注问题：** 开头约 1–3 秒靠什么把我留住？

| code | label_zh | 定义 |
|------|----------|------|
| `question` | 提问 | 开头用问题勾起好奇，例如「你知道为什么……吗？」 |
| `result_first` | 先给结果 | 开头先展示结论、成品、结局或最吸引人的结果，再展开过程 |
| `conflict_contrast` | 冲突 / 反差 | 开头制造对立、意外、争议或预期与现实的落差 |
| `strong_visual` | 展示结果物或强画面 | 开头用强视觉、成品特写、震撼画面或高识别度场景抓注意力 |

---

## content_type · 内容类型 / 主题

**标注问题：** 这条片子大体是什么品类？

| code | label_zh | 定义 |
|------|----------|------|
| `travel_vlog` | 旅行 vlog | 以出行、目的地体验、路途见闻为主的记录或分享 |
| `food_review` | 美食测评 | 以餐厅、菜品、零食或饮品体验与评价为主 |
| `beauty_review` | 美妆护肤评测 | 以化妆、护肤、个护产品试用或效果展示为主 |
| `knowledge_explainer` | 知识科普 | 以解释概念、原理、方法为主 |
| `film_tv_commentary` | 影视解说 | 以电影、剧集、综艺等影像内容的讲解或评论为主 |
| `anime_comic_commentary` | 动漫解说 | 以动画、漫画及相关 IP 的讲解、盘点或深度解析为主 |
| `lifestyle_review` | 生活方式体验 | 舱位、酒店、日常消费、服务体验等生活方式内容 |
| `product_review` | 产品测评 | 以具体商品的功能、性能、性价比评价为主 |
| `entertainment_clip` | 娱乐剪辑 | 以综艺、名场面、搞笑或冲突片段剪辑传播为主 |
| `brand_promo` | 品牌种草 / 商业推广 | 以明确的品牌、产品或合作推广为主要目的 |
| `other` | 其他 | 以上都不合适时使用，并在备注中说明 |

---

## content_narrative_structure · 叙事结构

**标注问题：** 整条片子按什么骨架讲完？（Hook 只管开头，叙事管全片）

| code | label_zh | 定义 |
|------|----------|------|
| `result_then_process` | 先结果后过程 | 先告诉结果或结论，再补充如何做到 |
| `chronological` | 按时间顺序 | 按发生顺序或 vlog 时间线推进 |
| `before_after` | 对比（用前 / 用后） | 通过前后状态对照组织内容 |
| `problem_solution` | 问题解决 | 痛点 → 方法 → 效果 |
| `listicle` | 清单罗列 | 以多个技巧、理由或要点逐条展开 |
| `other` | 其他 | 以上都不合适时使用，并在备注中说明 |

---

## content_value_proposition · 价值主张

**字段类型：** 自由文本（不是枚举）

**标注问题：** 片子主要承诺给观众什么好处？

| 填写方式 | 说明 |
|----------|------|
| 一句人话 | 例如「学生党也能快速做对题」「不用出国也能看懂这家店」 |
| `none_clear` | 无明确主张；内容以展示/娱乐为主，不要硬编 |

---

## content_persuasion · 说服机制

**标注问题：** 主要靠什么让我接受片中的说法？（标一个主机制）

| code | label_zh | 定义 |
|------|----------|------|
| `authority` | 权威 | 专家身份、机构背书、数据或专业判断 |
| `demonstration` | 示范 | 作者亲自演示、试用、操作 |
| `social_proof` | 社会认同 | 强调很多人用、很多好评、热门或跟风 |
| `scarcity_urgency` | 稀缺或截止 | 限时、限量、错过不再有 |
| `story_resonance` | 故事共鸣 | 个人经历、情绪故事或身份认同 |
| `none_clear` | 无明显说服机制 | 以信息展示或娱乐为主 |

---

## content_evidence_type · 证据方式

**标注问题：** 说法主要用什么材料支撑？（标一个主证据类型）

| code | label_zh | 定义 |
|------|----------|------|
| `before_after` | 前后对比 | 使用前/使用后画面对比 |
| `usage_process` | 使用过程 | 展示完整或关键的使用、体验、操作过程 |
| `verifiable_detail` | 可核对细节 | 价格、位置、实物特写、现场环境等可核对信息 |
| `data_or_source` | 引用数据或来源 | 统计数字、研究报告、官方信息或可追溯来源 |
| `verbal_only` | 只有口头承诺 | 主要靠口播或字幕断言，缺乏过程或细节展示 |

---

## content_funnel_stage · 漏斗阶段

**标注问题：** 作者最希望观众看完后停在哪一步？（标一个主阶段）

| code | label_zh | 定义 |
|------|----------|------|
| `awareness` | 认知 | 让你知道有这么回事、看见一种生活方式或产品 |
| `consideration` | 考虑 | 帮你比较、理解优缺点、打消疑虑 |
| `conversion` | 转化 | 明确推动马上做一件事（下单、私信、点链接等） |

**参考：** 风景展示多半是认知；评测多半是考虑；「赶紧下单/点链接」多半是转化。

---

## content_cta_type · CTA（行动号召）

**标注问题：** 片里有没有明确叫观众做一件事？叫的是哪一件？

| code | label_zh | 定义 |
|------|----------|------|
| `none` | 无 CTA | 没有口头或字幕指令 |
| `follow` | 关注 | 明确让观众关注账号 |
| `like` | 点赞 | 明确让观众点赞或双击 |
| `comment_keyword` | 评论区扣字 | 让观众回复特定词语或数字，例如「扣 1」 |
| `profile_link` | 去主页 / 点链接 | 引导进入主页、橱窗、购物车或外部链接 |
| `search_keyword` | 搜索关键词 | 让观众搜索指定关键词 |
| `share` | 分享 | 明确让观众转发或分享 |
| `purchase` | 购买 / 下单 | 明确推动购买、领券、下单或到店 |

**边界：** CTA 是作者发出的指令；Lucy 想不想照做，属于第 3 层 `viewer_action_intent_score`。

---

## 与模板字段对照

| CSV 字段 | 字典章节 | 类型 |
|----------|----------|------|
| `content_type` | content_type | 枚举 |
| `content_hook_type` | content_hook_type | 枚举 |
| `content_narrative_structure` | content_narrative_structure | 枚举 |
| `content_value_proposition` | content_value_proposition | 自由文本 |
| `content_persuasion` | content_persuasion | 枚举 |
| `content_evidence_type` | content_evidence_type | 枚举 |
| `content_funnel_stage` | content_funnel_stage | 枚举 |
| `content_cta_type` | content_cta_type | 枚举 |

`ai_*` 字段建议使用与本字典相同的 code 集合，便于后续与人工标注对照（S15）。
