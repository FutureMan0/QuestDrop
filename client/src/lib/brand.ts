export const BRAND = {
  name: "QuestDrop",
  shortName: "QuestDrop",
  tagline: "Game Requests & Downloads",
  eventPrefix: "questdrop",
  logo: "/questdrop.svg",
  iconPng: "/Questarr_icon.png",
  githubUrl: "https://github.com/Doezer/Questarr",
} as const;

export const EVENTS = {
  globalSearch: `${BRAND.eventPrefix}-global-search`,
  dashboardSearch: `${BRAND.eventPrefix}-dashboard-search`,
} as const;
