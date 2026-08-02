export interface EventTheme {
  primary: string;
  accent: string;
  background: string;
}

export const EVENT_THEMES: Record<string, EventTheme> = {
  ocean: { primary: "#173b57", accent: "#5aa9d6", background: "#eaf6ff" },
  rose: { primary: "#6d3044", accent: "#d8899e", background: "#fff2f5" },
  sage: { primary: "#354f42", accent: "#8eaa96", background: "#f1f7f2" },
  lavender: { primary: "#493d6b", accent: "#a99bd4", background: "#f5f2ff" },
  terracotta: { primary: "#6d382b", accent: "#c8795d", background: "#fff4ef" },
  midnight: { primary: "#171b2e", accent: "#59658f", background: "#f0f2fa" },
};

export function customThemeValue(primary: string, accent: string): string {
  return `custom-${primary.replace("#", "")}-${accent.replace("#", "")}`;
}

export function getEventTheme(value: string | undefined): EventTheme {
  const custom = value?.match(/^custom-([0-9a-f]{6})-([0-9a-f]{6})$/i);
  if (custom) {
    return {
      primary: `#${custom[1]}`,
      accent: `#${custom[2]}`,
      background: `#${custom[2]}18`,
    };
  }
  return EVENT_THEMES[value ?? "ocean"] ?? EVENT_THEMES.ocean;
}
