import "babel-polyfill";

import React from "react";
import $ from "react-test";

import Store, { useSelector, useStore } from "./";

const withError = (cb) => {
  const onError = jest.fn();
  const Component = () => {
    try {
      return cb();
    } catch (error) {
      onError(error);
    }
  };
  return [onError, Component];
};

describe("Error handling", () => {
  it("succeeds when the base is defined", async () => {
    const [onError, UserName] = withError(() => {
      const name = useSelector("user.name");
      return <div>{name}</div>;
    });

    const app = $(
      <Store user={{ name: "John" }}>
        <UserName />
      </Store>
    );

    expect(onError).not.toBeCalled();
    expect(app).toHaveHtml("<div>John</div>");
  });

  it("throws when the base is null with useSelector", async () => {
    const [onError, UserName] = withError(() => {
      const name = useSelector("user.name");
      return <div>{name}</div>;
    });

    $(
      <Store user={null}>
        <UserName />
      </Store>
    );

    expect(onError).toBeCalled();
    expect(onError).toBeCalledWith(
      new Error("Cannot read 'user.name' since 'user' is 'null'")
    );
  });

  it("throws when the base is null with useStore", async () => {
    const [onError, UserName] = withError(() => {
      const [name] = useStore("user.name");
      return <div>{name}</div>;
    });

    $(
      <Store user={null}>
        <UserName />
      </Store>
    );

    expect(onError).toBeCalled();
    expect(onError).toBeCalledWith(
      new Error("Cannot read 'user.name' since 'user' is 'null'")
    );
  });

  it("succeeds when there IS an item in the array", async () => {
    const [onError, UserName] = withError(() => {
      const name = useSelector("users.0.name");
      return <div>{name}</div>;
    });

    const app = $(
      <Store users={[{ name: "John" }]}>
        <UserName />
      </Store>
    );

    expect(onError).not.toBeCalled();
    expect(app).toHaveHtml("<div>John</div>");
  });

  it("throws there's no item in the array with useSelector", async () => {
    const [onError, UserName] = withError(() => {
      const name = useSelector("users.2.name");
      return <div>{name}</div>;
    });

    $(
      <Store users={[{ name: "John" }]}>
        <UserName />
      </Store>
    );

    expect(onError).toBeCalled();
    expect(onError).toBeCalledWith(
      new Error("Cannot read 'users.2.name' since 'users.2' is 'undefined'")
    );
  });

  it("throws there's no item in the array with useStore", async () => {
    const [onError, UserName] = withError(() => {
      const [name] = useStore("users.2.name");
      return <div>{name}</div>;
    });

    $(
      <Store users={[{ name: "John" }]}>
        <UserName />
      </Store>
    );

    expect(onError).toBeCalled();
    expect(onError).toBeCalledWith(
      new Error("Cannot read 'users.2.name' since 'users.2' is 'undefined'")
    );
  });
});
