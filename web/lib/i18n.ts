export type Locale = "zh" | "en";

export type Messages = {
  siteName: string;
  siteDescription: string;
  nav: { videos: string; dictionaries: string; analysis: string };
  localeName: { zh: string; en: string };
  layers: { meta: string; content: string; viewer: string; ai: string };
  complete: string;
  missing: (n: number) => string;
  noMissing: string;
  platforms: Record<string, string>;
  dbHint: string;
  videos: {
    title: string;
    add: string;
    apiError: string;
    titleCol: string;
    platform: string;
    creator: string;
    published: string;
    contentType: string;
    trust: string;
    detail: string;
    empty: string;
    total: (n: number) => string;
  };
  detail: {
    edit: string;
    openLink: string;
    governance: string;
    selectionReason: string;
    layer1: string;
    layer2: string;
    layer3: string;
    layer4: string;
    creator: string;
    publishDate: string;
    duration: string;
    collectedAt: string;
    views: string;
    likes: string;
    comments: string;
    saves: string;
    shares: string;
    followers: string;
    hashtags: string;
    contentType: string;
    hook: string;
    narrative: string;
    value: string;
    persuasion: string;
    evidence: string;
    funnel: string;
    cta: string;
    watching: string;
    memory: string;
    trust: string;
    action: string;
  };
  analysis: {
    title: string;
    intro: string;
    dbError: string;
    videoCount: string;
    fullyComplete: (done: number, total: number) => string;
    quality: string;
    layer: string;
    fieldsEach: string;
    completeVideos: string;
    missingFields: string;
    qualityNote: string;
    completeCaption: (done: number, total: number) => string;
    formulas: string;
    metric: string;
    formula: string;
    nullRule: string;
    formulaRows: { name: string; expression: string; rule: string }[];
    derived: string;
    ageDays: string;
    likeRate: string;
    commentRate: string;
    saveRate: string;
    shareRate: string;
    engagementRate: string;
    noVideos: string;
    platformRates: string;
    noRates: string;
    likeRateOf: (id: string) => string;
    engagementRateOf: (id: string) => string;
    rateNote: string;
    contentDistribution: string;
    noChartValues: string;
    contrast: string;
    watching: string;
    memory: string;
    trust: string;
    action: string;
    contrastNote: string;
    spearman: string;
    pair: string;
    pairN: string;
    note: string;
    insufficient: (n: number) => string;
    undefinedCoeff: string;
    descriptive: string;
    agreementTitle: string;
    agreementOverall: (rate: string, n: number) => string;
    field: string;
    compared: string;
    matched: string;
    agreementRate: string;
    fields: Record<string, string>;
    pairs: Record<string, { name: string; x: string; y: string }>;
  };
  form: {
    addTitle: string;
    editTitle: (id: string) => string;
    governance: string;
    selectionReason: string;
    layer1: string;
    layer2: string;
    layer3: string;
    layer4: string;
    platform: string;
    title: string;
    url: string;
    creator: string;
    publishDate: string;
    duration: string;
    collectedAt: string;
    views: string;
    likes: string;
    comments: string;
    saves: string;
    shares: string;
    followers: string;
    hashtags: string;
    contentType: string;
    hook: string;
    narrative: string;
    value: string;
    persuasion: string;
    evidence: string;
    funnel: string;
    cta: string;
    watching: string;
    memory: string;
    trust: string;
    action: string;
    blank: string;
    save: string;
    saving: string;
    saveFailed: string;
    delete: string;
    deleteFailed: string;
    confirmDelete: (id: string) => string;
    loading: string;
  };
  dictionaries: {
    title: string;
    intro: string;
    import: string;
    working: string;
    importFailed: string;
    createTitle: string;
    slug: string;
    name: string;
    namePlaceholder: string;
    description: string;
    version: string;
    create: string;
    createFailed: string;
    configure: string;
    noDescription: string;
    counts: (fields: number, items: number) => string;
    deleteSet: string;
    confirmDeleteSet: (name: string) => string;
    deleteFailed: string;
    empty: string;
    loading: string;
    back: string;
    deleteThisSet: string;
    setInfo: string;
    sourceDoc: string;
    scope: string;
    saveSet: string;
    saveFailed: string;
    addField: string;
    fieldKey: string;
    chineseName: string;
    kind: string;
    question: string;
    addFieldButton: string;
    addFieldFailed: string;
    kinds: Record<string, string>;
    deleteField: string;
    confirmDeleteField: (key: string) => string;
    deleteFieldFailed: string;
    updateFieldFailed: string;
    saveField: string;
    chineseLabel: string;
    definition: string;
    sort: string;
    edit: string;
    deleteItem: string;
    confirmDeleteItem: (code: string) => string;
    deleteItemFailed: string;
    noItems: string;
    codeAndLabelRequired: string;
    saveItemFailed: string;
    saveEdit: string;
    addItem: string;
    cancelEdit: string;
    confirmDeleteWhole: (name: string) => string;
  };
};

const formulaRuleRates = {
  zh: "分子缺失，或播放量缺失、为 0，则为空。缺失不加进分子。",
  en: "Null when the numerator is missing, or views are missing or zero. Missing counts are not added in.",
};

function formulas(locale: Locale): Messages["analysis"]["formulaRows"] {
  const zh = locale === "zh";
  const rate = zh ? formulaRuleRates.zh : formulaRuleRates.en;
  return [
    {
      name: zh ? "采集间隔（天）" : "Days from publish to collection",
      expression: zh ? "采集日期 − 发布日期" : "collection date − publish date",
      rule: zh ? "任一日期缺失则为空" : "Null if either date is missing",
    },
    { name: zh ? "点赞率" : "Like rate", expression: zh ? "点赞 / 播放" : "likes / views", rule: rate },
    { name: zh ? "评论率" : "Comment rate", expression: zh ? "评论 / 播放" : "comments / views", rule: rate },
    { name: zh ? "收藏率" : "Save rate", expression: zh ? "收藏 / 播放" : "saves / views", rule: rate },
    { name: zh ? "分享率" : "Share rate", expression: zh ? "分享 / 播放" : "shares / views", rule: rate },
    {
      name: zh ? "互动率" : "Engagement rate",
      expression: zh ? "(点赞 + 评论 + 收藏 + 分享) / 播放" : "(likes + comments + saves + shares) / views",
      rule: rate,
    },
    {
      name: "Spearman ρ",
      expression: zh
        ? "两边换成名次后，ρ = Σ(rx − rx̄)(ry − rȳ) / √[Σ(rx − rx̄)² Σ(ry − rȳ)²]"
        : "After ranking both sides, ρ = Σ(rx − rx̄)(ry − rȳ) / √[Σ(rx − rx̄)² Σ(ry − rȳ)²]",
      rule: zh
        ? "只在同一平台内、成对删除缺失后计算。有效配对少于 3 不报告系数。"
        : "Computed within one platform after pairwise deletion. No coefficient when fewer than 3 pairs remain.",
    },
    {
      name: zh ? "人机一致率" : "Human–AI agreement",
      expression: zh
        ? "人工 code 与 AI code 相同的配对数 / 两边都已填写的配对数"
        : "pairs with the same human and AI code / pairs where both are filled",
      rule: zh ? "AI 不是金标准，只和人工内容标签对照。" : "AI is not the gold label. This only compares it with the human content label.",
    },
  ];
}

const zh: Messages = {
  siteName: "短视频营销分析平台",
  siteDescription: "短视频采集、标注与分析",
  nav: { videos: "视频列表", dictionaries: "数据字典", analysis: "数据分析" },
  localeName: { zh: "中文", en: "EN" },
  layers: { meta: "元数据", content: "内容", viewer: "反应", ai: "AI" },
  complete: "完整",
  missing: (n) => `缺失（${n}）`,
  noMissing: "无缺失",
  platforms: { douyin: "抖音", xiaohongshu: "小红书", bilibili: "Bilibili" },
  dbHint: "请确认已配置 DATABASE_URL（Vercel 环境变量或 web/.env.local），见 docs/web_local_dev.md。",
  videos: {
    title: "视频列表",
    add: "添加视频",
    apiError: "无法连接 API",
    titleCol: "标题",
    platform: "平台",
    creator: "作者",
    published: "发布",
    contentType: "内容类型",
    trust: "信任",
    detail: "详情",
    empty: "暂无视频。添加第一条或运行 seed 脚本。",
    total: (n) => `共 ${n} 条`,
  },
  detail: {
    edit: "编辑",
    openLink: "打开链接",
    governance: "治理",
    selectionReason: "入选理由",
    layer1: "第 1 层 · 元数据",
    layer2: "第 2 层 · 内容",
    layer3: "第 3 层 · 个人反应",
    layer4: "第 4 层 · AI 标注",
    creator: "作者",
    publishDate: "发布日期",
    duration: "时长（秒）",
    collectedAt: "采集时间",
    views: "播放量",
    likes: "点赞",
    comments: "评论",
    saves: "收藏",
    shares: "分享",
    followers: "粉丝",
    hashtags: "话题",
    contentType: "内容类型",
    hook: "Hook",
    narrative: "叙事",
    value: "价值主张",
    persuasion: "说服",
    evidence: "证据",
    funnel: "漏斗",
    cta: "CTA",
    watching: "完看",
    memory: "记忆",
    trust: "信任",
    action: "行动意愿",
  },
  analysis: {
    title: "数据分析",
    intro: "按数据字典计算衍生指标和同平台关联。关联不是因果。跨平台播放量不放在一起比较。",
    dbError: "无法连接数据库",
    videoCount: "视频数量",
    fullyComplete: (done, total) => `四层都完整的视频 ${done} / ${total}`,
    quality: "采集质量",
    layer: "层级",
    fieldsEach: "每条字段数",
    completeVideos: "完整视频",
    missingFields: "缺失字段",
    qualityNote: "空值计为缺失。数值 0 视为已采集。",
    completeCaption: (done, total) => `${done} / ${total} 完整`,
    formulas: "关联公式",
    metric: "指标",
    formula: "公式",
    nullRule: "空值规则",
    formulaRows: formulas("zh"),
    derived: "衍生指标",
    ageDays: "采集间隔（天）",
    likeRate: "点赞率",
    commentRate: "评论率",
    saveRate: "收藏率",
    shareRate: "分享率",
    engagementRate: "互动率",
    noVideos: "暂无视频。",
    platformRates: "同平台比率",
    noRates: "还没有可绘制的比率。",
    likeRateOf: (id) => `${id} 点赞率`,
    engagementRateOf: (id) => `${id} 互动率`,
    rateNote: "播放量缺失或为 0 的视频不进入图。不同平台的条形不共用刻度比较。",
    contentDistribution: "内容类型分布",
    noChartValues: "还没有可绘制的数值。",
    contrast: "内容与个人反应对照",
    watching: "完看",
    memory: "记忆",
    trust: "信任",
    action: "行动意愿",
    contrastNote: "这是逐条对照，不是分组推断。个人反应只代表填写者一人。",
    spearman: "同平台 Spearman 关联",
    pair: "配对",
    pairN: "有效 n",
    note: "说明",
    insufficient: (n) => `样本不足（少于 ${n} 对）`,
    undefinedCoeff: "名次没有变化，系数无定义",
    descriptive: "同平台描述性关联",
    agreementTitle: "人工标签与 AI 标签一致率",
    agreementOverall: (rate, n) => `总体一致率 ${rate}（已对照 ${n} 个字段）`,
    field: "字段",
    compared: "已对照",
    matched: "相同",
    agreementRate: "一致率",
    fields: {
      content_type: "内容类型",
      content_hook_type: "Hook",
      content_narrative_structure: "叙事结构",
      content_value_proposition: "价值主张",
      content_persuasion: "说服机制",
      content_evidence_type: "证据方式",
      content_funnel_stage: "漏斗阶段",
      content_cta_type: "CTA",
    },
    pairs: {
      trust_like: { name: "信任 × 点赞率", x: "信任 1–5", y: "点赞率" },
      memory_like: { name: "记忆 × 点赞率", x: "记忆 1–5", y: "点赞率" },
      action_engagement: { name: "行动意愿 × 互动率", x: "行动意愿 1–5", y: "互动率" },
      trust_engagement: { name: "信任 × 互动率", x: "信任 1–5", y: "互动率" },
    },
  },
  form: {
    addTitle: "添加视频",
    editTitle: (id) => `编辑 · ${id}`,
    governance: "治理 · 入选理由",
    selectionReason: "selection_reason（分析前入选理由）",
    layer1: "第 1 层 · 元数据 (meta)",
    layer2: "第 2 层 · 内容与营销 (content)",
    layer3: "第 3 层 · 个人反应 (viewer)",
    layer4: "第 4 层 · AI 标注 (ai)",
    platform: "平台",
    title: "标题",
    url: "公开链接",
    creator: "作者昵称",
    publishDate: "发布日期",
    duration: "时长（秒）",
    collectedAt: "采集时间 (ISO)",
    views: "播放量",
    likes: "点赞",
    comments: "评论",
    saves: "收藏",
    shares: "分享",
    followers: "粉丝量",
    hashtags: "话题标签",
    contentType: "内容类型",
    hook: "Hook",
    narrative: "叙事结构",
    value: "价值主张",
    persuasion: "说服机制",
    evidence: "证据方式",
    funnel: "漏斗阶段",
    cta: "CTA",
    watching: "完看情况",
    memory: "记忆 1-5",
    trust: "信任 1-5",
    action: "行动意愿 1-5",
    blank: "— 留空 —",
    save: "保存",
    saving: "保存中…",
    saveFailed: "保存失败",
    delete: "删除",
    deleteFailed: "删除失败",
    confirmDelete: (id) => `确认删除 ${id}？`,
    loading: "加载中…",
  },
  dictionaries: {
    title: "数据字典",
    intro: "可配置多套字典。每套按字段分组管理字典项；导入会把项目里的 content / viewer JSON 写入数据库，已存在的套按 slug 更新。",
    import: "从项目 JSON 导入",
    working: "处理中…",
    importFailed: "导入失败",
    createTitle: "新建字典套",
    slug: "slug（英文标识）",
    name: "名称",
    namePlaceholder: "内容与营销",
    description: "说明",
    version: "版本",
    create: "创建并进入配置",
    createFailed: "创建失败",
    configure: "配置",
    noDescription: "暂无说明",
    counts: (fields, items) => `${fields} 个字段 · ${items} 个字典项`,
    deleteSet: "删除此套",
    confirmDeleteSet: (name) => `确认删除字典套「${name}」及其全部字段和字典项？`,
    deleteFailed: "删除失败",
    empty: "还没有字典套。先导入项目 JSON，或新建一套空字典。",
    loading: "加载中…",
    back: "← 全部字典套",
    deleteThisSet: "删除此套",
    setInfo: "套信息",
    sourceDoc: "来源文档",
    scope: "作用范围",
    saveSet: "保存套信息",
    saveFailed: "保存失败",
    addField: "添加字段",
    fieldKey: "字段 key",
    chineseName: "中文名",
    kind: "类型",
    question: "标注问题",
    addFieldButton: "添加字段",
    addFieldFailed: "添加字段失败",
    kinds: { enum: "枚举", free_text: "自由文本（含哨兵值）", ordinal_score: "序数量表" },
    deleteField: "删除字段",
    confirmDeleteField: (key) => `确认删除字段 ${key} 及其全部字典项？`,
    deleteFieldFailed: "删除字段失败",
    updateFieldFailed: "更新字段失败",
    saveField: "保存字段",
    chineseLabel: "中文标签",
    definition: "定义",
    sort: "排序",
    edit: "修改",
    deleteItem: "删除",
    confirmDeleteItem: (code) => `确认删除字典项 ${code}？`,
    deleteItemFailed: "删除字典项失败",
    noItems: "该字段还没有字典项。",
    codeAndLabelRequired: "字典项的 code 和中文标签不能为空",
    saveItemFailed: "保存字典项失败",
    saveEdit: "保存修改",
    addItem: "添加字典项",
    cancelEdit: "取消修改",
    confirmDeleteWhole: (name) => `确认删除整套字典「${name}」？`,
  },
};

const en: Messages = {
  siteName: "Short-video marketing analytics",
  siteDescription: "Collect, label, and analyze short videos",
  nav: { videos: "Videos", dictionaries: "Dictionaries", analysis: "Analysis" },
  localeName: { zh: "中文", en: "EN" },
  layers: { meta: "Metadata", content: "Content", viewer: "Reaction", ai: "AI" },
  complete: "Complete",
  missing: (n) => `Missing (${n})`,
  noMissing: "None missing",
  platforms: { douyin: "Douyin", xiaohongshu: "Xiaohongshu", bilibili: "Bilibili" },
  dbHint: "Set DATABASE_URL in Vercel or web/.env.local. See docs/web_local_dev.md.",
  videos: {
    title: "Videos",
    add: "Add video",
    apiError: "Could not reach the API",
    titleCol: "Title",
    platform: "Platform",
    creator: "Creator",
    published: "Published",
    contentType: "Content type",
    trust: "Trust",
    detail: "Details",
    empty: "No videos yet. Add the first one or run the seed script.",
    total: (n) => `${n} total`,
  },
  detail: {
    edit: "Edit",
    openLink: "Open link",
    governance: "Governance",
    selectionReason: "Selection reason",
    layer1: "Layer 1 · Metadata",
    layer2: "Layer 2 · Content",
    layer3: "Layer 3 · Viewer reaction",
    layer4: "Layer 4 · AI labels",
    creator: "Creator",
    publishDate: "Publish date",
    duration: "Duration (seconds)",
    collectedAt: "Collected at",
    views: "Views",
    likes: "Likes",
    comments: "Comments",
    saves: "Saves",
    shares: "Shares",
    followers: "Followers",
    hashtags: "Hashtags",
    contentType: "Content type",
    hook: "Hook",
    narrative: "Narrative",
    value: "Value proposition",
    persuasion: "Persuasion",
    evidence: "Evidence",
    funnel: "Funnel",
    cta: "CTA",
    watching: "Watching",
    memory: "Memory",
    trust: "Trust",
    action: "Action intent",
  },
  analysis: {
    title: "Analysis",
    intro: "Derived metrics and within-platform associations follow the data dictionary. Association is not causation. Do not compare view counts across platforms.",
    dbError: "Could not connect to the database",
    videoCount: "Videos",
    fullyComplete: (done, total) => `Videos complete on all four layers: ${done} / ${total}`,
    quality: "Collection quality",
    layer: "Layer",
    fieldsEach: "Fields per video",
    completeVideos: "Complete videos",
    missingFields: "Missing fields",
    qualityNote: "Empty values count as missing. A numeric 0 counts as collected.",
    completeCaption: (done, total) => `${done} / ${total} complete`,
    formulas: "Formulas",
    metric: "Metric",
    formula: "Formula",
    nullRule: "Null rule",
    formulaRows: formulas("en"),
    derived: "Derived metrics",
    ageDays: "Days since publish",
    likeRate: "Like rate",
    commentRate: "Comment rate",
    saveRate: "Save rate",
    shareRate: "Share rate",
    engagementRate: "Engagement rate",
    noVideos: "No videos yet.",
    platformRates: "Rates within platform",
    noRates: "No rates to chart yet.",
    likeRateOf: (id) => `${id} like rate`,
    engagementRateOf: (id) => `${id} engagement rate`,
    rateNote: "Videos with missing or zero views are omitted. Bars from different platforms do not share a scale.",
    contentDistribution: "Content types",
    noChartValues: "Nothing to chart yet.",
    contrast: "Content and viewer reaction",
    watching: "Watching",
    memory: "Memory",
    trust: "Trust",
    action: "Action intent",
    contrastNote: "Row-by-row comparison, not a group inference. Viewer scores are one person.",
    spearman: "Within-platform Spearman associations",
    pair: "Pair",
    pairN: "Pairs (n)",
    note: "Note",
    insufficient: (n) => `Not enough pairs (fewer than ${n})`,
    undefinedCoeff: "Ranks do not vary, so the coefficient is undefined",
    descriptive: "Descriptive association within one platform",
    agreementTitle: "Human vs AI label agreement",
    agreementOverall: (rate, n) => `Overall agreement ${rate} (${n} fields compared)`,
    field: "Field",
    compared: "Compared",
    matched: "Same",
    agreementRate: "Agreement",
    fields: {
      content_type: "Content type",
      content_hook_type: "Hook",
      content_narrative_structure: "Narrative",
      content_value_proposition: "Value proposition",
      content_persuasion: "Persuasion",
      content_evidence_type: "Evidence",
      content_funnel_stage: "Funnel stage",
      content_cta_type: "CTA",
    },
    pairs: {
      trust_like: { name: "Trust × like rate", x: "Trust 1–5", y: "Like rate" },
      memory_like: { name: "Memory × like rate", x: "Memory 1–5", y: "Like rate" },
      action_engagement: { name: "Action intent × engagement rate", x: "Action intent 1–5", y: "Engagement rate" },
      trust_engagement: { name: "Trust × engagement rate", x: "Trust 1–5", y: "Engagement rate" },
    },
  },
  form: {
    addTitle: "Add video",
    editTitle: (id) => `Edit · ${id}`,
    governance: "Governance · selection reason",
    selectionReason: "selection_reason (why it was chosen, before analysis)",
    layer1: "Layer 1 · Metadata",
    layer2: "Layer 2 · Content and marketing",
    layer3: "Layer 3 · Viewer reaction",
    layer4: "Layer 4 · AI labels",
    platform: "Platform",
    title: "Title",
    url: "Public URL",
    creator: "Creator name",
    publishDate: "Publish date",
    duration: "Duration (seconds)",
    collectedAt: "Collected at (ISO)",
    views: "Views",
    likes: "Likes",
    comments: "Comments",
    saves: "Saves",
    shares: "Shares",
    followers: "Followers",
    hashtags: "Hashtags",
    contentType: "Content type",
    hook: "Hook",
    narrative: "Narrative",
    value: "Value proposition",
    persuasion: "Persuasion",
    evidence: "Evidence",
    funnel: "Funnel stage",
    cta: "CTA",
    watching: "How far you watched",
    memory: "Memory 1–5",
    trust: "Trust 1–5",
    action: "Action intent 1–5",
    blank: "— leave empty —",
    save: "Save",
    saving: "Saving…",
    saveFailed: "Could not save",
    delete: "Delete",
    deleteFailed: "Could not delete",
    confirmDelete: (id) => `Delete ${id}?`,
    loading: "Loading…",
  },
  dictionaries: {
    title: "Dictionaries",
    intro: "Keep several dictionary sets. Each set groups items by field. Import writes the project content and viewer JSON into the database and updates an existing set by slug.",
    import: "Import project JSON",
    working: "Working…",
    importFailed: "Import failed",
    createTitle: "New dictionary set",
    slug: "slug (identifier)",
    name: "Name",
    namePlaceholder: "Content and marketing",
    description: "Description",
    version: "Version",
    create: "Create and open",
    createFailed: "Could not create",
    configure: "Edit",
    noDescription: "No description",
    counts: (fields, items) => `${fields} fields · ${items} items`,
    deleteSet: "Delete set",
    confirmDeleteSet: (name) => `Delete dictionary set “${name}” and all of its fields and items?`,
    deleteFailed: "Could not delete",
    empty: "No dictionary sets yet. Import the project JSON, or create an empty set.",
    loading: "Loading…",
    back: "← All dictionary sets",
    deleteThisSet: "Delete this set",
    setInfo: "Set details",
    sourceDoc: "Source document",
    scope: "Scope",
    saveSet: "Save set",
    saveFailed: "Could not save",
    addField: "Add field",
    fieldKey: "Field key",
    chineseName: "Chinese name",
    kind: "Type",
    question: "Labeling question",
    addFieldButton: "Add field",
    addFieldFailed: "Could not add the field",
    kinds: { enum: "Enum", free_text: "Free text (with sentinels)", ordinal_score: "Ordinal score" },
    deleteField: "Delete field",
    confirmDeleteField: (key) => `Delete field ${key} and all of its items?`,
    deleteFieldFailed: "Could not delete the field",
    updateFieldFailed: "Could not update the field",
    saveField: "Save field",
    chineseLabel: "Chinese label",
    definition: "Definition",
    sort: "Sort",
    edit: "Edit",
    deleteItem: "Delete",
    confirmDeleteItem: (code) => `Delete item ${code}?`,
    deleteItemFailed: "Could not delete the item",
    noItems: "This field has no items yet.",
    codeAndLabelRequired: "An item needs both a code and a Chinese label",
    saveItemFailed: "Could not save the item",
    saveEdit: "Save changes",
    addItem: "Add item",
    cancelEdit: "Cancel",
    confirmDeleteWhole: (name) => `Delete the whole dictionary “${name}”?`,
  },
};

export const messages: Record<Locale, Messages> = { zh, en };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "zh" || value === "en";
}
