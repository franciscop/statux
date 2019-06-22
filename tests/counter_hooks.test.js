import Store, { useSelector, useActions, State } from "../index.js";

import "babel-polyfill";
import React from "react";
import $ from "./react-query";
import delay from "delay";

// We define and test a counter:
const Counter = () => {
  const count = useSelector(state => state.count);
  const setCount = useActions("count");
  const onClick = async e => setCount(count + 1);
  return <div onClick={onClick}>{count}</div>;
};

describe("statux", () => {
  it("should increment count", async () => {
    const $counter = $(<Store count={0} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
  });

  it("should increment multiple times", async () => {
    const $counter = $(<Store count={0} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    $counter.click();
    $counter.click();
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use dot notation", () => {
    const Counter = () => {
      const count = useSelector("count");
      const setCount = useActions("count");
      return <div onClick={e => setCount(num => num + 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a callback", () => {
    const Counter = () => {
      const count = useSelector(state => state.count);
      const setCount = useActions("count");
      return <div onClick={e => setCount(num => num + 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use async with a callback", async () => {
    const Counter = () => {
      const count = useSelector(state => state.count);
      const setCount = useActions("count");
      return <div onClick={e => setCount(async num => num + 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    await delay(100);
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a prebuilt function", () => {
    const Counter = () => {
      const count = useSelector(state => state.count);
      const { add } = useActions("count");
      return <div onClick={e => add(2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a prebuilt function with a callback", () => {
    const Counter = () => {
      const count = useSelector(state => state.count);
      const { add } = useActions("count");
      return <div onClick={e => add(num => 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a prebuilt function with a promise", async () => {
    const Counter = () => {
      const count = useSelector(state => state.count);
      const { add } = useActions("count");
      return <div onClick={e => add(Promise.resolve(2))}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a prebuilt function with an async callback", async () => {
    const Counter = () => {
      const count = useSelector(state => state.count);
      const { add } = useActions("count");
      return <div onClick={e => add(async () => 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });
});
