import $ from "react-test";

import Store, { useStore } from "./";

const baseUser = { id: 1, name: "John", friends: [{ id: 2, name: "Maria" }] };

const User = ({
  onClick,
  onError,
}: {
  onClick: (user: any) => void;
  onError: (err: any) => void;
}) => {
  const [user] = useStore("user");
  return (
    <div
      onClick={() => {
        try {
          onClick(user);
        } catch (error) {
          onError(error);
        }
      }}
    >
      {user.id} - {user.name}
    </div>
  );
};

const mutate = async (onClick: (user: any) => void) => {
  let error: any;
  const onError = (err: any) => (error = err);
  const $user = $(
    <Store user={baseUser}>
      <User onClick={onClick} onError={onError} />
    </Store>,
  );
  await $user.click();
  return error;
};

describe("Disable mutations", () => {
  it("throws when trying to change the id", async () => {
    const error = await mutate((user) => {
      user.id = 2;
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property");
    expect(baseUser.id).toBe(1);
  });

  it("throws when trying to change the name", async () => {
    const error = await mutate((user) => {
      user.name += "-san";
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property");
    expect(baseUser.name).toBe("John");
  });

  it("throws when trying to remove a property", async () => {
    const error = await mutate((user) => {
      delete user.name;
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot delete property");
    expect(baseUser.name).toBe("John");
  });

  it("throws when trying to add a property", async () => {
    const error = await mutate((user) => {
      user.age = 20;
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot add property");
    expect((baseUser as any).age).toBe(undefined);
  });

  it("throws when trying to mutate deeply", async () => {
    const error = await mutate((user) => {
      user.friends[0].name = "Marta";
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property");
    expect(baseUser.friends[0].name).toBe("Maria");
  });

  it("throws when trying to append deeply", async () => {
    const error = await mutate((user) => {
      user.friends.push({ id: 3, name: "Peter" });
    });
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot add property");
    expect(baseUser.friends.length).toBe(1);
  });

  it("stays frozen after an iteration", async () => {
    const User = ({ onError }: { onError: (err: any) => void }) => {
      const [user, setUser] = useStore("user");
      const onClick = () => {
        try {
          if (user.name === "John") {
            return setUser({ id: 1, name: "Mark" });
          }
          user.id = 5;
        } catch (error) {
          onError(error);
        }
      };
      return <div onClick={onClick} />;
    };

    const catcher = async () => {
      let error: any;
      const $user = $(
        <Store user={{ name: "John" }}>
          <User onError={(err) => (error = err)} />
        </Store>,
      );
      await $user.click();
      await $user.click();
      return error;
    };

    const error = await catcher();
    expect(error).toBeTruthy();
    expect(error.name).toBe("TypeError");
    expect(error.message).toMatch("Cannot assign to read only property 'id'");
  });
});
