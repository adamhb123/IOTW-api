const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload({
  createParentPath: true
}));
app.use(require('./routes'));

app.listen(3000, () => {
 console.log("Server running on port 3000");
});
