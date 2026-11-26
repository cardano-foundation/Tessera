/**
 * Command-line options, each removed from `args` as it is read, so what is
 * left once every option is read are the positional arguments.
 */
export function options(argv: readonly string[]) {
  const args = [...argv];
  const take = (name: string): string | undefined => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args.splice(i, 2)[1];
  };
  return {
    args,
    number: (name: string, fallback: number): number => {
      const value = take(name);
      return value === undefined ? fallback : Number(value);
    },
    string: take,
    flag: (name: string): boolean => {
      const i = args.indexOf(name);
      if (i !== -1) args.splice(i, 1);
      return i !== -1;
    },
  };
}
