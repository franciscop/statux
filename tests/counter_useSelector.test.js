import Store, { useSelector, useStore, State } from "../index.js";

import "babel-polyfill";
import React from "react";
import $ from "./react-query";
import delay from "delay";

// We define and test a counter:
const Counter = () => {
  const count = useSelector(state => state.count);
  const { setCount } = useStore();
  const onClick = async e => setCount(count + 1);
  return <div onClick={onClick}>{count}</div>;
};

describe("statux", () => {
  it("should increment count", async () => {
    const $counter = $(
      <Store count={0}>
        <Counter />
      </Store>
    );

    expect($counter.html()).toBe(`<div>0</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
  });

  it("should increment multiple times", async () => {
    const $counter = $(
      <Store count={0}>
        <Counter />
      </Store>
    );

    expect($counter.html()).toBe(`<div>0</div>`);
    $counter.click();
    $counter.click();
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a callback", () => {
    const Counter = () => {
      const { count, setCount } = useStore();
      return <div onClick={e => setCount(num => num + 2)}>{count}</div>;
    };

    const $counter = $(
      <Store count={1}>
        <Counter />
      </Store>
    );

    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a prebuilt function", () => {
    const Counter = () => {
      const { count, setCount } = useStore();
      return <div onClick={e => setCount.add(2)}>{count}</div>;
    };

    const $counter = $(
      <Store count={1}>
        <Counter />
      </Store>
    );

    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a prebuilt function with a callback", () => {
    const Counter = () => {
      const { count, setCount } = useStore();
      return <div onClick={e => setCount.add(num => 2)}>{count}</div>;
    };

    const $counter = $(
      <Store count={1}>
        <Counter />
      </Store>
    );

    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a prebuilt function with a callback", () => {
    const Counter = () => {
      const { count, setCount } = useStore();
      return <div onClick={e => setCount.add(num => 2)}>{count}</div>;
    };

    const $counter = $(
      <Store count={1}>
        <Counter />
      </Store>
    );

    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use the Render Props", () => {
    const render = ({ count, setCount }) => (
      <div onClick={e => setCount.add(num => 2)}>{count}</div>
    );

    const $counter = $(
      <Store count={1}>
        <State render={render} />
      </Store>
    );

    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use the Render Props Children", () => {
    const render = ({ count, setCount }) => (
      <div onClick={e => setCount.add(num => 2)}>{count}</div>
    );

    const $counter = $(
      <Store count={1}>
        <State>{render}</State>
      </Store>
    );

    expect($counter.html()).toBe(`<div>1</div>`);
    $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });
});
