import { describe, it, expect } from "vitest";
import { parseMarkdown } from "../markdown";

describe("parseMarkdown", () => {
  it("returns plain text as a single string node", () => {
    expect(parseMarkdown("hello world")).toEqual(["hello world"]);
  });

  it("parses italic", () => {
    expect(parseMarkdown("*hi*")).toEqual([{ tag: "em", children: ["hi"] }]);
  });

  it("parses bold", () => {
    expect(parseMarkdown("**hi**")).toEqual([{ tag: "strong", children: ["hi"] }]);
  });

  it("parses underline", () => {
    expect(parseMarkdown("__hi__")).toEqual([{ tag: "u", children: ["hi"] }]);
  });

  it("mixes plain text and marks", () => {
    expect(parseMarkdown("a *b* c")).toEqual([
      "a ",
      { tag: "em", children: ["b"] },
      " c",
    ]);
  });

  it("prefers bold over italic when both could match (** before *)", () => {
    expect(parseMarkdown("**hi**")).toEqual([{ tag: "strong", children: ["hi"] }]);
  });

  it("nests marks (italic inside bold)", () => {
    expect(parseMarkdown("**a *b* c**")).toEqual([
      {
        tag: "strong",
        children: ["a ", { tag: "em", children: ["b"] }, " c"],
      },
    ]);
  });

  it("nests marks (bold inside italic)", () => {
    expect(parseMarkdown("*a **b** c*")).toEqual([
      {
        tag: "em",
        children: ["a ", { tag: "strong", children: ["b"] }, " c"],
      },
    ]);
  });

  it("leaves unmatched delimiters as literal text", () => {
    expect(parseMarkdown("*unmatched")).toEqual(["*unmatched"]);
    expect(parseMarkdown("**also unmatched")).toEqual(["**also unmatched"]);
    expect(parseMarkdown("__still unmatched")).toEqual(["__still unmatched"]);
  });

  it("escapes a delimiter with backslash", () => {
    expect(parseMarkdown("\\*literal*")).toEqual(["*literal*"]);
    expect(parseMarkdown("a \\* b")).toEqual(["a * b"]);
    expect(parseMarkdown("\\*\\*not bold\\*\\*")).toEqual(["**not bold**"]);
  });

  it("escapes the backslash itself", () => {
    expect(parseMarkdown("a\\\\b")).toEqual(["a\\b"]);
  });

  it("escapes inside a mark's content", () => {
    expect(parseMarkdown("*not \\* close*")).toEqual([
      { tag: "em", children: ["not * close"] },
    ]);
  });

  it("does not split bold when looking for an italic close", () => {
    // The single * should NOT match inside the **bold** sequence.
    expect(parseMarkdown("*a **b** c*")).toEqual([
      {
        tag: "em",
        children: ["a ", { tag: "strong", children: ["b"] }, " c"],
      },
    ]);
  });

  it("handles consecutive marks", () => {
    expect(parseMarkdown("*a* **b** __c__")).toEqual([
      { tag: "em", children: ["a"] },
      " ",
      { tag: "strong", children: ["b"] },
      " ",
      { tag: "u", children: ["c"] },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(parseMarkdown("")).toEqual([]);
  });
});
