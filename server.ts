const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const port = 3000;
const path = __dirname; 

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload({
  createParentPath: true
}));
app.use(require('./routes.ts'));

app.listen(port, () => {
 console.log(`Server running on port ${port}`);
});
