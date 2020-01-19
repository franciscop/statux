import Store, { useStore, useSelector, useActions } from "../index.js";

import "babel-polyfill";
import React from "react";
import $ from "react-query-test";

describe("useStore()", () => {
  it("should not trigger a selector with 1", async () => {
    const SubCount = ({ ren }) => {
      // 1 subscription
      const number = useSelector(state => {
        // console.log("Selector", state);
        ren(state);
        return state.count;
      });
      return <div>{number}</div>;
    };

    const Counter = ({ ren }) => {
      // 2 subscriptions
      const [{ count, ...state }, setState] = useStore();
      const onClick = async e => setState({ ...state, count: count + 1 });
      return (
        <div onClick={onClick}>
          {count === 0 ? <SubCount ren={ren} /> : null}
        </div>
      );
    };

    const fn = jest.fn();
    const $counter = $(<Store count={0} children={<Counter ren={fn} />} />);
    await $counter.click();
    for (let args of fn.mock.calls) {
      expect(args).toEqual([{ count: 0 }]);
    }
    expect($counter.html()).toBe("<div></div>");
  });

  it("should trigger an update from the selector", async () => {
    const SubCount = ({ ren }) => {
      // 1 subscription
      const number = useSelector(state => {
        ren(state);
        return state.count;
      });
      return <div>{number}</div>;
    };

    const Counter = ({ ren }) => {
      // 2 subscriptions
      const [{ count, ...state }, setState] = useStore();
      const onClick = async e => setState({ ...state, count: count + 1 });
      return (
        <div onClick={onClick}>
          <SubCount ren={ren} />
        </div>
      );
    };

    const fn = jest.fn();
    const $counter = $(<Store count={0} children={<Counter ren={fn} />} />);
    await $counter.click();
    expect(fn.mock.calls).toEqual([[{ count: 0 }], [{ count: 1 }]]);
    expect($counter.html()).toBe("<div><div>1</div></div>");
  });
});
