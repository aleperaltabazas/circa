import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hints } from "../Hints";

describe("Hints", () => {
  it("shows the first N hints and locks the rest with the given lockedLabel", () => {
    render(<Hints hints={["h1", "h2", "h3", "h4", "h5"]} revealed={2} lockedLabel="LOCKED-MARKER" />);
    expect(screen.getByText("h1")).toBeInTheDocument();
    expect(screen.getByText("h2")).toBeInTheDocument();
    expect(screen.queryByText("h3")).not.toBeInTheDocument();
    expect(screen.getAllByText("LOCKED-MARKER")).toHaveLength(3);
  });
});
