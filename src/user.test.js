import "babel-polyfill";
import React from "react";
import $ from "react-test";

import Store, { useStore, useSelector } from "./";

const delay = (time) => new Promise((done) => setTimeout(done, time));
const baseUser = { id: 1, name: "John", friends: ["Maria"] };

const User = ({ onClick = () => {}, onMount = () => {} }) => {
  const [user, setUser] = useStore("user");
  return (
    <div onClick={(e) => onClick(user, setUser)}>{JSON.stringify(user)}</div>
  );
};

const App = ({ user = {}, children, ...props }) => (
  <Store user={user} children={children || <User {...props} />} />
);

describe("User", () => {
  it("should be empty by default", () => {
    const $user = $(<App />);
    expect($user.html()).toEqual("<div>{}</div>");
  });

  it("can set the name", async () => {
    const user = {};
    const onClick = (user, setUser) => setUser({ name: "John" });
    const $user = $(<App user={user} onClick={onClick} />);
    expect($user.html()).toEqual(`<div>{}</div>`);
    await $user.click();
    expect($user.html()).toEqual(`<div>{"name":"John"}</div>`);
    expect(user).toEqual({}); // No mutation check
  });

  it("can set the name with a callback", async () => {
    const user = { id: 1 };
    const onClick = (_, setUser) => {
      setUser((user) => ({ ...user, name: "John" }));
    };
    const $user = $(<App user={user} onClick={onClick} />);
    expect($user.html()).toEqual(`<div>{"id":1}</div>`);
    await $user.click();
    expect($user.html()).toEqual(`<div>{"id":1,"name":"John"}</div>`);
    expect(user).toEqual({ id: 1 }); // No mutation check
  });

  it("can set the name besides other props", async () => {
    const user = { id: 1 };
    const onClick = (user, setUser) => setUser({ ...user, name: "John" });
    const $user = $(<App user={user} onClick={onClick} />);
    expect($user.html()).toEqual(`<div>{"id":1}</div>`);
    await $user.click();
    expect($user.html()).toEqual(`<div>{"id":1,"name":"John"}</div>`);
    expect(user).toEqual({ id: 1 }); // No mutation check
  });

  describe("objects", () => {
    it("can assign the name", async () => {
      const user = { id: 1 };
      const onClick = (user, setUser) => setUser.assign({ name: "John" });
      const $user = $(<App user={user} onClick={onClick} />);
      expect($user.html()).toEqual(`<div>{"id":1}</div>`);
      await $user.click();
      expect($user.html()).toEqual(`<div>{"id":1,"name":"John"}</div>`);
      expect(user).toEqual({ id: 1 }); // No mutation check
    });

    it("can remove the name", async () => {
      const user = { id: 1, name: "Martha" };
      const onClick = (user, setUser) => setUser.remove("name");
      const $user = $(<App user={user} onClick={onClick} />);
      expect($user.html()).toEqual(`<div>{"id":1,"name":"Martha"}</div>`);
      await $user.click();
      expect($user.html()).toEqual(`<div>{"id":1}</div>`);
      expect(user).toEqual({ id: 1, name: "Martha" }); // No mutation check
    });

    it("should only trigger that prop listener", async () => {
      let i = 0;
      const SetName = ({ children }) => {
        const [name, setName] = useStore("user.name");
        return <div onClick={(e) => setName("test")}>{children}</div>;
      };
      const UserName = ({ onClick = () => {}, onMount = () => {} }) => {
        const name = useSelector("user.name");
        return name;
      };
      const UserAge = ({ onClick = () => {}, onMount = () => {} }) => {
        const age = useSelector("user.age");
        i++;
        return `${age} - ${i}`;
      };

      const user = { id: 1, age: 10, name: "Francisco" };
      const onClick = (user, setUser) => setUser({ ...user, name: "John" });
      const $user = $(
        <App user={user} onClick={onClick}>
          <SetName>
            <UserName /> - <UserAge />
          </SetName>
        </App>
      );
      expect($user.html()).toEqual(`<div>Francisco - 10 - 1</div>`);
      await delay(100);
      await $user.click();
      await delay(100);
      expect($user.html()).toEqual(`<div>test - 10 - 1</div>`);
      expect(user).toEqual({ id: 1, age: 10, name: "Francisco" }); // No mutation check
    });
  });

  it("correctly diffs the state", async () => {
    let i = 0;
    const SetName = ({ children }) => {
      i++;
      const [name, setName] = useStore("user.name");
      const toggle = () => setName(name === "test" ? "Francisco" : "test");
      return (
        <div onClick={toggle}>
          {name} - {i}
        </div>
      );
    };

    const user = { name: "Francisco" };
    const $user = $(
      <App user={user}>
        <SetName />
      </App>
    );
    expect($user.html()).toEqual(`<div>Francisco - 1</div>`);
    await delay(100);
    await $user.click();
    await delay(100);
    expect($user.html()).toEqual(`<div>test - 2</div>`);
    await delay(100);
    await $user.click();
    await delay(100);
    expect($user.html()).toEqual(`<div>Francisco - 3</div>`);
  });
});
