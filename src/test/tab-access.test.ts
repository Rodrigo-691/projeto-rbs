import { describe, expect, it } from "vitest";

import { isTabAllowed, TABS, type Quota, type QuotaModule } from "@/lib/portal";

// Mirrors the rows deployed in `quota_modules`: every level gets every tab
// except "pesquisa", which is Master only.
const ALL_TABS = TABS.map((t) => t.key);
const CONFIG: Pick<QuotaModule, "quota" | "tab_key">[] = (
  ["master", "subcota_g", "subcota"] as const
).flatMap((quota) =>
  ALL_TABS.filter((tab) => tab !== "pesquisa" || quota === "master").map((tab_key) => ({
    quota,
    tab_key,
  })),
);

describe("Tab access by sponsorship level", () => {
  it("hides the activation survey from Subcota and Subcota G", () => {
    expect(isTabAllowed(CONFIG, "subcota", "pesquisa")).toBe(false);
    expect(isTabAllowed(CONFIG, "subcota_g", "pesquisa")).toBe(false);
  });

  it("shows the activation survey to Master", () => {
    expect(isTabAllowed(CONFIG, "master", "pesquisa")).toBe(true);
  });

  it("shows every other tab to all three levels", () => {
    const quotas: Quota[] = ["master", "subcota_g", "subcota"];
    for (const quota of quotas) {
      for (const tab of ALL_TABS.filter((t) => t !== "pesquisa")) {
        expect(isTabAllowed(CONFIG, quota, tab), `${quota} / ${tab}`).toBe(true);
      }
    }
  });

  it("allows a tab no level is configured for", () => {
    expect(isTabAllowed(CONFIG, "master", "inexistente")).toBe(false);
  });
});
