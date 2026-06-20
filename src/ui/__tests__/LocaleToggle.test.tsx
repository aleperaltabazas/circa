import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleToggle } from "../LocaleToggle";

describe("LocaleToggle", () => {
  it("renders one option per locale with the active locale selected", () => {
    render(<LocaleToggle locale="es" onChange={() => {}} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("es");
    expect(screen.getByRole("option", { name: "ES" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "EN" })).toBeInTheDocument();
  });

  it("calls onChange with the new locale when the user selects it", async () => {
    const onChange = vi.fn();
    render(<LocaleToggle locale="es" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "en");
    expect(onChange).toHaveBeenCalledWith("en");
  });
});
