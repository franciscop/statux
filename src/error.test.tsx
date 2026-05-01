import $ from "react-test";

import Store, { useSelector, useStore } from "./";

describe("Error handling", () => {
  it("succeeds when the base is defined", () => {
    const UserName = () => <div>{useSelector("user.name")}</div>;
    const app = $(
      <Store user={{ name: "John" }}>
        <UserName />
      </Store>,
    );
    expect(app).not.toHaveError();
    expect(app).toHaveHtml("<div>John</div>");
  });

  it("throws when the base is null with useSelector", () => {
    const UserName = () => <div>{useSelector("user.name")}</div>;
    expect(
      $(
        <Store user={null}>
          <UserName />
        </Store>,
      ),
    ).toHaveError("Cannot read 'user.name' since 'user' is 'null'");
  });

  it("throws when the base is null with useStore", () => {
    const UserName = () => {
      const [name] = useStore("user.name");
      return <div>{name}</div>;
    };
    expect(
      $(
        <Store user={null}>
          <UserName />
        </Store>,
      ),
    ).toHaveError("Cannot read 'user.name' since 'user' is 'null'");
  });

  it("succeeds when there IS an item in the array", () => {
    const UserName = () => <div>{useSelector("users.0.name")}</div>;
    const app = $(
      <Store users={[{ name: "John" }]}>
        <UserName />
      </Store>,
    );
    expect(app).not.toHaveError();
    expect(app).toHaveHtml("<div>John</div>");
  });

  it("throws there's no item in the array with useSelector", () => {
    const UserName = () => <div>{useSelector("users.2.name")}</div>;
    expect(
      $(
        <Store users={[{ name: "John" }]}>
          <UserName />
        </Store>,
      ),
    ).toHaveError("Cannot read 'users.2.name' since 'users.2' is 'undefined'");
  });

  it("throws there's no item in the array with useStore", () => {
    const UserName = () => {
      const [name] = useStore("users.2.name");
      return <div>{name}</div>;
    };
    expect(
      $(
        <Store users={[{ name: "John" }]}>
          <UserName />
        </Store>,
      ),
    ).toHaveError("Cannot read 'users.2.name' since 'users.2' is 'undefined'");
  });
});
