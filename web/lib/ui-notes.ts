const NOTES: Record<string, [string, string]> = {
  bad_url: ["地址需要是完整的 http 或 https 链接", "The address must be a full http or https URL."],
  public_only: ["只采集 http 或 https 公开页面", "Only public http or https pages are collected."],
  localhost: ["不采集本机地址", "Local addresses are not collected."],
  private: ["不采集内网地址", "Private network addresses are not collected."],
  redirect: ["页面跳转缺少地址", "The redirect is missing a location."],
  redirects: ["页面跳转次数过多", "Too many redirects."],
  collect_failed: ["采集失败", "Collection failed."],
  empty: ["这个页面没有露出可解析的公开视频信息。", "This page did not expose parseable public video information."],
};

const API: Record<string, [string, string]> = {
  name_url_required: ["名称和视频网站地址都不能为空", "Name and site URL are both required."],
  job_missing: ["采集配置不存在", "Collection setup not found."],
  item_missing: ["采集记录不存在", "Collection row not found."],
  https_url: ["接口需要是完整的 https 地址", "The endpoint must be a full https URL."],
  https_only: ["接口只接受 https", "The endpoint must use https."],
  key_required: ["名称、模型和 API Key 都不能为空", "Name, model, and API key are all required."],
  name_required: ["名称不能为空", "Name is required."],
  model_required: ["模型不能为空", "Model is required."],
  key_missing: ["Key 不存在", "Key not found."],
  bad_kind: ["字段类型无效", "That field kind is not valid."],
  layer_name_required: ["层名称不能为空", "Layer name is required."],
  layer_missing: ["层不存在", "Layer not found."],
  bad_field_key: ["字段 key 只能用小写字母、数字和下划线", "A field key can only use lowercase letters, numbers, and underscores."],
  field_name_required: ["字段名称不能为空", "Field name is required."],
  field_exists: ["这一层已经有同名字段", "This layer already has that field."],
  field_missing: ["字段不存在", "Field not found."],
  "名称和视频网站地址都不能为空": ["名称和视频网站地址都不能为空", "Name and site URL are both required."],
  "采集配置不存在": ["采集配置不存在", "Collection setup not found."],
  "采集记录不存在": ["采集记录不存在", "Collection row not found."],
  "接口需要是完整的 https 地址": ["接口需要是完整的 https 地址", "The endpoint must be a full https URL."],
  "接口只接受 https": ["接口只接受 https", "The endpoint must use https."],
  "名称、模型和 API Key 都不能为空": ["名称、模型和 API Key 都不能为空", "Name, model, and API key are all required."],
  "名称不能为空": ["名称不能为空", "Name is required."],
  "模型不能为空": ["模型不能为空", "Model is required."],
  "Key 不存在": ["Key 不存在", "Key not found."],
  "字段类型无效": ["字段类型无效", "That field kind is not valid."],
  "层名称不能为空": ["层名称不能为空", "Layer name is required."],
  "层不存在": ["层不存在", "Layer not found."],
  "字段 key 只能用小写字母、数字和下划线": ["字段 key 只能用小写字母、数字和下划线", "A field key can only use lowercase letters, numbers, and underscores."],
  "字段名称不能为空": ["字段名称不能为空", "Field name is required."],
  "这一层已经有同名字段": ["这一层已经有同名字段", "This layer already has that field."],
  "字段不存在": ["字段不存在", "Field not found."],
};

const LEGACY: Record<string, string> = {
  "地址需要是完整的 http 或 https 链接": "The address must be a full http or https URL.",
  "只采集 http 或 https 公开页面": "Only public http or https pages are collected.",
  "不采集本机地址": "Local addresses are not collected.",
  "不采集内网地址": "Private network addresses are not collected.",
  "页面跳转缺少地址": "The redirect is missing a location.",
  "页面跳转次数过多": "Too many redirects.",
  "这个页面没有露出可解析的公开视频信息。": "This page did not expose parseable public video information.",
};

const SKIP: Record<string, [string, string]> = {
  not_found: ["记录不存在", "Record not found"],
  already_imported: ["已经在视频列表里", "Already in the video list"],
  missing_title: ["缺少标题或链接", "Missing a title or link"],
  platform: ["请先把平台改成抖音、小红书或 Bilibili", "Set the platform to Douyin, Xiaohongshu, or Bilibili first"],
  import_failed: ["导入失败", "Import failed"],
  "记录不存在": ["记录不存在", "Record not found"],
  "已经在视频列表里": ["已经在视频列表里", "Already in the video list"],
  "缺少标题或链接": ["缺少标题或链接", "Missing a title or link"],
  "请先把平台改成抖音、小红书或 Bilibili": ["请先把平台改成抖音、小红书或 Bilibili", "Set the platform to Douyin, Xiaohongshu, or Bilibili first"],
  "导入失败": ["导入失败", "Import failed"],
};

export function collectionNote(note: string | null, en: boolean): string {
  if (!note) return "";
  if (note.startsWith("count:")) {
    const count = note.slice("count:".length);
    return en
      ? `Read ${count} items from the public page. Only the title, link, and counts declared on the page are used.`
      : `从公开页面读到 ${count} 条。只使用页面上声明的标题、链接和互动数。`;
  }
  const counted = note.match(/读到 (\d+) 条/);
  if (en && counted) {
    return `Read ${counted[1]} items from the public page. Only the title, link, and counts declared on the page are used.`;
  }
  if (note.startsWith("http:")) {
    const status = note.slice("http:".length);
    return en ? `The page returned ${status}.` : `页面返回 ${status}`;
  }
  const known = NOTES[note];
  if (known) return en ? known[1] : known[0];
  if (en && LEGACY[note]) return LEGACY[note];
  return note;
}

export function explainApiError(raw: string, en: boolean): string {
  let detail = raw;
  try {
    const parsed = JSON.parse(raw) as { detail?: string };
    if (parsed.detail) detail = parsed.detail;
  } catch {
    // The body is already plain text.
  }
  const known = API[detail] ?? NOTES[detail];
  if (known) return en ? known[1] : known[0];
  if (en && LEGACY[detail]) return LEGACY[detail];
  return detail;
}

export function skipReason(reason: string, en: boolean): string {
  const known = SKIP[reason];
  if (!known) return reason;
  return en ? known[1] : known[0];
}

export function keyTestMessage(code: string, en: boolean): string {
  if (code === "ok") {
    return en ? "Available. Cooldown cleared and the key is on." : "可用。已清除冷却并开启。";
  }
  if (code === "timeout") return en ? "Timed out. The key is cooling down." : "超时，已进入冷却";
  if (code === "request") return en ? "Request failed. The key is cooling down." : "请求失败，已进入冷却";
  if (code.startsWith("cooled:")) {
    const status = code.slice("cooled:".length);
    return en
      ? `Auth, quota, or timeout failed (${status}). The key is cooling down.`
      : `鉴权、额度或超时类失败（${status}），已进入冷却`;
  }
  if (code.startsWith("http:")) {
    const status = code.slice("http:".length);
    return en ? `The endpoint returned ${status}.` : `接口返回 ${status}`;
  }
  return code;
}
