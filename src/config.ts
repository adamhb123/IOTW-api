import { parseEnvVar } from "./utility";
import EasyConfig from "easyconfig-ts";

EasyConfig({
  rootPath: __dirname,
  dotFiles: ["../.env", "../.env.local", "../.env.template"]
});

const Config = {
  mysql: {
    host: parseEnvVar("localhost", "IOTW_MYSQL_HOST_OKD", "IOTW_MYSQL_HOST"),
    port: parseEnvVar("3306", "IOTW_MYSQL_PORT_OKD", "IOTW_MYSQL_PORT"),
    user: parseEnvVar("root", "IOTW_MYSQL_USER_OKD", "IOTW_MYSQL_USER"),
    password: parseEnvVar("", "IOTW_MYSQL_PASSWORD_OKD", "IOTW_MYSQL_PASSWORD"),
    databaseName: parseEnvVar("iotw", "IOTW_MYSQL_DATABASE_NAME_OKD", "IOTW_MYSQL_DATABASE_NAME"),
  },
  api: {
    host: parseEnvVar("localhost", "IOTW_API_HOST_OKD", "IOTW_API_HOST"),
    port: parseEnvVar("3001", "IOTW_API_PORT_OKD", "IOTW_API_PORT"),
    storeSubmissionsLocally: parseEnvVar(true, "IOTW_API_STORE_SUBMISSIONS_LOCALLY_OKD", "IOTW_API_STORE_SUBMISSIONS_LOCALLY")
  },
  slackbot: {
    token: parseEnvVar("need-token", "IOTW_SLACKBOT_TOKEN_OKD", "IOTW_SLACKBOT_TOKEN")
  }
};

export default Config;
