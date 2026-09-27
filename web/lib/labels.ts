import contentDictionary from "../data/content_label_dictionary.json";

type Dictionary = {
  fields: Record<string, { values?: { code: string; label_zh: string }[] }>;
};

const fields = (contentDictionary as Dictionary).fields;

export function contentLabel(field: string, code: string | null | undefined): string {
  if (!code) return "—";
  const match = fields[field]?.values?.find((item) => item.code === code);
  return match?.label_zh ?? code;
}

export const WATCHING_LABEL: Record<string, string> = {
  finished: "看完",
  half_left: "看到一半划走",
  left_early: "开头就划走",
};
