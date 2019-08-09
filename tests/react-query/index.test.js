import React, { useState } from "react";
import $ from ".";
import "babel-polyfill";

const Counter = ({ children }) => {
  const [counter, setCounter] = useState(0);
  const increment = () => setCounter(counter + 1);
  return (
    <div onClick={increment}>
      {children}
      {counter}
    </div>
  );
};

describe("react-query", () => {
  it("can render to HTML", async () => {
    const $test = $(<Counter />);
    expect($test.html()).toEqual(`<div>0</div>`);
  });

  it("can click on the counter", async () => {
    const $test = $(<Counter />);
    expect($test.html()).toEqual(`<div>0</div>`);
    await $test.click();
    expect($test.html()).toEqual(`<div>1</div>`);
    await $test.click();
    expect($test.html()).toEqual(`<div>2</div>`);
  });

  it("can attach and click on children", async () => {
    const mock = jest.fn();
    const $test = $(
      <div>
        <div onClick={mock} />
      </div>
    );
    expect(mock).not.toBeCalled();
    await $test.click("children.0");
    expect(mock).toBeCalled();
  });

  it("will bubble up", async () => {
    const mock = jest.fn();
    const $test = $(
      <div onClick={mock}>
        <div>Hi</div>
      </div>
    );
    expect(mock).not.toBeCalled();
    await $test.click("children.0");
    expect(mock).toBeCalled();
  });

  it("won't throw when clicking on unfound children", async () => {
    const mock = jest.fn();
    const $test = $(
      <div>
        <div onClick={mock}>Hi</div>
      </div>
    );
    expect(mock).not.toBeCalled();
    await $test.click("children.1");
    expect(mock).not.toBeCalled();
    await $test.click("children.0");
    expect(mock).toBeCalled();
  });

  it("won't throw when clicking on children with no props", async () => {
    const mock = jest.fn();
    const $test = $(
      <div>
        <div onClick={mock}>Hi</div>
      </div>
    );
    expect(mock).not.toBeCalled();
    await $test.click("children");
    expect(mock).not.toBeCalled();
    await $test.click("children.0");
    expect(mock).toBeCalled();
  });

  it("won't throw when clicking on children with no onClick", async () => {
    const $test = $(
      <div>
        <div>Hi</div>
      </div>
    );
    await $test.click();
    await $test.click("children.1");
  });
});
