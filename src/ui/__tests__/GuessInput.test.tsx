import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuessInput } from "../GuessInput";

describe("GuessInput", () => {
  it("calls onSubmit with the parsed year", async () => {
    const onSubmit = vi.fn();
    render(<GuessInput era="modern" currentYear={2026} disabled={false} onSubmit={onSubmit} />);
    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "1571");
    await userEvent.click(screen.getByRole("button", { name: /guess/i }));
    expect(onSubmit).toHaveBeenCalledWith(1571);
  });

  it("displays the era range hint", () => {
    render(<GuessInput era="modern" currentYear={2026} disabled={false} onSubmit={() => {}} />);
    expect(screen.getByText(/1453.*1788/)).toBeInTheDocument();
  });

  it("disables the form when disabled", () => {
    render(<GuessInput era="modern" currentYear={2026} disabled={true} onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /guess/i })).toBeDisabled();
    expect(screen.getByRole("spinbutton")).toBeDisabled();
  });
});
