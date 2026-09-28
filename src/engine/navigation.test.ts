import { describe, expect, it } from "vitest";
import { LESSONS, TRACKS } from "./content/index.js";
import { conceptLabel, hintButtonLabel, lessonPosition, resumeLesson } from "./navigation.js";

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
    expect(resumeLesson([LESSONS[0]!.id, LESSONS[2]!.id])?.id).toBe(LESSONS[1]!.id);
  });
  it("returns undefined when every lesson is complete", () => {
    expect(resumeLesson(LESSONS.map((l) => l.id))).toBeUndefined();
  });
});

describe("conceptLabel", () => {
  it("uses learner-facing names, not internal ids", () => {
    expect(conceptLabel("box-model")).toBe("3D: ボックスモデル");
    expect(conceptLabel("flexbox")).toBe("3D: Flexbox");
    expect(conceptLabel("grid")).toBe("3D: Grid");
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
