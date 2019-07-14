// User.test.js - test nested properties and deep selectors
import Store, { useStore, useSelector } from "../index.js";

import "babel-polyfill";
import React from "react";
import $ from "./react-query";
import delay from "delay";

const baseUser = { id: 1, name: "John", friends: ["Maria"] };

const User = ({ onClick = () => {}, onMount = () => {} }) => {
  const [user, setUser] = useStore("user");
  return (
    <div onClick={e => onClick(user, setUser)}>{JSON.stringify(user)}</div>
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
      setUser(user => ({ ...user, name: "John" }));
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

  it("can assign the name", async () => {
    const user = { id: 1 };
    const onClick = (user, setUser) => setUser.assign({ name: "John" });
    const $user = $(<App user={user} onClick={onClick} />);
    expect($user.html()).toEqual(`<div>{"id":1}</div>`);
    await $user.click();
    expect($user.html()).toEqual(`<div>{"id":1,"name":"John"}</div>`);
    expect(user).toEqual({ id: 1 }); // No mutation check
  });
});
