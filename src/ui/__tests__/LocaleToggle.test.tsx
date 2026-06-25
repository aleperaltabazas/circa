import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleToggle } from "../LocaleToggle";
import { LOCALES } from "../../i18n/types";

describe("LocaleToggle", () => {
  it("renders one option per active locale with the active locale selected", () => {
    render(<LocaleToggle locale="es" onChange={() => {}} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("es");
    for (const loc of LOCALES) {
      expect(screen.getByRole("option", { name: loc.toUpperCase() })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("option")).toHaveLength(LOCALES.length);
  });
});
