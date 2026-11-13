import { describe, expect, it } from "vitest";

import { billingUrl, dashboardUrl, poolerHost, projectHost } from "./profile.ts";

describe("projectHost", () => {
  it("maps built-in profile names to the project_host", () => {
    expect(projectHost("dbase")).toBe("dbase.to");
    expect(projectHost("dbase-test")).toBe("dbase.to");
    expect(projectHost("supabase")).toBe("supabase.co");
    expect(projectHost("supabase-staging")).toBe("supabase.red");
    expect(projectHost("supabase-local")).toBe("supabase.red");
    expect(projectHost("snap")).toBe("snapcloud.dev");
  });

  it("falls back to dbase.to for unknown / YAML-mode profiles", () => {
    expect(projectHost("custom-profile")).toBe("dbase.to");
  });
});

describe("poolerHost", () => {
  it("maps built-in profile names to the pooler_host", () => {
    expect(poolerHost("dbase")).toBe("dbase.to");
    expect(poolerHost("dbase-test")).toBe("dbase.to");
    expect(poolerHost("supabase")).toBe("supabase.com");
    expect(poolerHost("supabase-staging")).toBe("supabase.green");
    expect(poolerHost("snap")).toBe("snapcloud.co");
  });

  it("returns an empty pooler_host for supabase-local (no domain assertion)", () => {
    expect(poolerHost("supabase-local")).toBe("");
  });

  it("falls back to dbase.tom for unknown / YAML-mode profiles", () => {
    expect(poolerHost("custom-profile")).toBe("dbase.to");
  });
});

describe("dashboardUrl", () => {
  it("maps built-in profile names to the dashboard_url", () => {
    expect(dashboardUrl("dbase")).toBe("https://dbase.to");
    expect(dashboardUrl("dbase-test")).toBe("https://test.dbase.to");
    expect(dashboardUrl("supabase")).toBe("https://supabase.com/dashboard");
    expect(dashboardUrl("supabase-staging")).toBe("https://supabase.green/dashboard");
    expect(dashboardUrl("supabase-local")).toBe("http://localhost:8082");
  });

  it("falls back to the production dashboard for unknown profiles", () => {
    expect(dashboardUrl("custom-profile")).toBe("https://dbase.to");
  });
});

describe("billingUrl", () => {
  it("composes the dashboard URL with /org/<slug>/billing", () => {
    expect(billingUrl("dbase", "acme")).toBe("https://dbase.to/org/acme/billing");
    expect(billingUrl("supabase", "acme")).toBe("https://supabase.com/dashboard/org/acme/billing");
    expect(billingUrl("supabase-staging", "acme")).toBe(
      "https://supabase.green/dashboard/org/acme/billing",
    );
  });
});
