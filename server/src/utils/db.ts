import { HTTPException } from 'hono/http-exception';

type DBValue<T> = T | null | undefined;
const errorMessage = 'Expected a value but got none';

export const takeUniqueOrThrow = <T>(values: DBValue<T[]>): NonNullable<T> => {
  if (!values || values.length !== 1 || !values[0]) {
    console.error(errorMessage);
    throw new HTTPException(500);
  }
  return values[0];
};

export const takeFirstOrThrow = <T>(values: DBValue<T[]>): NonNullable<T> => {
  if (!values || values.length === 0 || values[0] == null) {
    console.error(errorMessage);
    throw new HTTPException(404);
  }
  return values[0];
};

export const ensureNonEmptyOrThrow = <T>(values: DBValue<T[]>): [T, ...T[]] => {
  if (!values || values.length === 0 || !values[0]) {
    console.error(errorMessage);
    throw new HTTPException(404);
  }
  return values as [T, ...T[]];
};

export const takeOrThrow = <T>(value: DBValue<T>): NonNullable<T> => {
  if (value == null) {
    console.error(errorMessage);
    throw new HTTPException(404);
  }
  return value;
};
