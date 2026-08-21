import assert from "node:assert/strict";
import test from "node:test";

import { formatRelativeTime } from "../lib/relative-time";

const now = Date.parse("2026-08-21T12:00:00.000Z");

function timestamp(secondsAgo: number) {
  return new Date(now - secondsAgo * 1000).toISOString();
}

test("formats relative times using the appropriate unit", () => {
  assert.equal(formatRelativeTime(timestamp(12), now), "12 seconds ago");
  assert.equal(formatRelativeTime(timestamp(5 * 60), now), "5 minutes ago");
  assert.equal(formatRelativeTime(timestamp(3 * 60 * 60), now), "3 hours ago");
  assert.equal(formatRelativeTime(timestamp(2 * 24 * 60 * 60), now), "2 days ago");
  assert.equal(formatRelativeTime(timestamp(2 * 7 * 24 * 60 * 60), now), "2 weeks ago");
  assert.equal(formatRelativeTime(timestamp(2 * 30 * 24 * 60 * 60), now), "2 months ago");
  assert.equal(formatRelativeTime(timestamp(2 * 365 * 24 * 60 * 60), now), "2 years ago");
});

test("handles singular values and future timestamps", () => {
  assert.equal(formatRelativeTime(timestamp(60), now), "1 minute ago");
  assert.equal(formatRelativeTime(new Date(now + 90 * 1000).toISOString(), now), "in 2 minutes");
});

test("returns a placeholder for invalid timestamps", () => {
  assert.equal(formatRelativeTime("not-a-date", now), "—");
});
