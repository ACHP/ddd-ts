export type Constructor<Props extends {} = any> = new (props: Props) => any;

type Trait = {
  factory: (a: Constructor<{}>) => Constructor;
  superTraits: readonly Trait[];
};

type Explode<T> = { [P in keyof T]: T[P] };

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type MergeStaticSide<T extends readonly Trait[]> = UnionToIntersection<
  Explode<ReturnType<[...T][number]["factory"]>>
>;

type MergeInstanceSide<T extends readonly Trait[]> = UnionToIntersection<
  InstanceType<ReturnType<[...T][number]["factory"]>>
>;

export type MergeParameter<T extends readonly Trait[]> = T extends []
  ? {}
  : T extends never[]
  ? {}
  : UnionToIntersection<
      ConstructorParameters<ReturnType<[...T][number]["factory"]>>[0]
    >;

export type ApplyTraits<T extends readonly Trait[]> = {
  new (param: MergeParameter<T>): MergeInstanceSide<T>;
} & MergeStaticSide<T>;

export type CheckTraitRequirements<Traits extends readonly Trait[]> =
  CheckTraitRequirementsInternal<[], Traits>;

type CheckTraitRequirementsInternal<
  AppliedTraits extends readonly Trait[],
  RemainingTraits extends readonly Trait[]
> = RemainingTraits extends readonly [
  infer ApplyingTrait extends Trait,
  ...infer Rest extends Trait[]
]
  ? MergeParameter<AppliedTraits> extends MergeParameter<
      ApplyingTrait["superTraits"]
    >
    ? MergeInstanceSide<AppliedTraits> extends MergeInstanceSide<
        ApplyingTrait["superTraits"]
      >
      ? CheckTraitRequirementsInternal<[...AppliedTraits, ApplyingTrait], Rest>
      : {
          error: "Instance mismatch";
          check: "MergeInstanceSide<AppliedTraits> extends MergeInstanceSide<ApplyingTrait['superTraits']>";
          left: MergeInstanceSide<AppliedTraits>;
          right: MergeInstanceSide<ApplyingTrait["superTraits"]>;
          result: MergeInstanceSide<AppliedTraits> extends MergeInstanceSide<
            ApplyingTrait["superTraits"]
          >
            ? true
            : false;
        }
    : {
        error: "Parameter mismatch";
        check: "MergeParameter<AppliedTraits> extends MergeParameter<[ApplyingTrait]>";
        left: MergeParameter<AppliedTraits>;
        right: MergeParameter<[ApplyingTrait]>;
        result: MergeParameter<AppliedTraits> extends MergeParameter<
          [ApplyingTrait]
        >
          ? true
          : false;
      }
  : "success";

export function Subtrait<
  const SuperTraits extends readonly Trait[],
  Applied extends ApplyTraits<SuperTraits>,
  const Factory extends (
    base: Applied,
    props: ConstructorParameters<Applied>[0]
  ) => Constructor
>(superTraits: SuperTraits, factory: Factory) {
  return {
    factory: (base: Applied): ReturnType<Factory> =>
      factory(
        base as any,
        "🚨 Error: the second parameter of the subtrait factory is to be used in types with typeof only" as any
      ) as any,
    superTraits,
  };
}

export function Derive<R extends Trait[], C extends CheckTraitRequirements<R>>(
  ...traits: R
): C extends "success" ? ApplyTraits<R> : C {
  let current: Constructor = class {};
  for (const trait of traits) {
    current = trait.factory(current);
  }

  for (const trait of traits) {
    (current as any)[(trait as any).symbol] = true;
  }

  return current as any;
}
export const Trait = <T extends Trait["factory"]>(factory: T) => {
  const symbol = Symbol();
  (factory as any).symbol = symbol;
  return { factory, superTraits: [] as Trait[] };
};

export function implementsTrait<I extends InstanceType<any>, T extends Trait>(
  instance: I,
  trait: T
): instance is ImplementsTrait<T> {
  return (instance as any).constructor[(trait as any).symbol] === true;
}

export type ImplementsTrait<T extends Trait> = InstanceType<
  ReturnType<T["factory"]>
>;