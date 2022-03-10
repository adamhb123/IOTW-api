const router = require('express').Router();
const mysql = require('mysql2');

//mysql connection
const conn = mysql.createConnection({
    host: process.env.iotw_mysql_host,
    user: process.env.iotw_mysql_user,
    password: process.env.iotw_mysql_password,
    database: "iotw"
});

/*

Routes to add:

post route for inserting to database from slack
get route with query parameters that returns all pictures that fit
e.g. within certain time range, within certain upvote range, etc.  

*/

/** API ROUTE DEFINITION
 * METHOD:              GET
 * NAME:                'pictures'
 * QUERY PARAMETERS:
 *      order={0, 1} : Order of the pictures (by date)
 *          0: Newest to oldest
 *          1: Oldest to newest  
 * RETURN: A set of JSON objects, each representing a single image,
 *         constructed as follows 
 *         FORMAT: varname | type in db | type in json : description
 *         {
 *              userID | VARCHAR(45) | string : uploader's userID,
 *              path | VARCHAR(45) |  : path to image,
 *              timestamp | timestamp
 *          }
 */
router.get('/pictures', (req, res) => {
    let query = "SELECT * FROM pictures WHERE";
    conn.query(query);
    res.send("balls");
})

router.post('/addPicture', (req, res) => {
    //first, grab highest ID to know what to set path to.
    let query = "SELECT MAX(ID) AS maxID from pictures";
    conn.query(query, (err, res)  => {
        let highestID = res[0].maxID ?? 0;
        query = `INSERT INTO pictures (path, userID, upvotes, downvotes, name)
             VALUES ('/images/${highestID+1}, ${req.body.userID}, 0, 0, ${req.body.name}}`;
        conn.query(query, (err, res) => {    
        })
        try {
            if(!req.files) {
                res.send({
                    status: false,
                    message: 'No file uploaded'
                });
            } else {
                //Use the name of the input field to retrieve the uploaded file
                let picture = req.files.picture;
                
                //Use the mv() method to place the file in upload directory (i.e. "uploads")
                picture.mv('./images/' + picture.name);
    
                //send response
                res.send({
                    status: true,
                    message: 'picture successfully added',
                    data: {
                        name: picture.name,
                        mimetype: picture.mimetype,
                        size: picture.size
                    }
                });
            }
        } catch (err) {
            res.status(500).send(err);
        }
    })

});

module.exports = router;