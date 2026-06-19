import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

beforeEach(() => {
  window.localStorage.clear();
  // Pin "today" to a date present in schedule.json.
  // Use fake timers only long enough to set the system clock, then restore
  // real timers so RTL's findBy* polling (setTimeout-based) is not frozen.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-19T15:00:00Z"));
  vi.useRealTimers();
});

describe("App", () => {
  it("renders the board for today's puzzle", async () => {
    render(<App />);
    expect(await screen.findByText(/Daily Year/i)).toBeInTheDocument();
    expect(screen.getByText("modern")).toBeInTheDocument();
    expect(screen.getByText(/Ottoman/i)).toBeInTheDocument();
  });

  it("reveals the next hint after a wrong guess", async () => {
    render(<App />);
    await screen.findByText(/Ottoman/i);
    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "1500");
    await userEvent.click(screen.getByRole("button", { name: /guess/i }));
    expect(screen.getByText(/Byzantine/i)).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
  });
});
