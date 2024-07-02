import { useActions, useSelector, useStore } from "..";

{
  const [val, setVal] = useStore<string>("root");
  val.substring(0);
  setVal("bye");
  setVal(() => "bye");
  setVal((a: string) => "bye");
}

{
  const val1 = useSelector("root");
  const val2 = useSelector<string>("root");
  const val3: string = useSelector<string>("root");
  const val4: number = useSelector<number>("root.age");

  const val5 = useSelector<string>(() => "hello");
  const val6: string = useSelector(() => "hello");
  const val7: string = useSelector<string>(() => "hello");
  const val8: number = useSelector<number>(() => 40);
}

{
  const setValue1 = useActions<string>("root");
  setValue1("hello");

  const setValue2 = useActions<string[]>("root");
  setValue2(["hello"]);
  const out1 = setValue2.fill("hello");
  const out2: string[] = setValue2.pop();
  const out3: string[] = setValue2.push("hello");
  const out4: string[] = setValue2.reverse();
  const out5: string[] = setValue2.sort();
  const out6: string[] = setValue2.concat("a", "b");

  const n2: number = useActions<number>("root").add(5);
  const n3: number = useActions<number>("root").substract(5);
}
