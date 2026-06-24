import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EraPill } from "../EraPill";

describe("EraPill", () => {
  it("renders the Spanish era label by default-ish locale", () => {
    render(<EraPill era="modern" locale="es" />);
    expect(screen.getByText("moderna")).toBeInTheDocument();
  });

  it("renders the English era label", () => {
    render(<EraPill era="modern" locale="en" />);
    expect(screen.getByText("modern")).toBeInTheDocument();
  });

  it("carries a localized tooltip via the title attribute", () => {
    render(<EraPill era="modern" locale="es" />);
    expect(screen.getByText("moderna")).toHaveAttribute("title", "Era histórica de la respuesta");
  });
});
