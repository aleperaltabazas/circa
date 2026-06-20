import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColorLegend } from "../ColorLegend";

describe("ColorLegend", () => {
  it("renders Spanish labels", () => {
    render(<ColorLegend locale="es" />);
    expect(screen.getByText("muy lejos")).toBeInTheDocument();
    expect(screen.getByText("más cerca")).toBeInTheDocument();
    expect(screen.getByText("exacto")).toBeInTheDocument();
  });

  it("renders English labels", () => {
    render(<ColorLegend locale="en" />);
    expect(screen.getByText("far off")).toBeInTheDocument();
    expect(screen.getByText("closer")).toBeInTheDocument();
    expect(screen.getByText("exact")).toBeInTheDocument();
  });
});
