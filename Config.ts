// Definition of "primitive" is loose here
type _PrimitiveTypeString =
  | "boolean"
  | "number"
  | "bigint"
  | "string"
  | "symbol"
  | "object";

const _stringToPrimitive = (
  string: string,
  desiredPrimitive: _PrimitiveTypeString
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

const _parseEnvVar = (
  failureDefault: any,
  ...possibleEnvVarNames: string[]
) => {
  const desiredPrimitive = <_PrimitiveTypeString>typeof failureDefault;
  for (const envVarName of possibleEnvVarNames) {
    const envVar = process.env[envVarName];
    if (typeof envVar !== "undefined") {
      return _stringToPrimitive(envVar, desiredPrimitive);
    }
  }
  return failureDefault;
};

const Config = {
  mysql: {
    host: _parseEnvVar("localhost", process.env.IOTW_MYSQL_HOST),
    port: _parseEnvVar("3306", process.env.IOTW_MYSQL_PORT),
    user: _parseEnvVar("root", process.env.IOTW_MYSQL_USER),
    password: _parseEnvVar("", process.env.IOTW_MYSQL_PASSWORD),
    databaseName: _parseEnvVar("iotw", process.env.IOTW_MYSQL_DATABASE_NAME),
  },
  server: {
    host: _parseEnvVar("localhost", process.env.IOTW_SERVER_HOST),
    port: _parseEnvVar("3000", process.env.IOTW_SERVER_PORT),
  },
};

export default Config;
