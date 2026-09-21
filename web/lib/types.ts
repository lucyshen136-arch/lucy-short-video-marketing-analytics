export type VideoRecord = {
  video_id: string;
  selection_reason: string;
  source_kind: string | null;
  meta_platform: string;
  meta_public_url: string;
  meta_title: string;
  meta_creator_name: string;
  meta_publish_date: string;
  meta_duration_seconds: number | null;
  meta_collected_at: string | null;
  meta_view_count: number | null;
  meta_like_count: number | null;
  meta_comment_count: number | null;
  meta_save_count: number | null;
  meta_share_count: number | null;
  meta_follower_count: number | null;
  meta_hashtags: string | null;
  content_type: string | null;
  content_hook_type: string | null;
  content_narrative_structure: string | null;
  content_value_proposition: string | null;
  content_persuasion: string | null;
  content_evidence_type: string | null;
  content_funnel_stage: string | null;
  content_cta_type: string | null;
  viewer_continued_watching: string | null;
  viewer_memory_score: number | null;
  viewer_trust_score: number | null;
  viewer_action_intent_score: number | null;
  ai_content_type: string | null;
  ai_hook_type: string | null;
  ai_narrative_structure: string | null;
  ai_value_proposition: string | null;
  ai_persuasion: string | null;
  ai_evidence_type: string | null;
  ai_funnel_stage: string | null;
  ai_cta_type: string | null;
  ai_label_status: string | null;
  created_at: string;
  updated_at: string;
};

export type VideoListResponse = {
  items: VideoRecord[];
  total: number;
  page: number;
  page_size: number;
};

export type DictionaryOption = {
  code?: string;
  score?: number;
  label_zh: string;
};

export type DictionaryField = {
  label_zh: string;
  field_kind: string;
  values?: DictionaryOption[];
  sentinel_values?: DictionaryOption[];
  anchors?: DictionaryOption[];
};

export type DictionaryItemRecord = {
  id: number;
  field_id: number;
  code: string;
  label_zh: string;
  definition: string | null;
  sort_order: number;
};

export type DictionaryFieldRecord = {
  id: number;
  field_key: string;
  label_zh: string;
  field_kind: string;
  question: string | null;
  items: DictionaryItemRecord[];
};

export type DictionarySetSummary = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  version: string | null;
  source_doc: string | null;
  scope: string | null;
  created_at: string;
  updated_at: string;
  field_count: number;
  item_count: number;
};

export type DictionarySetRecord = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  version: string | null;
  source_doc: string | null;
  scope: string | null;
  created_at: string;
  updated_at: string;
  fields: DictionaryFieldRecord[];
};

export type LabelDictionary = {
  fields: Record<string, DictionaryField>;
};
