import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EraPill } from "../EraPill";

describe("EraPill", () => {
  it("renders the Spanish era label", () => {
    render(<EraPill era="modern" locale="es" />);
    expect(screen.getByText("moderna")).toBeInTheDocument();
  });

  it("carries a localized tooltip via data-tooltip and aria-label", () => {
    render(<EraPill era="modern" locale="es" />);
    const el = screen.getByText("moderna");
    expect(el).toHaveAttribute("data-tooltip", "Era histórica de la respuesta");
    expect(el).toHaveAttribute("aria-label", "Era histórica de la respuesta");
  });
});
