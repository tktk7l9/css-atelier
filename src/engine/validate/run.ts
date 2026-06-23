// Orchestration: run a challenge's validator specs against a Snapshot and
// report overall pass/fail plus the individual results (failing messages are
// surfaced to the learner).

import type { Snapshot, ValidationResult } from "./snapshot.js";
import { runSpec, type ValidatorSpec } from "./primitives.js";

export interface Evaluation {
  readonly passed: boolean;
  readonly results: readonly ValidationResult[];
  /** Just the messages of the failing validators, in order. */
  readonly failures: readonly string[];
}

export function evaluate(
  specs: readonly ValidatorSpec[],
  snapshot: Snapshot,
): Evaluation {
  const results = specs.map((spec) => runSpec(spec, snapshot));
  const failures = results.filter((r) => !r.pass).map((r) => r.message);
  return { passed: failures.length === 0, results, failures };
}
