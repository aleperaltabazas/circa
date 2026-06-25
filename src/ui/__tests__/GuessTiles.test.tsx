import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuessTiles } from "../GuessTiles";

describe("GuessTiles", () => {
  it("renders 5 tiles, filling submitted guesses and leaving the rest empty", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[
          { year: 1500, distanceRatio: 0.21, bucket: "mid", direction: "later" },
          { year: 1600, distanceRatio: 0.08, bucket: "mid", direction: "earlier" },
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
        guesses={[{ year: 1500, distanceRatio: 0.21, bucket: "mid", direction: "later" }]}
      />,
    );
    expect(screen.getByText("▲")).toBeInTheDocument();
  });

  it("renders a down arrow when direction is earlier", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1700, distanceRatio: 0.38, bucket: "far", direction: "earlier" }]}
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
        guesses={[{ year: 1500, distanceRatio: 0.21, bucket: "mid", direction: "later" }]}
      />,
    );
    expect(screen.getByLabelText("1500, muy temprano")).toBeInTheDocument();
  });

  it("sets a localized aria-label per filled tile (English)", () => {
    render(
      <GuessTiles
        locale="en"
        guesses={[{ year: 1700, distanceRatio: 0.38, bucket: "far", direction: "earlier" }]}
      />,
    );
    expect(screen.getByLabelText("1700, too late")).toBeInTheDocument();
  });

  it("renders an absolute closeness hint pill on the first guess", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[{ year: 1500, distanceRatio: 0.40, bucket: "far", direction: "later" }]}
      />,
    );
    // 0.40 > 0.25 → "tooFar" → es label "muy lejos"
    expect(screen.getByText("muy lejos")).toBeInTheDocument();
  });

  it("renders 'closer' when the new guess is nearer than the previous", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[
          { year: 1500, distanceRatio: 0.40, bucket: "far", direction: "later" },
          { year: 1550, distanceRatio: 0.10, bucket: "mid", direction: "later" },
        ]}
      />,
    );
    expect(screen.getByText("más cerca")).toBeInTheDocument();
  });

  it("renders 'wentTooFar' when the new guess is farther than the previous", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[
          { year: 1550, distanceRatio: 0.10, bucket: "mid", direction: "later" },
          { year: 1400, distanceRatio: 0.50, bucket: "far", direction: "later" },
        ]}
      />,
    );
    expect(screen.getByText("te alejaste")).toBeInTheDocument();
  });

  it("renders 'so close!' override when within 3% even on a first guess", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[{ year: 1573, distanceRatio: 0.02, bucket: "close", direction: "later" }]}
      />,
    );
    expect(screen.getByText("¡por poco!")).toBeInTheDocument();
  });

  it("does not render a pill for a perfect guess", () => {
    render(
      <GuessTiles
        locale="es"
        guesses={[{ year: 1571, distanceRatio: 0, bucket: "perfect", direction: "match" }]}
      />,
    );
    // No closeness-hint text should appear for the perfect tile
    expect(screen.queryByText("muy lejos")).not.toBeInTheDocument();
    expect(screen.queryByText("cerca")).not.toBeInTheDocument();
    expect(screen.queryByText("muy cerca")).not.toBeInTheDocument();
    expect(screen.queryByText("¡por poco!")).not.toBeInTheDocument();
    expect(screen.queryByText("más cerca")).not.toBeInTheDocument();
    expect(screen.queryByText("te alejaste")).not.toBeInTheDocument();
  });
});
