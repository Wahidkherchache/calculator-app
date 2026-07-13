const test = require("node:test");
const assert = require("node:assert/strict");
const { evaluateExpression } = require("../index.js");

test("evaluates standard arithmetic expressions", () => {
  assert.equal(evaluateExpression("2 + 3 * 4"), 14);
  assert.equal(evaluateExpression("(8 / 2) + 3"), 7);
});

test("supports percentage and power shortcuts", () => {
  assert.equal(evaluateExpression("50% of 200"), null);
  assert.equal(evaluateExpression("2^3"), 8);
});
