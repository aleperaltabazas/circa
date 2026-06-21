import { describe, it, expect, beforeEach } from "vitest";
import { load, save, EMPTY } from "../localStorage";

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe("localStorage boundary", () => {
  let storage: Storage;
  beforeEach(() => {
    storage = makeStorage();
  });

  it("load returns EMPTY when nothing is stored", () => {
    expect(load(storage)).toEqual(EMPTY);
  });

  it("load returns EMPTY when stored JSON is corrupt", () => {
    storage.setItem("circa", "not json{");
    expect(load(storage)).toEqual(EMPTY);
  });

  it("load returns EMPTY when schemaVersion does not match", () => {
    storage.setItem("circa", JSON.stringify({ schemaVersion: 999, foo: "bar" }));
    expect(load(storage)).toEqual(EMPTY);
  });

  it("save then load round-trips the data", () => {
    const data = { ...EMPTY, lastPlayedDate: "2026-06-19", stats: { currentStreak: 3, maxStreak: 7, lastWinDate: "2026-06-19" } };
    save(storage, data);
    expect(load(storage)).toEqual(data);
  });

  it("EMPTY has DEFAULT_LOCALE and schemaVersion 3", () => {
    expect(EMPTY.locale).toBe("es");
    expect(EMPTY.schemaVersion).toBe(3);
  });

  it("returns EMPTY when stored schemaVersion is 2", () => {
    storage.setItem("circa", JSON.stringify({ schemaVersion: 2, locale: "en" }));
    expect(load(storage)).toEqual(EMPTY);
  });

  it("returns EMPTY for unknown schema versions", () => {
    storage.setItem("circa", JSON.stringify({ schemaVersion: 999 }));
    expect(load(storage)).toEqual(EMPTY);
  });
});
