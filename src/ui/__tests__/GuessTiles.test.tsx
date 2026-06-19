import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuessTiles } from "../GuessTiles";

describe("GuessTiles", () => {
  it("renders 5 tiles, filling submitted guesses and leaving the rest empty", () => {
    render(
      <GuessTiles
        guesses={[
          { year: 1500, distanceRatio: 0.21, bucket: "orange" },
          { year: 1600, distanceRatio: 0.08, bucket: "yellow" },
        ]}
      />,
    );
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByText("1600")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("applies an inline background color to a filled tile", () => {
    const { container } = render(
      <GuessTiles guesses={[{ year: 1571, distanceRatio: 0, bucket: "perfect" }]} />,
    );
    const filled = container.querySelector("[data-filled='true']") as HTMLElement;
    // jsdom normalizes hsl() to rgb(); hsl(45, 90%, 55%) → rgb(244, 192, 37)
    expect(filled.style.background).toBe("rgb(244, 192, 37)");
  });
});
