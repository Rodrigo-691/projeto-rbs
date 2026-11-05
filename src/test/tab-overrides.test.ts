import { describe, expect, it } from "vitest";

import { TABS, type QuotaModule } from "@/lib/portal";
import { canAccessTab, type TabOverride } from "@/lib/tab-access";

// Quota default: every tab for all levels, "pesquisa" only for Master.
const CONFIG: Pick<QuotaModule, "quota" | "tab_key">[] = (["master", "subcota_g", "subcota"] as const).flatMap((quota) =>
  TABS.map((t) => t.key)
    .filter((tab) => tab !== "pesquisa" || quota === "master")
    .map((tab_key) => ({ quota, tab_key })),
);
const sponsor = { isAdmin: false };

describe("Per-sponsor tab exceptions", () => {
  it("follows the quota default when there is no exception", () => {
    expect(canAccessTab(CONFIG, "subcota", sponsor, "pesquisa", [])).toBe(false);
    expect(canAccessTab(CONFIG, "master", sponsor, "pesquisa", [])).toBe(true);
  });

  it("grants a tab outside the quota to one sponsor", () => {
    const o: TabOverride[] = [{ tab_key: "pesquisa", allowed: true }];
    expect(canAccessTab(CONFIG, "subcota", sponsor, "pesquisa", o)).toBe(true);
    expect(canAccessTab(CONFIG, "subcota_g", sponsor, "pesquisa", o)).toBe(true);
  });

  it("removes a tab that is part of the quota default for one sponsor", () => {
    const o: TabOverride[] = [{ tab_key: "pesquisa", allowed: false }];
    expect(canAccessTab(CONFIG, "master", sponsor, "pesquisa", o)).toBe(false);
    expect(canAccessTab(CONFIG, "subcota", sponsor, "midia", [{ tab_key: "midia", allowed: false }])).toBe(false);
  });

  it("only affects the tab named in the exception", () => {
    const o: TabOverride[] = [{ tab_key: "midia", allowed: false }];
    expect(canAccessTab(CONFIG, "master", sponsor, "contrato", o)).toBe(true);
    expect(canAccessTab(CONFIG, "master", sponsor, "pesquisa", o)).toBe(true);
  });

  it("does not limit RBS admins even when a tab is blocked", () => {
    const o: TabOverride[] = [{ tab_key: "pesquisa", allowed: false }];
    expect(canAccessTab(CONFIG, "master", { isAdmin: true }, "pesquisa", o)).toBe(true);
  });

  it("denies access while identity or quota is unknown, even with an allow exception", () => {
    const o: TabOverride[] = [{ tab_key: "pesquisa", allowed: true }];
    expect(canAccessTab(CONFIG, "subcota", undefined, "pesquisa", o)).toBe(false);
    expect(canAccessTab(CONFIG, undefined, sponsor, "pesquisa", o)).toBe(false);
  });
});
