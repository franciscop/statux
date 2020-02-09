import Store, { useStore, useSelector, useActions } from "../index.js";

import "babel-polyfill";
import React, { memo } from "react";
import $ from "react-query-test";

// This extracts the state from the selector with the provided function
const Reader = ({ query = "count" }) => {
  const number = useSelector(query);
  return <div>{number}</div>;
};

// A button that triggers the update of the state
const Button = ({ action = count => count + 1 }) => {
  const setCount = useActions("count");
  return <button onClick={e => setCount(action)}>Click</button>;
};

describe("useStore()", () => {
  it("triggers updates from parents", async () => {
    const Counter = ({ query }) => {
      const [count, setCount] = useStore("count");
      return (
        <div onClick={e => setCount(count + 1)}>
          <Reader query={query} />
        </div>
      );
    };

    const fn = jest.fn(state => state.count);
    const $counter = $(<Store count={0} children={<Counter query={fn} />} />);
    expect($counter.html()).toBe("<div><div>0</div></div>");

    await $counter.click();
    expect($counter.html()).toBe("<div><div>1</div></div>");
  });

  it("starts the update from the parent so children are skipped", async () => {
    const Counter = ({ query }) => {
      const [count, setCount] = useStore("count");
      return (
        <div onClick={e => setCount(count + 1)}>
          {count === 0 ? <Reader query={query} /> : null}
        </div>
      );
    };

    const fn = jest.fn(state => state.count);
    const $counter = $(<Store count={0} children={<Counter query={fn} />} />);
    expect($counter.html()).toBe("<div><div>0</div></div>");

    await $counter.click();
    expect($counter.html()).toBe("<div></div>");
  });

  it("triggers updates from siblings", async () => {
    const Counter = ({ query, action }) => {
      const count = useSelector("count");
      return (
        <div>
          <Button action={action} />
          {count === 0 ? <Reader query={query} /> : null}
        </div>
      );
    };

    const query = jest.fn(state => state.count);
    const action = jest.fn(count => count + 1);
    const $counter = $(
      <Store count={0} children={<Counter query={query} action={action} />} />
    );
    expect($counter.html()).toBe(
      "<div><button>Click</button><div>0</div></div>"
    );

    await $counter.find("button").click();
    expect($counter.html()).toBe("<div><button>Click</button></div>");
  });
});
