import React, { useState } from "react";
import $ from ".";
import "babel-polyfill";

const Counter = () => {
  const [counter, setCounter] = useState(0);
  const increment = () => setCounter(counter + 1);
  return <div onClick={increment}>{counter}</div>;
};

it("Will increment the counter", async () => {
  const $counter = $(<Counter />);
  expect($counter.html()).toEqual("<div>0</div>");
  await $counter.click();
  expect($counter.html()).toEqual("<div>1</div>");
  await $counter.click();
  expect($counter.html()).toEqual("<div>2</div>");
});
