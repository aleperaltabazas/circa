import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuessTiles } from "../GuessTiles";

describe("GuessTiles", () => {
  it("renders 5 tiles, filling submitted guesses and leaving the rest empty", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[
          { year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" },
          { year: 1600, distanceRatio: 0.08, bucket: "yellow", direction: "earlier" },
        ]}
      />,
    );
    expect(screen.getByText("1500")).toBeInTheDocument();
    expect(screen.getByText("1600")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("applies an inline background color to a filled tile", () => {
    const { container } = render(
      <GuessTiles
        locale="es"
        guesses={[{ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" }]}
      />,
    );
    const filled = container.querySelector("[data-filled='true']") as HTMLElement;
    expect(filled.style.background).toBeTruthy();
  });

  it("renders an up arrow when direction is later", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" }]}
      />,
    );
    expect(screen.getByText("▲")).toBeInTheDocument();
  });

  it("renders a down arrow when direction is earlier", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1700, distanceRatio: 0.38, bucket: "orange", direction: "earlier" }]}
      />,
    );
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  it("renders no arrow when direction is match", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" }]}
      />,
    );
    expect(screen.queryByText("▲")).not.toBeInTheDocument();
    expect(screen.queryByText("▼")).not.toBeInTheDocument();
  });

  it("sets a localized aria-label per filled tile (Spanish)", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[{ year: 1500, distanceRatio: 0.21, bucket: "orange", direction: "later" }]}
      />,
    );
    expect(screen.getByLabelText("1500, muy temprano")).toBeInTheDocument();
  });

  it("sets a localized aria-label per filled tile (English)", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1700, distanceRatio: 0.38, bucket: "orange", direction: "earlier" }]}
      />,
    );
    expect(screen.getByLabelText("1700, too late")).toBeInTheDocument();
  });
});
