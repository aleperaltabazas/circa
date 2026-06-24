import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Markdown } from "../Markdown";

describe("Markdown", () => {
  it("renders plain text as-is", () => {
    const { container } = render(<Markdown>{"hello"}</Markdown>);
    expect(container.textContent).toBe("hello");
    expect(container.querySelector("em, strong, u")).toBeNull();
  });

  it("renders italic as <em>", () => {
    const { container } = render(<Markdown>{"a *b* c"}</Markdown>);
    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    expect(em!.textContent).toBe("b");
    expect(container.textContent).toBe("a b c");
  });

  it("renders bold as <strong>", () => {
    const { container } = render(<Markdown>{"a **b** c"}</Markdown>);
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe("b");
  });

  it("renders underline as <u>", () => {
    const { container } = render(<Markdown>{"a __b__ c"}</Markdown>);
    const u = container.querySelector("u");
    expect(u).not.toBeNull();
    expect(u!.textContent).toBe("b");
  });

  it("renders nested marks", () => {
    const { container } = render(<Markdown>{"**bold *and italic* tail**"}</Markdown>);
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    const em = strong!.querySelector("em");
    expect(em).not.toBeNull();
    expect(em!.textContent).toBe("and italic");
  });

  it("honors escapes", () => {
    const { container } = render(<Markdown>{"a \\* b"}</Markdown>);
    expect(container.textContent).toBe("a * b");
    expect(container.querySelector("em")).toBeNull();
  });
});
