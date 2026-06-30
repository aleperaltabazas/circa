import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuessInput } from "../GuessInput";

describe("GuessInput", () => {
  it("calls onSubmit with the parsed year (Spanish)", async () => {
    const onSubmit = vi.fn();
    render(<GuessInput era="modern" currentYear={2026} disabled={false} guessedYears={[]} locale="es" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole("spinbutton"), "1571");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    expect(onSubmit).toHaveBeenCalledWith(1571);
  });

  it("displays the Spanish range hint", () => {
    render(<GuessInput era="modern" currentYear={2026} disabled={false} guessedYears={[]} locale="es" onSubmit={() => {}} />);
    expect(screen.getByText(/Ingresá un año entre 1453 y 1788/)).toBeInTheDocument();
  });

  it("shows an error and does not submit when the year was already guessed", async () => {
    const onSubmit = vi.fn();
    render(<GuessInput era="modern" currentYear={2026} disabled={false} guessedYears={[1571]} locale="es" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole("spinbutton"), "1571");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Ya intentaste ese año")).toBeInTheDocument();
  });

  it("disables the form when disabled", () => {
    render(<GuessInput era="modern" currentYear={2026} disabled={true} guessedYears={[]} locale="es" onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /adivinar/i })).toBeDisabled();
    expect(screen.getByRole("spinbutton")).toBeDisabled();
  });
});
