import Store, { useStore } from "../index.js";

import "babel-polyfill";
import React from "react";
import $ from "./react-query";
import delay from "delay";

describe("List", () => {
  // We define and test a items:
  const List = () => {
    const { items, setItems } = useStore();
    const onClick = async e => setItems([...items, items.length]);
    return (
      <ul onClick={onClick}>
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  };

  it("should have a items", () => {
    const $list = $(
      <Store items={[]}>
        <List />
      </Store>
    );

    expect($list.attr("items")).toEqual([]);
  });

  it("should increment items", async () => {
    const $list = $(
      <Store items={[]}>
        <List />
      </Store>
    );

    expect($list.html()).toBe(`<ul></ul>`);
    $list.click();
    expect($list.html()).toBe(`<ul><li>0</li></ul>`);
  });

  it("should double increment items", async () => {
    const $list = $(
      <Store items={[]}>
        <List />
      </Store>
    );

    expect($list.html()).toBe(`<ul></ul>`);
    $list.click();
    $list.click();
    $list.click();
    expect($list.html()).toBe(`<ul><li>0</li><li>1</li><li>2</li></ul>`);
  });

  it("can use prebuilt append", async () => {
    // We define and test a items:
    const List = () => {
      const { items, setItems } = useStore();
      const onClick = async e => setItems.append(items.length);
      return (
        <ul onClick={onClick}>
          {items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    };

    const $list = $(
      <Store items={[]}>
        <List />
      </Store>
    );

    expect($list.html()).toBe(`<ul></ul>`);
    $list.click();
    $list.click();
    $list.click();
    expect($list.html()).toBe(`<ul><li>0</li><li>1</li><li>2</li></ul>`);
  });

  it("can use prebuilt prepend", async () => {
    // We define and test a items:
    const List = () => {
      const { items, setItems } = useStore();
      const onClick = async e => setItems.prepend(items.length);
      return (
        <ul onClick={onClick}>
          {items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    };

    const $list = $(
      <Store items={[]}>
        <List />
      </Store>
    );

    expect($list.html()).toBe(`<ul></ul>`);
    $list.click();
    $list.click();
    $list.click();
    expect($list.html()).toBe(`<ul><li>2</li><li>1</li><li>0</li></ul>`);
  });

  it("can use prebuilt prepend with function", async () => {
    // We define and test a items:
    const List = () => {
      const { items, setItems } = useStore();
      const onClick = e => setItems.prepend(items => items.length);
      return (
        <ul onClick={onClick}>
          {items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    };

    const $list = $(
      <Store items={[]}>
        <List />
      </Store>
    );

    expect($list.html()).toBe(`<ul></ul>`);
    $list.click();
    $list.click();
    $list.click();
    expect($list.html()).toBe(`<ul><li>2</li><li>1</li><li>0</li></ul>`);
  });
});
