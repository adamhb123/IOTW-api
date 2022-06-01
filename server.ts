import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import Config from "./config";

const app = express();

const host = Config.api.host;
const port = Config.api.port;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(require("./routes"));

app.listen(port, host, () => {
  console.log(`Server running...\nAddress: ${host}:${port}`);
});
