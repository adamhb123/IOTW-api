import express, { Request, Response } from "express";
import * as Database from "./database";

const router = express.Router();

/*

Routes to add:

post route for inserting to database from slack
get route with query parameters that returns all media that fit
e.g. within certain time range, within certain upvote range, etc.  

*/

router.get("/media", (res: Response) => {
  res.send({ media: Database.getMedia() });
});

router.post("/upload", (req: Request, res: Response) => {
  /*
    req: {
        body: {
            files: {
                [
                    media: Object;
                    userID: string;
                ],
            }
        }
    }
    */
  try {
    if (!req.body.files || !req.body.files.length) {
      res.send({
        status: false,
        message: "No file uploaded",
      });
    } else {
      for (const file of req.body.files) {
        // Use the name of the input field to retrieve the uploaded file
        const media = file.media;
        const mediaPath = `./images/${media.name}`;
        Database.insertMedia(mediaPath, file.userID);
        // Send response
        res.send({
          status: true,
          message: "media successfully added",
          data: {
            name: media.name,
            mimetype: media.mimetype,
            size: media.size,
          },
        });
      }
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
