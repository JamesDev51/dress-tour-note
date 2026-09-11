import { afterEach, describe, expect, it } from "vitest";
import {
  acknowledgeRecallDraft,
  clearRecallDrafts,
  queueRecallDraft,
  readRecallDraft,
} from "./recallDraft";

afterEach(() => sessionStorage.clear());
const values = {
  memoryCue: "등 뒤 리본",
  likedReason: "허리가 편함",
  concern: "팔 올리기 불편함",
};

describe("interrupted recall draft boundary", () => {
  it("keeps the newest draft when an older write finishes", () => {
    const older = queueRecallDraft("dress", values);
    const newer = queueRecallDraft("dress", { ...values, concern: "무거움" });
    if (!older || !newer) throw new Error("storage fixture unavailable");
    acknowledgeRecallDraft("dress", older.revision);
    expect(readRecallDraft("dress")).toEqual(newer);
  });

  it("removes a recovered draft only after its own revision is acknowledged", () => {
    const pending = queueRecallDraft("dress", values);
    if (!pending) throw new Error("storage fixture unavailable");
    acknowledgeRecallDraft("dress", pending.revision);
    expect(readRecallDraft("dress")).toBeUndefined();
  });

  it.each([
    "not json",
    JSON.stringify({
      revision: "x",
      values: { ...values, concern: "가".repeat(161) },
    }),
    JSON.stringify({ revision: "x", values: { ...values, memoryCue: 42 } }),
    JSON.stringify({
      revision: "x",
      values: { ...values, faceData: "untrusted" },
    }),
  ])("ignores malformed or unbounded recovery data", (payload) => {
    sessionStorage.setItem("dress-note:recall-draft:dress", payload);
    expect(readRecallDraft("dress")).toBeUndefined();
  });

  it("clears recall drafts without deleting unrelated session state", () => {
    queueRecallDraft("first", values);
    queueRecallDraft("second", values);
    sessionStorage.setItem("unrelated-session-value", "keep");
    clearRecallDrafts();
    expect(readRecallDraft("first")).toBeUndefined();
    expect(readRecallDraft("second")).toBeUndefined();
    expect(sessionStorage.getItem("unrelated-session-value")).toBe("keep");
  });
});
