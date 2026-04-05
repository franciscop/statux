declare module "react-test" {
  import { ReactElement } from "react";

  interface ReactTest {
    html(): string;
    text(): string;
    find(selector: string): ReactTest;
    click(): Promise<void>;
    delay(ms: number): Promise<void>;
    data(attribute: string): string | undefined;
  }

  function $(element: ReactElement): ReactTest;
  export default $;
}

declare module "vitest" {
  interface Assertion<T> {
    toHaveHtml(html: string): Assertion<T>;
  }
}
