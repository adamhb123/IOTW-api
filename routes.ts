// Global modules
import fs, { Dir } from "fs";
import express, { query, Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import path from "path";
import fetch from "cross-fetch";
import { v4 as uuidv4 } from 'uuid';
// Local modules
import * as Database from "./database";
import Config from "./config";
import Query from "mysql2/typings/mysql/lib/protocol/sequences/Query";

const router = express.Router();

class ResponsePacket {
  status: boolean;
  message: string;
  data: Object = {};
  constructor(status: boolean, message: string, data?: Object) {
    this.status = status;
    this.message = message;
    if(data) this.data = data;
  }
  static asJSON(status: boolean, message: string, data?: Object) {
    return {
      status: status,
      message: message,
      data: data
    }
  }
  asJSON() {
    return {
      status: this.status,
      message: this.message,
      data: this.data
    }
  }
  static error(message: string, data?: Object) {
    return {
      status: false,
      message: message,
      data: data
    }
  }
}

/*

Routes to add:

post route for inserting to database from slack
get route with query parameters that returns all media that fit
e.g. within certain time range, within certain upvote range, etc.  

*/

interface MediaResponseStructure {
  uploaderID: string;
  slackPrivateUrl: string;
  updoots: number;
  downdoots: number;
}

export enum SortedBy {
  Updoots="updoots",
  Downdoots="downdoots",
  DootDifference="doot-difference",
  Default="updoots"
}

export enum Direction {
  Ascending="ascending",
  Descending="descending",
  Default="descending"
}

/*
  !IMPORTANTE!
  !IMPORTANTE!
  !IMPORTANTE!
  !IMPORTANTE!
    It would have been likely more ideal to sort with SQL queries instead of locally.
    If there are significant performance issues, I would look here first. 
*/
function sortMedia(media: MediaResponseStructure[], direction: Direction = Direction.Default, sortedBy: SortedBy = SortedBy.Default) {
  //response data:
  /*
"data": [
        {
            "uploaderID": "U03665WAJF3",
            "slackPrivateUrl": "https://files.slack.com/files-pri/T035TH82P19-F03HAQTKQ77/sparkleanim.gif",
            "updoots": 0,
            "downdoots": 0
        }
    ]
  */
  // sort with sorted by
  const sorted = media.sort((a, b) => {
    let comp_a, comp_b;
    const dir = direction === Direction.Ascending ? 1 : -1;
    if(sortedBy === SortedBy.Updoots) {
      comp_a = a.updoots;
      comp_b = b.updoots;
    }
    else if(sortedBy === SortedBy.Downdoots) {
      comp_a = a.downdoots;
      comp_b = b.downdoots;
    }
    else { // doot difference
      comp_a = a.updoots - a.downdoots;
      comp_b = b.updoots - b.downdoots;
    }
    return comp_a > comp_b ? dir : -dir;
  });
  return sorted;
}

router.get("/media", (req: Request, res: Response) => {
  Database.getMedia().then((_media: MediaResponseStructure[]) => {
    // Sorting appears to be fully functional!
    const direction = <Direction>req.query.direction ?? Direction.Default;
    const sortedBy = <SortedBy>req.query.sortedBy ?? SortedBy.Default;
    const media = sortMedia(_media, direction, sortedBy);
    res.send(ResponsePacket.asJSON(true, "success", media));
  })
  .catch((err: any) => res.status(500).send(err));
});

router.post("/upload", async (req: Request, res: Response) => {
  /*
    req: {
        body: {
          userID: xxx
          file: FILE ONLY ONE
        }
    }
    */
  try {
    let files = req.files || req.body.files;
    console.log(req.body);
    const userID = req.body.userID;
    if (!files || !userID) {
      res.send(ResponsePacket.error(
        "Malformed request! Analyze the 'data' property within this response to see what we received...",
        {
          userID: userID,
          files: files,
        }
      ));
    } else {
      let successfulUploads: string[] = [];
      let attemptedUploadCount = 0;
      if(typeof files !== "string"){
        /* Don't really need this functionality right now
        // Direct file upload through API
        const fileKeys = Object.keys(files);
        console.log("filekeys: ", fileKeys);
        for(const fileKey of fileKeys) {
          let fileArray: UploadedFile[];
          if(!Array.isArray(files[fileKey])) fileArray = [<UploadedFile>files[fileKey]];
          else fileArray = <UploadedFile[]>files[fileKey];
          for(let i = 0; i < fileArray.length; i++) {
            attemptedUploadCount++;
            const file = <UploadedFile>fileArray[i];
            const fileName = `${uuidv4()}${file.name}`;
            console.log("file:", file);
            const fileLocalPath = path.join(Config.mysql.uploadsDirectory, fileName);
            await file.mv(fileLocalPath); Don't need to save files
            await Database.insertMedia(fileLocalPath, userID);
            successfulUploads.push(fileName);
          }*/
        res.send("Direct uploads disabled!");
      } 
      else { // File upload through slack interaction
        files = JSON.parse(files);
        for(const file of files) {
          attemptedUploadCount++;
          console.log("Uploaded file in loop: ");
          console.log(file);
          await Database.insertMedia(file.url_private, file.user);
          /* File downloading functionality (not required right now, will use when implementing backups)

          const fileName = `${uuidv4()}${file.name}`;
          const filePath = path.join(Config.mysql.uploadsDirectory, fileName);
          // Optional download, going to have the website GET the images straight from slack
          // instead
          await fetch(file.url_private, {
            method: "get",
            mode: "cors",
            headers: {
                  "Authorization": `Bearer ${Config.slackbot.token}`
            }
          })
          .then((res) => new Promise((resolve, reject) => {
            if (res.status === 200) {
              const fileStream = fs.createWriteStream(filePath);
              // @/ts-expect-error
              res.body?.pipe(fileStream)
              // @/ts-expect-error
              res.body?.on("end", () => resolve(filePath));
              fileStream.on("error", reject);
            } else {
              reject(new Error(`Request Failed With a Status Code: ${res.status}`));
            }
          }))
          .then((result) => console.log(result));
          */
          successfulUploads.push(file.url_private);
        }
      }
      const uploadDelta = attemptedUploadCount - successfulUploads.length;
      if(uploadDelta !== 0) throw new Error(`Upload aborted, at least 1 upload failed!`);
      res.send(ResponsePacket.asJSON(
        true,
        `Successfully uploaded all (${successfulUploads.length}) files!`,
        {
          files: successfulUploads
        }
      ));
    }
  }
  catch (err: any) {
    console.error(err);
    res.status(500).send(ResponsePacket.asJSON(false, err.toString()));
  }
});

module.exports = router;
