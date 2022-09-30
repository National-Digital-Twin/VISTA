import { IsEmpty } from "./index"

describe("should be truthy if empty", () => {
  it("should be false if populated array passed as parameter", () => {
    expect(IsEmpty([1, 2, 3])).toBeFalsy();
  });

  it("should be truthy if valid array is empty", () => {
    expect(IsEmpty([])).toBeTruthy();
  });

  it("should not falsy if string passed", () => {
    expect(IsEmpty("abc")).toBeFalsy();
  });

  it("should be falsy if string has no chars", () => {
    expect(IsEmpty("")).toBeTruthy();
  });

  it("should be truthy if empty object passed as parameter", () => {
    expect(IsEmpty({})).toBeTruthy();
  });

  it("should be falsy if non empty object passed as parameter", () => {
    expect(IsEmpty({ hi: "hi" })).toBeFalsy();
  });

  it("should be falsy if number passed in", () => {
    expect(IsEmpty(0)).toBeTruthy();
  });

  it("should be truthy if undefined passed in", () => {
    expect(IsEmpty()).toBeTruthy();
  });
});
