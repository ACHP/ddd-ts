import { AbstractConstructor, Empty, Concrete, Expand, Constructor } from "./_";

type Matcher<S extends string[]> =
  | {
      [key in S[number]]: () => any;
    }
  | ({
      _: () => any;
    } & {
      [key in S[number]]?: () => any;
    });

type MatcherResult<M extends Matcher<any>> = M[keyof M] extends () => infer R
  ? R
  : never;

type ActuallyGenerateAllTheThings<
  B extends AbstractConstructor,
  Current extends AbstractConstructor,
> = abstract new (
  ...args: ConstructorParameters<Current>
) => InstanceType<B> & InstanceType<Current>;

export const Choice = <
  const S extends string[],
  B extends AbstractConstructor<{}> = typeof Empty,
>(
  config: S,
  base: B = Empty as any,
) => {
  type Inline = S[number];

  abstract class $Choice extends (base as any as Constructor<{}>) {
    static $name = "choice" as const;

    constructor(public value: Expand<Inline>) {
      super();
    }

    is<T extends Inline>(value: T): this is Omit<
      this,
      "value" | "serialize"
    > & {
      value: T;
      serialize(): T;
    } {
      return this.value === value;
    }

    match<M extends Matcher<S>>(matcher: M): MatcherResult<M> {
      const handler = matcher[this.value];
      if (handler) return handler();
      return (matcher as { _: () => any })._();
    }

    serialize(): Inline {
      return this.value;
    }

    static deserialize<T extends typeof $Choice>(
      this: T,
      value: Inline,
    ): InstanceType<T> {
      return new (this as any)(value as any) as InstanceType<T>;
    }
    static $deserialize<T extends typeof $Choice>(
      this: T,
      value: Inline,
    ): Inline {
      return value;
    }
    static $serialize<T extends typeof $Choice>(
      this: T,
      value: Inline,
    ): Inline {
      return value;
    }

    static $inline: Inline;

    static {
      for (const choice of config) {
        (this as any)[choice] = function <T extends Constructor>(this: T) {
          return new this(choice as any);
        };
      }
    }
  }

  return $Choice as any as ActuallyGenerateAllTheThings<B, typeof $Choice> &
    Omit<B, ""> &
    Omit<typeof $Choice, ""> & {
      [K in S[number]]: <T extends Constructor>(this: T) => InstanceType<T>;
    };
};
