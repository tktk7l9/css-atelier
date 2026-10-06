import { describe, expect, it } from "vitest";
import { LESSONS, TRACKS } from "./content/index.js";
import {
  conceptLabel,
  hintButtonLabel,
  lessonPosition,
  resumeLesson,
  viewportLabel,
} from "./navigation.js";

describe("lessonPosition", () => {
  it("returns the 1-based index within the lesson's track", () => {
    const track = TRACKS[0]!;
    expect(lessonPosition(track.lessons[0]!.id)).toEqual({ index: 1, total: track.lessons.length });
    const last = track.lessons[track.lessons.length - 1]!;
    expect(lessonPosition(last.id)).toEqual({
      index: track.lessons.length,
      total: track.lessons.length,
    });
  });
  it("returns undefined for an unknown lesson", () => {
    expect(lessonPosition("nope")).toBeUndefined();
  });
});

describe("resumeLesson", () => {
  it("starts at the first lesson when nothing is complete", () => {
    expect(resumeLesson([])?.id).toBe(LESSONS[0]!.id);
  });
  it("skips completed lessons in catalogue order", () => {
    expect(resumeLesson([LESSONS[1]!.id, LESSONS[0]!.id])?.id).toBe(LESSONS[2]!.id);
  });
  it("returns undefined when every lesson is complete", () => {
    expect(resumeLesson(LESSONS.map((l) => l.id))).toBeUndefined();
  });
  // Completion order is the learner's own path (SHIG 12, 20, 77): resume after
  // the lesson they finished most recently, not at the top of the catalogue.
  it("continues after the most recently completed lesson", () => {
    expect(resumeLesson([LESSONS[4]!.id])?.id).toBe(LESSONS[5]!.id);
    expect(resumeLesson([LESSONS[0]!.id, LESSONS[4]!.id])?.id).toBe(LESSONS[5]!.id);
    expect(resumeLesson([LESSONS[4]!.id, LESSONS[0]!.id])?.id).toBe(LESSONS[1]!.id);
  });
  it("skips already completed lessons after the most recent one", () => {
    expect(resumeLesson([LESSONS[5]!.id, LESSONS[4]!.id])?.id).toBe(LESSONS[6]!.id);
  });
  it("wraps to the first unfinished lesson when the most recent one is the last", () => {
    const last = LESSONS[LESSONS.length - 1]!;
    expect(resumeLesson([last.id])?.id).toBe(LESSONS[0]!.id);
  });
  it("ignores unknown ids in the completed list", () => {
    expect(resumeLesson(["nope"])?.id).toBe(LESSONS[0]!.id);
  });
});

describe("viewportLabel", () => {
  it("says nothing when the preview follows the panel width (SHIG 1, 11)", () => {
    expect(viewportLabel(undefined)).toBe("");
  });
  it("explains a fixed width in plain words", () => {
    expect(viewportLabel(380)).toBe("幅 380px に固定");
  });
});

describe("conceptLabel", () => {
  it("uses learner-facing names, not internal ids", () => {
    expect(conceptLabel("box-model")).toBe("3D: ボックスモデル");
    expect(conceptLabel("flexbox")).toBe("3D: Flexbox");
    expect(conceptLabel("grid")).toBe("3D: Grid");
    expect(conceptLabel("transform-3d")).toBe("3D: transform");
    expect(conceptLabel("none")).toBe("プレビュー");
  });
});

describe("hintButtonLabel", () => {
  it("shows how many hints remain", () => {
    expect(hintButtonLabel(0, 2)).toBe("ヒント（残り 2）");
    expect(hintButtonLabel(1, 2)).toBe("ヒント（残り 1）");
  });
  it("says there are no more hints once exhausted", () => {
    expect(hintButtonLabel(2, 2)).toBe("ヒントは以上です");
    expect(hintButtonLabel(0, 0)).toBe("ヒントは以上です");
  });
});
