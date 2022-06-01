import path from "path";
import fs from "fs";
import dotenv from "dotenv";
export default () => {
  const envPath = path.join(__dirname, "./.env");
  const envLocalPath = path.join(__dirname, "./.env.local");
  const chosenPath = fs.existsSync(envLocalPath)
    ? envLocalPath
    : fs.existsSync(envPath)
    ? envPath
    : undefined;
  dotenv.config({ path: chosenPath });
};
