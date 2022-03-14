require('dotenv').config();

import express = require('express');
import bodyParser = require('body-parser');
import cors = require('cors');
import fileUpload = require('express-fileupload');

const app = express();

const port = process.env.iotw_api_port;
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
