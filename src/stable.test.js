import "babel-polyfill";
import React, { useEffect } from "react";
import $ from "react-test";

import Store, { useStore, useActions } from "./";

describe("is stable", () => {
  it("the root is stable", async () => {
    let eff = 0;
    let out = 0;

    const Counter = () => {
      const [state, setState] = useStore();
      out++;
      useEffect(() => {
        eff++;
      }, [setState]);
      const onClick = async (e) => setState({ count: state.count + 1 });
      return <div onClick={onClick}>{state.count}</div>;
    };

    const $counter = $(<Store count={0} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>2</div>`);
    expect(eff).toBe(1);
    expect(out).toBe(3);
  });

  it("a child state is stable", async () => {
    let eff = 0;
    let out = 0;

    const Counter = () => {
      const [count, setCount] = useStore("count");
      out++;
      useEffect(() => {
        eff++;
      }, [setCount]);
      const onClick = async (e) => setCount(count + 1);
      return <div onClick={onClick}>{count}</div>;
    };

    const $counter = $(<Store count={0} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>2</div>`);
    expect(eff).toBe(1);
    expect(out).toBe(3);
  });

  it("a grandchild state is stable", async () => {
    let eff = 0;
    let out = 0;

    const Counter = () => {
      const [count, setCount] = useStore("count.value");
      out++;
      useEffect(() => {
        eff++;
      }, [setCount]);
      const onClick = async (e) => setCount(count + 1);
      return <div onClick={onClick}>{count}</div>;
    };

    const $counter = $(<Store count={{ value: 0 }} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>2</div>`);
    expect(eff).toBe(1);
    expect(out).toBe(3);
  });

  it("useActions is stable", async () => {
    let eff = 0;
    let out = 0;

    const Counter = () => {
      const [{ count }] = useStore();
      const setState = useActions();
      out++;
      useEffect(() => {
        eff++;
      }, [setState]);
      const onClick = async (e) => setState({ count: count + 1 });
      return <div onClick={onClick}>{count}</div>;
    };

    const $counter = $(<Store count={0} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>2</div>`);
    expect(eff).toBe(1);
    expect(out).toBe(3);
  });

  it("useActions child is stable", async () => {
    let eff = 0;
    let out = 0;

    const Counter = () => {
      const [count] = useStore("count");
      const setCount = useActions("count");
      out++;
      useEffect(() => {
        eff++;
      }, [setCount]);
      const onClick = async (e) => setCount(count + 1);
      return <div onClick={onClick}>{count}</div>;
    };

    const $counter = $(<Store count={0} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>2</div>`);
    expect(eff).toBe(1);
    expect(out).toBe(3);
  });

  it("useActions grandchild is stable", async () => {
    let eff = 0;
    let out = 0;

    const Counter = () => {
      const [count] = useStore("count.value");
      const setCount = useActions("count.value");
      out++;
      useEffect(() => {
        eff++;
      }, [setCount]);
      const onClick = async (e) => setCount(count + 1);
      return <div onClick={onClick}>{count}</div>;
    };

    const $counter = $(<Store count={{ value: 0 }} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>2</div>`);
    expect(eff).toBe(1);
    expect(out).toBe(3);
  });
});
