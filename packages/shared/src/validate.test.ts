import { describe, expect, it } from "vitest";

import { parseEnvelope } from "./validate";

const NOW = 1_733_923_200_000; // fixed "now" for deterministic ts bounds
const UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

function base(event: string, props: Record<string, unknown> = {}) {
  return {
    v: 1,
    installId: UUID,
    event,
    ts: NOW,
    app: { brand: "ae", appVersion: "1.1.1", aeVersion: "24.0", os: "macOS 14" },
    props,
  };
}

describe("parseEnvelope — valid events", () => {
  it("accepts app_installed", () => {
    const r = parseEnvelope(base("app_installed"), NOW);
    expect(r?.known).toBe(true);
    expect(r?.event).toBe("app_installed");
    expect(r?.app.brand).toBe("ae");
  });

  it("accepts session", () => {
    expect(parseEnvelope(base("session"), NOW)?.known).toBe(true);
  });

  it("accepts fetch with indexedItemCount", () => {
    const r = parseEnvelope(base("fetch", { indexedItemCount: 42 }), NOW);
    expect(r?.props.indexedItemCount).toBe(42);
  });

  it("accepts duplication_run", () => {
    const r = parseEnvelope(
      base("duplication_run", { compsDuplicated: 3, mode: "all" }),
      NOW,
    );
    expect(r?.props.compsDuplicated).toBe(3);
    expect(r?.props.mode).toBe("all");
  });

  it("passes app.license through when valid", () => {
    const r = parseEnvelope(
      {
        ...base("session"),
        app: { ...base("session").app, license: { plan: "paid", type: "SUL" } },
      },
      NOW,
    );
    expect(r?.app.license).toEqual({ plan: "paid", type: "SUL" });
  });

  it("coerces a malformed license to undefined without dropping the event", () => {
    const r = parseEnvelope(
      {
        ...base("session"),
        app: { ...base("session").app, license: { plan: "premium" } },
      },
      NOW,
    );
    expect(r?.known).toBe(true);
    expect(r?.app.license).toBeUndefined();
  });

  it("accepts tool_used with pane + tool + action", () => {
    const r = parseEnvelope(
      base("tool_used", { pane: "rigging", tool: "pinning", action: "top-left" }),
      NOW,
    );
    expect(r?.known).toBe(true);
    expect(r?.props.tool).toBe("pinning");
    expect(r?.props.action).toBe("top-left");
  });

  it("accepts tool_used without an action", () => {
    const r = parseEnvelope(
      base("tool_used", { pane: "rigging", tool: "grid-packer" }),
      NOW,
    );
    expect(r?.props.tool).toBe("grid-packer");
    expect(r?.props.action).toBeUndefined();
  });

  it("accepts error", () => {
    const r = parseEnvelope(
      base("error", {
        category: "extendscript",
        name: "TypeError",
        message: "boom",
      }),
      NOW,
    );
    expect(r?.known).toBe(true);
    expect(r?.props.name).toBe("TypeError");
  });

  it("accepts binance brand without aeVersion", () => {
    const env = base("session");
    env.app = { brand: "binance", appVersion: "1.0.0" } as never;
    expect(parseEnvelope(env, NOW)?.app.brand).toBe("binance");
  });
});

describe("parseEnvelope — drop-malformed spine", () => {
  it("drops wrong version", () => {
    expect(parseEnvelope({ ...base("session"), v: 2 }, NOW)).toBeNull();
  });
  it("drops non-uuid installId", () => {
    expect(parseEnvelope({ ...base("session"), installId: "nope" }, NOW)).toBeNull();
  });
  it("drops unknown brand", () => {
    const env = base("session");
    env.app = { ...env.app, brand: "photoshop" } as never;
    expect(parseEnvelope(env, NOW)).toBeNull();
  });
  it("drops missing app", () => {
    const env = base("session") as Record<string, unknown>;
    delete env.app;
    expect(parseEnvelope(env, NOW)).toBeNull();
  });
  it("drops non-object input", () => {
    expect(parseEnvelope("garbage", NOW)).toBeNull();
    expect(parseEnvelope(null, NOW)).toBeNull();
  });
});

describe("parseEnvelope — ts sanity bounds", () => {
  it("drops ancient ts", () => {
    expect(parseEnvelope({ ...base("session"), ts: 1_000 }, NOW)).toBeNull();
  });
  it("drops far-future ts", () => {
    expect(
      parseEnvelope({ ...base("session"), ts: NOW + 10 * 86_400_000 }, NOW),
    ).toBeNull();
  });
  it("drops non-finite ts", () => {
    expect(parseEnvelope({ ...base("session"), ts: Infinity }, NOW)).toBeNull();
  });
});

describe("parseEnvelope — known-event prop bounds", () => {
  it("drops duplication_run missing compsDuplicated", () => {
    expect(parseEnvelope(base("duplication_run", { mode: "all" }), NOW)).toBeNull();
  });
  it("drops duplication_run with absurd compsDuplicated", () => {
    expect(
      parseEnvelope(
        base("duplication_run", { compsDuplicated: 9_999_999, mode: "all" }),
        NOW,
      ),
    ).toBeNull();
  });
  it("drops duplication_run with bad mode", () => {
    expect(
      parseEnvelope(
        base("duplication_run", { compsDuplicated: 1, mode: "sideways" }),
        NOW,
      ),
    ).toBeNull();
  });
  it("drops tool_used missing tool", () => {
    expect(parseEnvelope(base("tool_used", { pane: "rigging" }), NOW)).toBeNull();
  });
  it("drops error missing name", () => {
    expect(
      parseEnvelope(base("error", { category: "react", message: "x" }), NOW),
    ).toBeNull();
  });
});

describe("parseEnvelope — forward compatibility", () => {
  it("captures an unknown event type raw (known: false)", () => {
    const r = parseEnvelope(base("teleported", { whatever: 1 }), NOW);
    expect(r).not.toBeNull();
    expect(r?.known).toBe(false);
    expect(r?.event).toBe("teleported");
    expect(r?.props.whatever).toBe(1);
  });

  it("allows unknown extra props keys on a known event", () => {
    const r = parseEnvelope(
      base("fetch", { indexedItemCount: 5, futureField: "ok" }),
      NOW,
    );
    expect(r?.known).toBe(true);
    expect(r?.props.futureField).toBe("ok");
  });
});
