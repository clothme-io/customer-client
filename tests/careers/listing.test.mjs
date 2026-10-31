import assert from "node:assert/strict";
import test from "node:test";
import { getLocalPreviewJob, getLocalPreviewJobs } from "../../src/lib/careersPreview.js";
import { withoutHowToApply } from "../../src/lib/careersContent.js";

test("stored open roles omit their obsolete application instructions", () => {
  const source = "# Role\n\n## Equal Opportunity\n\nAll are welcome.\n\n## How to Apply\n\nApply on the careers page.\n";
  assert.equal(withoutHowToApply(source), "# Role\n\n## Equal Opportunity\n\nAll are welcome.\n");
});

test("local preview includes exactly the complete supplied roles", () => {
  const jobs = getLocalPreviewJobs();
  assert.equal(jobs.length, 10);
  assert.equal(new Set(jobs.map((job) => job.slug)).size, 10);
  assert.ok(jobs.every((job) => job.status === "open"));
  assert.ok(jobs.every((job) => job.contentSource.startsWith(`# ${job.title}\n`)));
  assert.ok(jobs.every((job) => !job.contentSource.includes("## How to Apply")));
  assert.ok(getLocalPreviewJob("founding-senior-backend-engineer"));
  assert.ok(getLocalPreviewJob("founding-senior-mobile-engineer"));
  assert.ok(getLocalPreviewJob("founding-people-administrative-operations-specialist"));
});
