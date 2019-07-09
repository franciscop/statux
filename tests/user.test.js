// User.test.js - test nested properties and deep selectors
import Store, { useStore, useSelector } from "../index.js";

import "babel-polyfill";
import React from "react";
import $ from "./react-query";
import delay from "delay";

const baseUser = { id: 1, name: "John", friends: ["Maria"] };

describe("User", () => {
  const User = () => {
    const [name, setName] = useStore("user.name");
    const [bestFriend, setBestFriend] = useStore("user.friends.0");
    return (
      <div onClick={e => setBestFriend("Mark")}>
        Hi {bestFriend} - {name}
      </div>
    );
  };

  it("should have a items", async () => {
    const $user = $(<Store user={baseUser} children={<User />} />);
    expect($user.html()).toEqual("<div>Hi Maria - John</div>");
    await $user.click();
    expect($user.html()).toEqual("<div>Hi Mark - John</div>");
  });
});
