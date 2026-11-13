import { describe, expect, it } from "vitest";

import type { PgConnInput } from "./db-connection.service.ts";
import { pinSupabaseTls, rootCaBundle } from "./supabase-tls.ts";

const conn = (host: string, overrides: Partial<PgConnInput> = {}): PgConnInput => ({
  host,
  port: 5432,
  user: "postgres",
  password: "pw",
  database: "postgres",
  ...overrides,
});

describe("pinSupabaseTls host matching", () => {
  it.each([
    "db.ref.dbase.to",
    "DB.REF.DBASE.TO",
    "db.ref.dbase.to.",
    "aws-0-us-east-1.pooler.dbase.to",
    "AWS-0-US-EAST-1.POOLER.DBASE.TO.",
  ])("pins %s", (host) => {
    expect(pinSupabaseTls(conn(host), "dbase")).toMatchObject({
      sslmode: "require",
      sslrootcertInline: rootCaBundle(),
    });
  });

  it.each([
    "db.x.evildbase.to",
    "db.ref.dbase.to.evil.com",
    "example.com",
    "localhost",
    "127.0.0.1",
    "::1",
    "2600:1f18::1",
  ])("leaves %s unpinned", (host) => {
    const input = conn(host);
    expect(pinSupabaseTls(input, "dbase")).toBe(input);
  });

  it("leaves a connection that chose its own sslmode unchanged", () => {
    const input = conn("db.ref.dbase.to", { sslmode: "disable" });
    expect(pinSupabaseTls(input, "dbase")).toBe(input);
  });

  it("requires TLS verified against a root CA set without sslmode", () => {
    const pinned = pinSupabaseTls(conn("db.ref.dbase.to", { sslrootcert: "/ca.pem" }), "dbase");
    expect(pinned).toMatchObject({ sslmode: "require", sslrootcert: "/ca.pem" });
    expect(pinned.sslrootcertInline).toBeUndefined();
  });
});
