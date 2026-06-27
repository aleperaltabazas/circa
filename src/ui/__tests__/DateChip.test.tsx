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

  it("handles single-digit months and days", () => {
    render(<DateChip todayIso="2026-01-05" locale="es" />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("carries a localized tooltip via data-tooltip and aria-label", () => {
    const { container } = render(<DateChip todayIso="2026-06-24" locale="es" />);
    const chip = container.querySelector("[data-tooltip]") as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.getAttribute("data-tooltip")).toBe("El evento ocurrió en esta fecha del calendario");
    expect(chip.getAttribute("aria-label")).toBe("El evento ocurrió en esta fecha del calendario");
  });
});
