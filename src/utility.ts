// Definition of "primitive" is loose here
export type PrimitiveTypeString =
  | "boolean"
  | "number"
  | "bigint"
  | "string"
  | "symbol"
  | "object";

const stringToPrimitive = (
  string: string,
  desiredPrimitive: PrimitiveTypeString
) => {
  return {
    boolean: () => (string === "true" ? true : false),
    number: () => Number(string),
    bigint: () => BigInt(string),
    string: () => string,
    symbol: () => Symbol(string),
    object: () => JSON.parse(string),
  }[desiredPrimitive]();
};

export const parseEnvVar = (
  failureDefault: any,
  ...possibleEnvVarNames: string[]
) => {
  const desiredPrimitive = <PrimitiveTypeString>typeof failureDefault;
  for (const envVarName of possibleEnvVarNames) {
    const envVar = process.env[envVarName];
    if (typeof envVar !== "undefined") {
      console.log(envVar);
      return stringToPrimitive(envVar, desiredPrimitive);
    }
  }
  return failureDefault;
};

export default {
    parseEnvVar
};
