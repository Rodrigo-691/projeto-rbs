import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TabGate } from "@/components/TabGate";

const state = vi.hoisted(() => ({ allowed: false, loading: false, error: false }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: { quota: "subcota" }, isPending: false, isError: false }) }));
vi.mock("@/lib/portal", () => ({
  sponsorQuery: () => ({}), QUOTA_LABEL: { subcota: "Subcota" },
  useSponsorTabAccess: () => ({ allows: () => state.allowed, isLoading: state.loading, isError: state.error }),
}));
afterEach(cleanup);

describe("Restricted tab content", () => {
  it.each([
    { allowed: false, loading: false, error: false },
    { allowed: false, loading: true, error: false },
    { allowed: false, loading: false, error: true },
  ])("does not mount data readers when access is denied or unknown: %j", (value) => {
    Object.assign(state, value);
    const readData = vi.fn();
    function RestrictedContent() { readData(); return null; }
    render(<TabGate id="sponsor" tab="pesquisa" title="Pesquisa"><RestrictedContent /></TabGate>);
    expect(readData).not.toHaveBeenCalled();
  });

  it("mounts data readers when access is granted", () => {
    Object.assign(state, { allowed: true, loading: false, error: false });
    const readData = vi.fn();
    function RestrictedContent() { readData(); return null; }
    render(<TabGate id="sponsor" tab="pesquisa" title="Pesquisa"><RestrictedContent /></TabGate>);
    expect(readData).toHaveBeenCalled();
  });
});