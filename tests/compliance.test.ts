import assert from "node:assert/strict";
import test from "node:test";
import { findRecommendationRisk } from "../src/lib/compliance.ts";

test("blocks recommendation-like language", () => {
  assert.ok(findRecommendationRisk("The client should increase the equity allocation.").length > 0);
});

test("allows factual portfolio context", () => {
  assert.equal(findRecommendationRisk("Recorded equity represented 62% of the household portfolio at the review date.").length, 0);
});
