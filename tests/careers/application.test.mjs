import assert from "node:assert/strict";
import test from "node:test";
import { cleanText, cleanUrl, MAX_RESUME_BYTES, validateResume } from "../../src/lib/careerApplication.js";

test("résumé validation accepts matching file signatures and rejects renamed files", () => {
  assert.equal(validateResume("resume.pdf", Buffer.from("%PDF-1.7\nbody")), "application/pdf");
  assert.equal(validateResume("resume.doc", Buffer.from("d0cf11e0a1b11ae1", "hex")), "application/msword");
  const docx = Buffer.concat([
    Buffer.from("504b0304", "hex"),
    Buffer.from("[Content_Types].xml word/document.xml"),
    Buffer.from("504b0506", "hex"),
  ]);
  assert.equal(validateResume("resume.docx", docx), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.equal(validateResume("resume.pdf", Buffer.from("plain text")), null);
  assert.equal(validateResume("resume.exe", Buffer.from("%PDF-1.7")), null);
  assert.equal(validateResume("resume.pdf", Buffer.alloc(MAX_RESUME_BYTES + 1)), null);
});

test("applicant text and links are bounded", () => {
  assert.equal(cleanText("  Alex  ", 100, true), "Alex");
  assert.equal(cleanText("", 100, true), null);
  assert.equal(cleanText("A\u0000B", 100), null);
  assert.equal(cleanUrl("javascript:alert(1)"), null);
  assert.equal(cleanUrl("http://example.com"), null);
  assert.equal(cleanUrl("https://example.com/profile"), "https://example.com/profile");
});
