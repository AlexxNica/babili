jest.autoMockOff();

const babel = require("babel-core");
const unpad = require("../../../utils/unpad");

function transform(code) {
  return babel.transform(code, {
    plugins: [require("../src/index")]
  }).code;
}

describe("constant-folding-plugin", () => {
  it("should evaluate some expressions", () => {
    const source = unpad(
      `
      "a" + "b"
      2 * 3;
      1/3;
      4 | 3;
      a(), b();
      var x = 1;
      foo(x);
      "b" + a + "c" + "d" + g + z + "f" + "h" + "z"
    `
    );

    const expected = unpad(
      `
      "ab";
      6;
      1 / 3;
      7;
      a(), b();
      var x = 1;
      foo(x);
      "b" + a + "cd" + g + z + "fhz";
    `
    );
    expect(transform(source)).toBe(expected);
  });

  it("should skip -0", () => {
    const source = unpad(
      `
      -0;
      +-0;
      +0;
    `
    );

    const expected = unpad(
      `
      -0;
      -0;
      0;
    `
    );
    expect(transform(source)).toBe(expected);
  });

  it("should handle runtime errors", () => {
    const source = unpad(
      `
      try {
        x({
          toString: 0
        } + '');
      } catch (e) {}
    `
    );
    expect(transform(source)).toBe(source);
  });

  it("should handle script escape", () => {
    const source = unpad(
      `
      "</" + "script"
    `
    );

    const expected = unpad(
      `
      "<\\\\/script";
    `
    );
    expect(transform(source)).toBe(expected);
  });

  it("should handle style escape", () => {
    const source = unpad(
      `
      "</" + "style"
    `
    );

    const expected = unpad(
      `
      "<\\\\/style";
    `
    );
    expect(transform(source)).toBe(expected);
  });

  it("should handle html comment escape", () => {
    const source = unpad(
      `
      "<!" + "--"
    `
    );

    const expected = unpad(
      `
      "\\\\x3C!--";
    `
    );
    expect(transform(source)).toBe(expected);
  });
});
