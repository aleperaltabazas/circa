import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DateChip } from "../DateChip";

describe("DateChip", () => {
  it("renders day and Spanish short month for es locale", () => {
    render(<DateChip todayIso="2026-06-24" locale="es" />);
    const el = screen.getByText(/24/);
    expect(el).toBeInTheDocument();
    expect(el.textContent?.toLowerCase()).toMatch(/jun/);
  });

  it("renders day and English short month for en locale", () => {
    render(<DateChip todayIso="2026-06-24" locale="en" />);
    const el = screen.getByText(/24/);
    expect(el).toBeInTheDocument();
    expect(el.textContent).toMatch(/Jun/);
  });

  it("handles single-digit months and days", () => {
    render(<DateChip todayIso="2026-01-05" locale="en" />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("carries a localized tooltip via data-tooltip and aria-label", () => {
    const { container } = render(<DateChip todayIso="2026-06-24" locale="en" />);
    const chip = container.querySelector("[data-tooltip]") as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.getAttribute("data-tooltip")).toBe("The event happened on this date");
    expect(chip.getAttribute("aria-label")).toBe("The event happened on this date");
  });
});
