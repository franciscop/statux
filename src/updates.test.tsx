import { memo } from "react";
import $, { until } from "react-test";

const delay = (time: number) => new Promise((done) => setTimeout(done, time));

import Store, { useActions, useSelector, useStore } from "./";

// This extracts the state from the selector with the provided function
const Reader = ({ query = "count" }: { query?: any }) => {
  const number = useSelector(query);
  return <div>{number}</div>;
};

// A button that triggers the update of the state
const Button = ({
  action = (count: number) => count + 1,
}: {
  action?: any;
}) => {
  const setCount = useActions("count");
  return <button onClick={() => setCount(action)}>Click</button>;
};

describe("useStore()", () => {
  it("triggers updates from parents", async () => {
    const Counter = ({ query }: { query: any }) => {
      const [count, setCount] = useStore("count");
      return (
        <div onClick={() => setCount(count + 1)}>
          <Reader query={query} />
        </div>
      );
    };

    const fn = vi.fn((state: any) => state.count);
    const $counter = $(<Store count={0} children={<Counter query={fn} />} />);
    expect($counter.html()).toBe("<div><div>0</div></div>");

    await $counter.click();
    expect($counter.html()).toBe("<div><div>1</div></div>");
  });

  it("starts the update from the parent so children are skipped", async () => {
    const Counter = ({ query }: { query: any }) => {
      const [count, setCount] = useStore("count");
      return (
        <div onClick={() => setCount(count + 1)}>
          {count === 0 ? <Reader query={query} /> : null}
        </div>
      );
    };

    const fn = vi.fn((state: any) => state.count);
    const $counter = $(<Store count={0} children={<Counter query={fn} />} />);
    expect($counter.html()).toBe("<div><div>0</div></div>");

    await $counter.click();
    expect($counter.html()).toBe("<div></div>");
  });

  it("triggers updates from siblings", async () => {
    const Counter = ({ query, action }: { query: any; action: any }) => {
      const count = useSelector("count");
      return (
        <div>
          <Button action={action} />
          {count === 0 ? <Reader query={query} /> : null}
        </div>
      );
    };

    const query = vi.fn((state: any) => state.count);
    const action = vi.fn((count: any) => count + 1);
    const $counter = $(
      <Store count={0} children={<Counter query={query} action={action} />} />,
    );
    expect($counter.html()).toBe(
      "<div><button>Click</button><div>0</div></div>",
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
      const [, setTodo] = useStore("todo");
      const onClick = async () => {
        await delay(100);
        setTodo((todo: any[]) => todo.filter((it) => it.id !== 1));
      };
      return <button onClick={onClick}>Delete</button>;
    };
    const TodoItem = ({ id }: { id: number }) => {
      const text = useSelector(
        (state) => state.todo.find((it: any) => it.id === id).text,
      );
      return <li>{text}</li>;
    };
    const TodoList = () => {
      const todos = useSelector((state) => state.todo.map((it: any) => it.id));
      return (
        <ul>
          {todos.map((id: number) => (
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
      </Store>,
    );
    expect($todo.find("ul").html()).toBe(
      "<ul><li>abc</li><li>def</li><li>ghi</li></ul>",
    );
    await $todo.find("button").click();
    await until(
      () => $todo.find("ul").html() === "<ul><li>abc</li><li>ghi</li></ul>",
    );
    expect($todo.find("ul").html()).toBe("<ul><li>abc</li><li>ghi</li></ul>");
  });

  it("can delete items and catches the error even with memo", async () => {
    const init = [
      { id: 0, text: "abc" },
      { id: 1, text: "def" },
      { id: 2, text: "ghi" },
    ];
    const DeleteItem = memo(() => {
      const [, setTodo] = useStore("todo");
      const onClick = async () => {
        await delay(100);
        setTodo((todo: any[]) => todo.filter((it) => it.id !== 1));
      };
      return <button onClick={onClick}>Delete</button>;
    });
    const TodoItem = memo(({ id }: { id: number }) => {
      const text = useSelector(
        (state) => state.todo.find((it: any) => it.id === id).text,
      );
      return <li>{text}</li>;
    });
    const TodoList = memo(() => {
      const todos = useSelector((state) => state.todo.map((it: any) => it.id));
      return (
        <ul>
          {todos.map((id: number) => (
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
      </Store>,
    );
    expect($todo.find("ul").html()).toBe(
      "<ul><li>abc</li><li>def</li><li>ghi</li></ul>",
    );
    await $todo.find("button").click();
    await until(
      () => $todo.find("ul").html() === "<ul><li>abc</li><li>ghi</li></ul>",
    );
    expect($todo.find("ul").html()).toBe("<ul><li>abc</li><li>ghi</li></ul>");
  });
});
