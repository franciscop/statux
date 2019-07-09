// User.test.js - test nested properties and deep selectors
import Store, { useStore, useSelector } from "../index.js";

import "babel-polyfill";
import React from "react";
import $ from "./react-query";
import delay from "delay";

const baseUser = { id: 1, name: "John", friends: ["Maria"] };

describe("Disable mutations", () => {
  const User = ({ onClick }) => {
    const [user, setUser] = useStore("user");
    return (
      <div onClick={e => onClick(user)}>
        {user.id} - {user.name}
      </div>
    );
  };

  const cbError = async onClick => {
    const $user = $(
      <Store
        user={{ id: 1, name: "John", friends: [{ id: 2, name: "Maria" }] }}
        children={<User onClick={onClick} />}
      />
    );
    try {
      await $user.click();
      return false;
    } catch (error) {
      return error;
    }
  };

  it("throws when trying to change the id", async () => {
    const error = await cbError(user => {
      user.id = 2;
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property");
  });

  it("throws when trying to change the name", async () => {
    const error = await cbError(user => {
      user.name += "-san";
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property");
  });

  it("throws when trying to remove a property", async () => {
    const error = await cbError(user => {
      delete user.name;
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot delete property");
  });

  it("throws when trying to add a property", async () => {
    const error = await cbError(user => {
      user.age = 20;
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot add property");
  });

  it("throws when trying to mutate deeply", async () => {
    const error = await cbError(user => {
      user.friends[0].name = "Marta";
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property");
  });

  it("throws when trying to append deeply", async () => {
    const error = await cbError(user => {
      user.friends.push({ id: 3, name: "Peter" });
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot add property");
  });

  it("stays frozen after an iteration", async () => {
    const User = ({}) => {
      const [user, setUser] = useStore("user");
      const onClick = e => {
        if (user.name === "John") {
          return setUser({ id: 1, name: "Mark" });
        }
        expect(user).toMatchObject({ id: 1, name: "Mark" });
        user.id = 5;
      };
      return <div onClick={onClick} />;
    };

    const catcher = async () => {
      const $user = $(<Store user={{ name: "John" }} children={<User />} />);
      try {
        await $user.click();
        await $user.click();
        return false;
      } catch (error) {
        return error;
      }
    };

    const error = await catcher();
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property 'id'");
  });

  it("stays frozen after an iteration", async () => {
    const User = ({}) => {
      const [user, setUser] = useStore("user");
      const onClick = e =>
        setUser(user => {
          user.name = "Mark";
        });
      return <div onClick={onClick} />;
    };

    const catcher = async () => {
      const $user = $(<Store user={{ name: "John" }} children={<User />} />);
      try {
        await $user.click();
      } catch (error) {
        return error;
      }
    };

    const error = await catcher();
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property 'name'");
  });
});
