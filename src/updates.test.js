import "babel-polyfill";
import React, { memo } from "react";
import $ from "react-test";

import Store, { useStore, useSelector, useActions } from "./";

const delay = (time) => new Promise((done) => setTimeout(done, time));

// This extracts the state from the selector with the provided function
const Reader = ({ query = "count" }) => {
  const number = useSelector(query);
  return <div>{number}</div>;
};

// A button that triggers the update of the state
const Button = ({ action = (count) => count + 1 }) => {
  const setCount = useActions("count");
  return <button onClick={(e) => setCount(action)}>Click</button>;
};

describe("useStore()", () => {
  it("triggers updates from parents", async () => {
    const Counter = ({ query }) => {
      const [count, setCount] = useStore("count");
      return (
        <div onClick={(e) => setCount(count + 1)}>
          <Reader query={query} />
        </div>
      );
    };

    const fn = jest.fn((state) => state.count);
    const $counter = $(<Store count={0} children={<Counter query={fn} />} />);
    expect($counter.html()).toBe("<div><div>0</div></div>");

    await $counter.click();
    expect($counter.html()).toBe("<div><div>1</div></div>");
  });

  it("starts the update from the parent so children are skipped", async () => {
    const Counter = ({ query }) => {
      const [count, setCount] = useStore("count");
      return (
        <div onClick={(e) => setCount(count + 1)}>
          {count === 0 ? <Reader query={query} /> : null}
        </div>
      );
    };

    const fn = jest.fn((state) => state.count);
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

    const query = jest.fn((state) => state.count);
    const action = jest.fn((count) => count + 1);
    const $counter = $(
      <Store count={0} children={<Counter query={query} action={action} />} />
    );
    expect($counter.html()).toBe(
      "<div><button>Click</button><div>0</div></div>"
    );

    await $counter.find("button").click();
    expect($counter.html()).toBe("<div><button>Click</button></div>");
  });

  it("can delete items and catches the error", async () => {
    const init = [
      { id: 0, text: "abc" },
      { id: 1, text: "def" },
      { id: 2, text: "ghi" },
    ];
    const DeleteItem = () => {
      const [todo, setTodo] = useStore("todo");
      const onClick = async () => {
        await delay(100);
        setTodo((todo) => todo.filter((it) => it.id !== 1));
      };
      return <button onClick={onClick}>Delete</button>;
    };
    const TodoItem = ({ id }) => {
      const text = useSelector(
        (state) => state.todo.find((it) => it.id === id).text
      );
      return <li>{text}</li>;
    };
    const TodoList = () => {
      const todos = useSelector((state) => state.todo.map((it) => it.id));
      return (
        <ul>
          {todos.map((id) => (
            <TodoItem key={id} id={id} />
          ))}
        </ul>
      );
    };
    const $todo = $(
      <Store todo={init}>
        <div>
          <DeleteItem />
          <TodoList />
        </div>
      </Store>
    );
    expect($todo.find("ul").html()).toBe(
      "<ul><li>abc</li><li>def</li><li>ghi</li></ul>"
    );
    await $todo.find("button").click();
    await $todo.delay(200);
    expect($todo.find("ul").html()).toBe("<ul><li>abc</li><li>ghi</li></ul>");
  });

  it("can delete items and catches the error even with memo", async () => {
    const init = [
      { id: 0, text: "abc" },
      { id: 1, text: "def" },
      { id: 2, text: "ghi" },
    ];
    const DeleteItem = memo(() => {
      const [todo, setTodo] = useStore("todo");
      const onClick = async () => {
        await delay(100);
        setTodo((todo) => todo.filter((it) => it.id !== 1));
      };
      return <button onClick={onClick}>Delete</button>;
    });
    const TodoItem = memo(({ id }) => {
      const text = useSelector(
        (state) => state.todo.find((it) => it.id === id).text
      );
      return <li>{text}</li>;
    });
    const TodoList = memo(() => {
      const todos = useSelector((state) => state.todo.map((it) => it.id));
      return (
        <ul>
          {todos.map((id) => (
            <TodoItem key={id} id={id} />
          ))}
        </ul>
      );
    });
    const $todo = $(
      <Store todo={init}>
        <div>
          <DeleteItem />
          <TodoList />
        </div>
      </Store>
    );
    expect($todo.find("ul").html()).toBe(
      "<ul><li>abc</li><li>def</li><li>ghi</li></ul>"
    );
    await $todo.find("button").click();
    await $todo.delay(200);
    expect($todo.find("ul").html()).toBe("<ul><li>abc</li><li>ghi</li></ul>");
  });
});
