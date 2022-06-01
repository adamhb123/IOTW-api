import { config } from "dotenv";
import path from "path";
import Dotenv from "./dotenv";

Dotenv();
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
      console.log(envVar);
      return _stringToPrimitive(envVar, desiredPrimitive);
    }
  }
  return failureDefault;
};

const Config = {
  mysql: {
    host: _parseEnvVar("localhost", "IOTW_MYSQL_HOST_OKD", "IOTW_MYSQL_HOST"),
    port: _parseEnvVar("3306", "IOTW_MYSQL_PORT_OKD", "IOTW_MYSQL_PORT"),
    user: _parseEnvVar("root", "IOTW_MYSQL_USER_OKD", "IOTW_MYSQL_USER"),
    password: _parseEnvVar("", "IOTW_MYSQL_PASSWORD_OKD", "IOTW_MYSQL_PASSWORD"),
    databaseName: _parseEnvVar("iotw", "IOTW_MYSQL_DATABASE_NAME_OKD", "IOTW_MYSQL_DATABASE_NAME"),
    // uploadsDirectory: _parseEnvVar(path.join(__dirname, "./public/uploads"), "IOTW_MYSQL_UPLOADS_DIRECTORY_OKD", "IOTW_MYSQL_UPLOADS_DIRECTORY"),
  },
  backups: {
    enabled: _parseEnvVar(false, "IOTW_BACKUPS_ENABLED_OKD", "IOTW_BACKUPS_ENABLED"),
    directory: _parseEnvVar(path.join(__dirname, "./public/backups"), "IOTW_BACKUPS_DIRECTORY_OKD", "IOTW_BACKUPS_DIRECTORY")
  },
  api: {
    host: _parseEnvVar("localhost", "IOTW_API_HOST_OKD", "IOTW_API_HOST"),
    port: _parseEnvVar("3001", "IOTW_API_PORT_OKD", "IOTW_API_PORT"),
  },
  slackbot: {
    token: _parseEnvVar("need-token", "IOTW_SLACKBOT_TOKEN_OKD", "IOTW_SLACKBOT_TOKEN")
  }
};

export default Config;
