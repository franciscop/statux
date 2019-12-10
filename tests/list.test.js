import Store, { useActions, useStore, useSelector } from "../index.js";

import "babel-polyfill";
import React, { useEffect } from "react";
import $ from "./react-query";
import delay from "delay";

// The HTML list; we're not testing this, just a helper
const DisplayList = ({ items, onClick }) => (
  <ul onClick={onClick}>
    {items.map((item, i) => (
      <li key={i + "-" + item}>{item}</li>
    ))}
  </ul>
);

// We define and test a items:
const List = ({ onClick = () => {}, onMount = () => {} }) => {
  const [items, setItems] = useStore("items");
  useEffect(() => {
    onMount(items, setItems);
  }, []);
  return <DisplayList items={items} onClick={e => onClick(items, setItems)} />;
};

const App = ({ items = [], children, ...props }) => (
  <Store items={items} children={children || <List {...props} />} />
);

describe("List", () => {
  it("should have no items by default", () => {
    const $list = $(<App />);
    expect($list.html()).toEqual("<ul></ul>");
  });

  it("can add one item", async () => {
    const addItem = (items, setItems) => setItems([...items, items.length]);
    const $list = $(<App onClick={addItem} />);
    expect($list.html()).toBe(`<ul></ul>`);
    await $list.click();
    expect($list.html()).toBe(`<ul><li>0</li></ul>`);
  });

  it("can add one item multiple times", async () => {
    const addItem = (items, setItems) => setItems([...items, items.length]);
    const $list = $(<App onClick={addItem} />);
    expect($list.html()).toBe(`<ul></ul>`);
    await $list.click();
    await $list.click();
    await $list.click();
    expect($list.html()).toBe(`<ul><li>0</li><li>1</li><li>2</li></ul>`);
  });

  it("can add multiple items", async () => {
    const addItems = (items, setItems) => {
      setItems([...items, items.length, items.length + 1, items.length + 2]);
    };
    const $list = $(<App onClick={addItems} />);
    expect($list.html()).toBe(`<ul></ul>`);
    await $list.click();
    expect($list.html()).toBe(`<ul><li>0</li><li>1</li><li>2</li></ul>`);
  });

  it("can modify an item with the dot notation", async () => {
    // We define and test a items:
    const List = () => {
      const items = useSelector("items");
      const [item, setItem] = useStore("items.0");
      const onClick = e => setItem(3);
      return <DisplayList items={items} onClick={onClick} />;
    };
    const $list = $(<Store items={[0, 1, 2]} children={<List />} />);
    expect($list.html()).toBe(`<ul><li>0</li><li>1</li><li>2</li></ul>`);
    await $list.click();
    expect($list.html()).toBe(`<ul><li>3</li><li>1</li><li>2</li></ul>`);
  });

  it("can modify a deep item in arrays", async () => {
    // We define and test a items:
    const List = () => {
      const items = useSelector("items");
      const [item, setItem] = useStore("items.0");
      const onClick = e => setItem(item => ({ ...item, text: "x" }));
      return (
        <DisplayList
          items={items.map(it => `${it.id}-${it.text}`)}
          onClick={onClick}
        />
      );
    };
    const items = [{ id: 1, text: "a" }, { id: 2, text: "b" }];
    const $list = $(<Store items={items} children={<List />} />);
    expect($list.html()).toBe(`<ul><li>1-a</li><li>2-b</li></ul>`);
    await $list.click();
    expect($list.html()).toBe(`<ul><li>1-x</li><li>2-b</li></ul>`);
  });

  it("actions have updated items", async () => {
    const ItemList = ({ onClick }) => {
      const items = useSelector("items");
      return (
        <DisplayList
          items={items.map(it => `${it.id}-${it.text}`)}
          onClick={onClick}
        />
      );
    };

    // We define and test a items:
    const all = [];
    const List = () => {
      const setItems = useActions("items");
      const onClick = e => {
        setItems(items => {
          all.push(items);
          return [...items, { id: items.length + 1, text: "b" }];
        });
      };
      return <ItemList onClick={onClick} />;
    };
    const items = [{ id: 1, text: "a" }];
    const $list = $(<Store items={items} children={<List />} />);
    expect($list.html()).toBe(`<ul><li>1-a</li></ul>`);
    await $list.click();
    expect($list.html()).toBe(`<ul><li>1-a</li><li>2-b</li></ul>`);
    await $list.click();
    expect($list.html()).toBe(`<ul><li>1-a</li><li>2-b</li><li>3-b</li></ul>`);
    expect(all).toEqual([
      [{ id: 1, text: "a" }],
      [{ id: 1, text: "a" }, { id: 2, text: "b" }]
    ]);
  });

  it("can retrieve a newly added item", async () => {
    const all = [];
    // We define and test a items:
    const List = () => {
      const [items, setItems] = useStore("items");
      const [item, setItem] = useStore(`items.${items.length - 1}`);
      all.push(item);
      const onClick = e => setItems.append("i" + items.length);
      return <DisplayList items={items} onClick={onClick} />;
    };
    const items = ["i0"];
    const $list = $(<Store items={items} children={<List />} />);
    expect($list.html()).toBe(`<ul><li>i0</li></ul>`);
    await $list.click();
    await $list.click();
    await $list.click();
    expect(all).toEqual(["i0", "i1", "i2", "i3"]);
    expect($list.html()).toBe(
      `<ul><li>i0</li><li>i1</li><li>i2</li><li>i3</li></ul>`
    );
  });

  // This is testing a very insidious stale data bug
  it("can change two values at once", async () => {
    const all = [];
    // We define and test a items:
    const List = () => {
      const [items, setItems] = useStore("items");
      const [item, setItem] = useStore(`items.${items.length - 1}`);
      all.push(item);
      const onClick = e => {
        if (item) setItem("x" + items.length);
        setItems.append("i" + items.length);
      };
      return <DisplayList items={items} onClick={onClick} />;
    };
    const items = ["i0"];
    const $list = $(<Store items={items} children={<List />} />);
    expect($list.html()).toBe(`<ul><li>i0</li></ul>`);
    await $list.click();
    await $list.click();
    await $list.click();
    expect(all).toEqual(["i0", "i1", "i2", "i3"]);
    expect($list.html()).toBe(
      `<ul><li>x1</li><li>x2</li><li>x3</li><li>i3</li></ul>`
    );
  });

  describe("array", () => {
    // List from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/prototype
    it(".fill() - all the items", async () => {
      const items = ["a", "b", "c"];
      const fill = (items, setItems) => setItems.fill(1);
      const $list = $(<App items={items} onClick={fill} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>1</li><li>1</li><li>1</li></ul>`);
      expect(items).toEqual(["a", "b", "c"]); // Check for leaky mutations
    });

    it(".fill() - with start and end", async () => {
      const items = ["a", "b", "c"];
      const fill = (items, setItems) => setItems.fill(1, 1, 2);
      const $list = $(<App items={items} onClick={fill} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li><li>1</li><li>c</li></ul>`);
      expect(items).toEqual(["a", "b", "c"]); // Check for leaky mutations
    });

    it(".pop() - removes an item once", async () => {
      const items = ["a", "b", "c"];
      const pop = (items, setItems) => setItems.pop();
      const $list = $(<App items={items} onClick={pop} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul></ul>`);
      expect(items).toEqual(["a", "b", "c"]); // Check for leaky mutations
    });

    it(".push() - appends an item", async () => {
      const items = [];
      const push = (items, setItems) => setItems.push(items.length);
      const $list = $(<App items={items} onClick={push} />);
      expect($list.html()).toBe(`<ul></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>0</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>0</li><li>1</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>0</li><li>1</li><li>2</li></ul>`);
      expect(items).toEqual([]); // Check for leaky mutations
    });

    it(".push() - appends multiple items", async () => {
      const items = [];
      const push = (items, setItems) => setItems.push("a", "b", "c");
      const $list = $(<App items={items} onClick={push} />);
      expect($list.html()).toBe(`<ul></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      expect(items).toEqual([]); // Check for leaky mutations
    });

    it(".reverse() - reverses the array", async () => {
      const items = ["a", "b", "c"];
      const reverse = (items, setItems) => setItems.reverse();
      const $list = $(<App items={items} onClick={reverse} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>c</li><li>b</li><li>a</li></ul>`);
      expect(items).toEqual(["a", "b", "c"]); // Check for leaky mutations
    });

    it(".shift() - removes the first item", async () => {
      const items = ["a", "b", "c"];
      const shift = (items, setItems) => setItems.shift();
      const $list = $(<App items={items} onClick={shift} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul></ul>`);
      expect(items).toEqual(["a", "b", "c"]); // Check for leaky mutations
    });

    it(".sort() - orders by alphabet", async () => {
      const items = ["c", "b", "a"];
      const sort = (items, setItems) => setItems.sort();
      const $list = $(<App items={items} onClick={sort} />);
      expect($list.html()).toBe(`<ul><li>c</li><li>b</li><li>a</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      expect(items).toEqual(["c", "b", "a"]); // Check for leaky mutations
    });

    it(".sort() - orders by passed callback", async () => {
      const items = [4, 2, 1, 3];
      const sort = (items, setItems) => setItems.sort((a, b) => a - b);
      const $list = $(<App items={items} onClick={sort} />);
      expect($list.html()).toBe(
        `<ul><li>4</li><li>2</li><li>1</li><li>3</li></ul>`
      );
      await $list.click();
      expect($list.html()).toBe(
        `<ul><li>1</li><li>2</li><li>3</li><li>4</li></ul>`
      );
      expect(items).toEqual([4, 2, 1, 3]); // Check for leaky mutations
    });

    it(".splice() - inserts an item", async () => {
      const items = ["a", "c"];
      const splice = (items, setItems) => setItems.splice(1, 0, "b");
      const $list = $(<App items={items} onClick={splice} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      expect(items).toEqual(["a", "c"]); // Check for leaky mutations
    });

    it(".splice() - replaces an item", async () => {
      const items = ["a", "a", "c"];
      const splice = (items, setItems) => setItems.splice(1, 1, "b");
      const $list = $(<App items={items} onClick={splice} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>a</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      expect(items).toEqual(["a", "a", "c"]); // Check for leaky mutations
    });

    it(".unshift() - prepends an item", async () => {
      const items = [];
      const unshift = (items, setItems) => setItems.unshift(items.length);
      const $list = $(<App items={items} onClick={unshift} />);
      expect($list.html()).toBe(`<ul></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>0</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>1</li><li>0</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>2</li><li>1</li><li>0</li></ul>`);
      expect(items).toEqual([]); // Check for leaky mutations
    });

    it(".concat() - adds items to the end", async () => {
      const concat = (items, setItems) => setItems.concat(items.length);
      const $list = $(<App onClick={concat} />);
      expect($list.html()).toBe(`<ul></ul>`);
      await $list.click();
      await $list.click();
      await $list.click();
      expect($list.html()).toBe(`<ul><li>0</li><li>1</li><li>2</li></ul>`);
    });

    it(".slice() - cuts up the array in the specified places", async () => {
      const items = ["a", "b", "c"];
      const slice = (items, setItems) => setItems.slice(1, 2);
      const $list = $(<App items={items} onClick={slice} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>b</li></ul>`);
    });
  });

  describe("array iterators", () => {
    it(".filter() - remove all items that do not pass the test", async () => {
      const items = ["a", "b", "c"];
      const test = item => /^(a|b)$/.test(item);
      const filter = (items, setItems) => setItems.filter(test);
      const $list = $(<App items={items} onClick={filter} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li></ul>`);
    });

    it(".map() - change each value", async () => {
      const items = ["a", "b", "c"];
      const map = (items, setItems) => setItems.map(item => item + "x");
      const $list = $(<App items={items} onClick={map} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>ax</li><li>bx</li><li>cx</li></ul>`);
    });

    it(".reduce() - apply the .reduce() method", async () => {
      const items = ["a", "b", "c"];
      const reducer = (all, book) => [...all, book + "x"];
      const map = (items, setItems) => setItems.reduce(reducer, []);
      const $list = $(<App items={items} onClick={map} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>ax</li><li>bx</li><li>cx</li></ul>`);
    });

    it(".reduceRight() - apply the .reduce() method", async () => {
      const items = ["a", "b", "c"];
      const reducer = (all, book) => [...all, book + "x"];
      const map = (items, setItems) => setItems.reduceRight(reducer, []);
      const $list = $(<App items={items} onClick={map} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>cx</li><li>bx</li><li>ax</li></ul>`);
    });
  });

  describe("array alias", () => {
    it(".append() - an alias of .push()", async () => {
      const append = (items, setItems) => setItems.append(items.length);
      const $list = $(<App onClick={append} />);
      expect($list.html()).toBe(`<ul></ul>`);
      await $list.click();
      await $list.click();
      await $list.click();
      expect($list.html()).toBe(`<ul><li>0</li><li>1</li><li>2</li></ul>`);
    });

    it(".prepend() - an alias of .unshift()", async () => {
      const prepend = (items, setItems) => setItems.prepend(items.length);
      const $list = $(<App onClick={prepend} />);
      expect($list.html()).toBe(`<ul></ul>`);
      await $list.click();
      await $list.click();
      await $list.click();
      expect($list.html()).toBe(`<ul><li>2</li><li>1</li><li>0</li></ul>`);
    });

    it(".remove() - remove an index by its index", async () => {
      const items = ["a", "b", "c"];
      const remove = (items, setItems) => setItems.remove(1);
      const $list = $(<App items={items} onClick={remove} />);
      expect($list.html()).toBe(`<ul><li>a</li><li>b</li><li>c</li></ul>`);
      await $list.click();
      expect($list.html()).toBe(`<ul><li>a</li><li>c</li></ul>`);
    });
  });
});
