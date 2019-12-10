import Store, { useStore, useSelector, useActions } from "../index.js";

import "babel-polyfill";
import React from "react";
import $ from "./react-query";
import delay from "delay";

describe("useStore()", () => {
  // We define and test a counter:
  const Counter = () => {
    const [{ count, ...state }, setState] = useStore();
    const onClick = async e => setState({ ...state, count: count + 1 });
    return <div onClick={onClick}>{count}</div>;
  };

  it("should increment count", async () => {
    const $counter = $(<Store count={0} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>1</div>`);
  });

  it("should increment multiple times", async () => {
    const $counter = $(<Store count={0} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>0</div>`);
    await $counter.click();
    await $counter.click();
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use dot notation", async () => {
    const Counter = () => {
      const count = useSelector("count");
      const setCount = useActions("count");
      return <div onClick={e => setCount(num => num + 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can do it twice", async () => {
    const Counter = () => {
      const count = useSelector("count");
      const setCount = useActions("count");
      return (
        <div
          onClick={e => {
            setCount(num => num + 1);
            setCount(num => num + 1);
          }}
        >
          {count}
        </div>
      );
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use a callback", async () => {
    const Counter = () => {
      const [count, setCount] = useStore("count");
      return <div onClick={e => setCount(num => num + 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it("can use async with a callback", async () => {
    const Counter = () => {
      const [count, setCount] = useStore("count");
      return <div onClick={e => setCount(async num => num + 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });
});

describe("useStore() prebuilt functions", () => {
  it("can use a prebuilt function", async () => {
    const Counter = () => {
      const [count, { add }] = useStore("count");
      return <div onClick={e => add(2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it.skip("can use a prebuilt function with a promise", async () => {
    const Counter = () => {
      const [count, { add }] = useStore("count");
      return <div onClick={e => add(num => Promise.resolve(2))}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it.skip("can use a prebuilt function with a callback", async () => {
    const Counter = () => {
      const [count, { add }] = useStore("count");
      return <div onClick={e => add(num => 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it.skip("can use a prebuilt function with an async callback", async () => {
    const Counter = () => {
      const [count, { add }] = useStore("count");
      return <div onClick={e => add(Promise.resolve(2))}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });
});

describe("useSelector() and useActions()", () => {
  it("can use a prebuilt function", async () => {
    const Counter = () => {
      const count = useSelector(state => state.count);
      const { add } = useActions("count");
      return <div onClick={e => add(2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it.skip("can use a prebuilt function with a callback", async () => {
    const Counter = () => {
      const count = useSelector(state => state.count);
      const { add } = useActions("count");
      return <div onClick={e => add(num => 2)}>{count}</div>;
    };
    const $counter = $(<Store count={1} children={<Counter />} />);
    expect($counter.html()).toBe(`<div>1</div>`);
    await $counter.click();
    expect($counter.html()).toBe(`<div>3</div>`);
  });

  it.skip("can use a prebuilt function with a promise", async () => {
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

  it.skip("can use a prebuilt function with an async callback", async () => {
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
