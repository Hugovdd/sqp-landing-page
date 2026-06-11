import { describe, expect, it } from "vitest";

import { scrubError, scrubString } from "./scrub";

describe("scrubString", () => {
  it("collapses a macOS home dir", () => {
    expect(scrubString("/Users/janedoe/Desktop/notes")).toBe("~/Desktop/notes");
  });
  it("collapses a Windows home dir (backslash)", () => {
    expect(scrubString("C:\\Users\\jane\\AppData")).toBe("~\\AppData");
  });
  it("collapses a Windows home dir (forward slash, common in stacks)", () => {
    expect(scrubString("at C:/Users/jane/app.log:3")).toBe("at ~/app.log:3");
  });
  it("collapses a macOS volume path", () => {
    expect(scrubString("/Volumes/Backup/notes")).toBe("~/notes");
  });
  it("collapses a linux home dir", () => {
    expect(scrubString("/home/bob/x")).toBe("~/x");
  });
  it("redacts a private project filename", () => {
    // the contiguous (space-free) path token before the extension is consumed
    expect(scrubString("opening Client X Rebrand.aep failed")).toBe(
      "opening Client X <file> failed",
    );
  });
  it("redacts both home dir and project file together", () => {
    const out = scrubString(
      "at /Users/jane/Movies/Secret Trailer.mov line 3",
    );
    expect(out).not.toMatch(/jane/);
    expect(out).not.toMatch(/Secret Trailer/);
    expect(out).toContain("~");
    expect(out).toContain("<file>");
  });
  it("keeps our own code filenames for debuggability", () => {
    expect(scrubString("at duplicateComps (main.jsx:42)")).toBe(
      "at duplicateComps (main.jsx:42)",
    );
  });
  it("handles empty / undefined", () => {
    expect(scrubString(undefined)).toBe("");
    expect(scrubString("")).toBe("");
  });
});

describe("scrubError", () => {
  it("scrubs all fields and caps length", () => {
    const r = scrubError({
      name: "Error",
      message: "failed on /Users/hugo/Projects/Promo.aep",
      stack: "x".repeat(20_000),
      action: "duplicate",
    });
    expect(r.message).toBe("failed on <file>");
    expect(r.stack!.length).toBe(8000);
    expect(r.action).toBe("duplicate");
  });

  it("omits optional fields when absent", () => {
    const r = scrubError({ name: "E", message: "m" });
    expect(r.stack).toBeUndefined();
    expect(r.action).toBeUndefined();
  });
});
