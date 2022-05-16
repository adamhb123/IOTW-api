require("dotenv").config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import Config from "./Config";

const app = express();

const host = Config.server.host;
const port = Config.server.port;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(require("./Routes.ts"));

app.listen(port, host, () => {
  console.log(`Server running...\nAddress: ${host}:${port}`);
});
