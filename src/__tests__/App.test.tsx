import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-20T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App", () => {
  it("renders the board for today's puzzle in Spanish by default", async () => {
    render(<App />);
    expect(await screen.findByText(/Circa/i)).toBeInTheDocument();
    expect(screen.getByText("moderna")).toBeInTheDocument();
    expect(screen.getByText(/imperio otomano/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /adivinar/i })).toBeInTheDocument();
  });

  it("reveals the next hint after a wrong guess (Spanish)", async () => {
    render(<App />);
    await screen.findByText(/imperio otomano/i);
    await userEvent.type(screen.getByRole("spinbutton"), "1500");
    await userEvent.click(screen.getByRole("button", { name: /adivinar/i }));
    expect(screen.getByText(/imperio bizantino/i)).toBeInTheDocument();
    expect(screen.getByText("1500")).toBeInTheDocument();
  });

  it("switches the UI language when the locale toggle changes", async () => {
    render(<App />);
    await screen.findByText(/imperio otomano/i);
    await userEvent.selectOptions(screen.getByRole("combobox"), "en");
    expect(screen.getByText(/Ottoman empire/i)).toBeInTheDocument();
    expect(screen.getByText("modern")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guess/i })).toBeInTheDocument();
  });
});
