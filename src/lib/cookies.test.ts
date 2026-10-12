import { beforeEach, describe, expect, it } from "vitest";
import { clearCredentials, hasCredentials, loadCredentials, saveCredentials } from "./cookies";

describe("cookies credentials", () => {
  beforeEach(() => {
    // jsdom cookie jar
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0]?.trim();
      if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
    });
  });

  it("saves and loads credentials per messenger", () => {
    saveCredentials("max", {
      apiUrl: "https://1100.api.green-api.com",
      idInstance: "1100",
      apiTokenInstance: "token-max",
    });
    expect(hasCredentials("max")).toBe(true);
    expect(hasCredentials("telegram")).toBe(false);
    expect(loadCredentials("max")).toEqual({
      apiUrl: "https://1100.api.green-api.com",
      idInstance: "1100",
      apiTokenInstance: "token-max",
    });
  });

  it("clears credentials", () => {
    saveCredentials("telegram", {
      apiUrl: "https://4100.api.green-api.com",
      idInstance: "4100",
      apiTokenInstance: "tok",
    });
    clearCredentials("telegram");
    expect(loadCredentials("telegram")).toBeNull();
  });
});
