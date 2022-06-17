// Global modules
import express, { Request, Response } from "express";
import fetch from "cross-fetch";
import fs from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
// Local modules
import * as Database from "./database";
import Config from "./config";
import Logger from "easylogger-ts";
import { randomUUID } from "crypto";

const router = express.Router();

const pubdirLocal = join(__dirname, "../public");

export const MIMETypes: {
  [key: string]: string;
} = {
  bmp: "image/bmp",
  cod: "image/cis-cod",
  gif: "image/gif",
  ief: "image/ief",
  jpe: "image/jpeg",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  jfif: "image/pipeg",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  ras: "image/x-cmu-raster",
  cmx: "image/x-cmx",
  ico: "image/x-icon",
  pnm: "image/x-portable-anymap",
  pbm: "image/x-portable-bitmap",
  pgm: "image/x-portable-graymap",
  ppm: "image/x-portable-pixmap",
  rgb: "image/x-rgb",
  xbm: "image/x-xbitmap",
  xpm: "image/x-xpixmap",
  xwd: "image/x-xwindowdump",
};

export const MIMETypeFromUrl = (url: string) => {
  const split = url.split("/");
  const filetypeSplit = split[split.length - 1].split(".");
  if (!filetypeSplit.length) return;
  const filetype = filetypeSplit[filetypeSplit.length - 1];
  if (!filetype) return;
  return MIMETypes[filetype];
};

class ResponsePacket {
  status: boolean;
  message: string;
  data: Object = {};
  constructor(status: boolean, message: string, data?: Object) {
    this.status = status;
    this.message = message;
    if (data) this.data = data;
  }
  static asJSON(status: boolean, message: string, data?: Object) {
    return {
      status: status,
      message: message,
      data: data,
    };
  }
  asJSON() {
    return {
      status: this.status,
      message: this.message,
      data: this.data,
    };
  }
  static error(message: string, data?: Object) {
    return {
      status: false,
      message: message,
      data: data,
    };
  }
}

/*

Routes to add:

post route for inserting to database from slack
get route with query parameters that returns all media that fit
e.g. within certain time range, within certain upvote range, etc.  

*/

/*
  !IMPORTANTE!
  !IMPORTANTE!
  !IMPORTANTE!
  !IMPORTANTE!
    It would have been likely more ideal to sort with SQL queries instead of locally.
    If there are significant performance issues, I would look here first. 
*/
// function sortMedia(
//   media: MediaResponseStructure[],
//   direction: Direction = Direction.Default,
//   sortedBy: SortedBy = SortedBy.Default
// ) {
//   //response data:
//   /*
// "data": [
//         {
//             "uploaderID": "U03665WAJF3",
//             "slackPrivateUrl": "https://files.slack.com/files-pri/T035TH82P19-F03HAQTKQ77/sparkleanim.gif",
//             "thumbnailUrl": "https://..."
//             "updoots": 0,
//             "downdoots": 0
//         }
//     ]
//   */
//   // sort with sorted by
//   const sorted = media.sort((a, b) => {
//     let comp_a, comp_b;
//     const dir = direction === Direction.Ascending ? 1 : -1;
//     if (sortedBy === SortedBy.Updoots) {
//       comp_a = a.updoots;
//       comp_b = b.updoots;
//     } else if (sortedBy === SortedBy.Downdoots) {
//       comp_a = a.downdoots;
//       comp_b = b.downdoots;
//     } else {
//       // doot difference
//       comp_a = a.updoots - a.downdoots;
//       comp_b = b.updoots - b.downdoots;
//     }
//     return comp_a > comp_b ? dir : -dir;
//   });
//   return sorted;
// }

export const removeFile = (filePath: string) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) reject(err.message);
      resolve(
        ResponsePacket.asJSON(true, `Successfully removed file: ${filePath}`)
      );
    });
  });
};

const arrayBufferToBase64 = (arrayBuffer: ArrayBuffer) => {
  let base64 = "";
  let a, b, c, d;
  let chunk;
  const encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(arrayBuffer);
  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1
    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }
  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }
  return base64;
};

const filetypeFromUrl = (url: string) => {
  const splitUrl = url.split(/[#?]/)[0];
  const filetypeSplit = splitUrl.split(".");
  return filetypeSplit.pop()?.trim();
};

const get = async (url: string, provideSlackAuthorization: boolean = true) =>
  await fetch(url, {
    method: "get",
    mode: "cors",
    headers: provideSlackAuthorization
      ? {
          Authorization: `Bearer ${Config.slackbot.token}`,
        }
      : {},
  });

const downloadFileFromUrl = async (
  url: string,
  provideSlackAuthorization: boolean = true
) => {
  const res = await get(url, provideSlackAuthorization);
  if (!res || !res.body) throw new Error(`Fetch from url failed: ${url}`);
  const publicPath = `/${randomUUID()}.${filetypeFromUrl(url)}`;
  await pipeline(
    // @ts-expect-error
    res.body,
    fs.createWriteStream(join(pubdirLocal, publicPath))
  );
  return publicPath;
};

const getFileBase64FromUrl = (
  url: string,
  provideSlackAuthorization: boolean = true
) => {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: "get",
      mode: "cors",
      headers: provideSlackAuthorization
        ? {
            Authorization: `Bearer ${Config.slackbot.token}`,
          }
        : {},
    })
      .then((res) => {
        if (res.status === 200) {
          res
            .arrayBuffer()
            .then((buffer) => resolve(arrayBufferToBase64(buffer)))
            .catch((err: string) => reject(err));
        }
        else {
          reject(res.status);
        }
      })
      .catch((err: any) => reject(err));
  });
};

export const getSlackFileBase64 = async (slackFileUrl: string) => {
  return await getFileBase64FromUrl(slackFileUrl, true);
};

// Serve static files
router.use(express.static(`${__dirname}/../public`));

router.get("/downloadSlackFile", async (req: Request, res: Response) => {
  if(!req.query.url) res.status(400).send(
    ResponsePacket.asJSON(false, "Failure", {
      error: "Invalid query parameters"
    })
  );
  if (typeof req.query.url === "string") {
    const filePublicUrl = await downloadFileFromUrl(req.query.url).catch(
      (err: string) => Logger.log(err)
    );
    if (filePublicUrl)
      res.status(200).send(
        ResponsePacket.asJSON(true, "Success", {
          filePublicUrl: filePublicUrl,
        })
      );
    else
      res.status(500).send(
        ResponsePacket.asJSON(false, "Failure", {
          error: `Could not download file at url: ${req.query.url}`,
        })
      );
  } else {
    res.status(422).send( // Could flesh out the error handling 422: (err): ResPack.AsJ(f,"Fail",`${x}` query parameter not provided)
      ResponsePacket.asJSON(false, "Failure", {
        error: "'url' query parameter not provided",
      })
    );
  }
});
router.get("/getSlackFileBase64", async (req: Request, res: Response) => {
  if (typeof req.query.url === "string") {
    const base64Data = await getSlackFileBase64(req.query.url).catch(
      (err: string) => Logger.log(err)
    );
    if (base64Data)
      res.send(
        ResponsePacket.asJSON(true, "Success", {
          base64Data: base64Data,
          mimetype: MIMETypeFromUrl(req.query.url),
        })
      );
    else
      res.send(
        ResponsePacket.asJSON(false, "Failure", {
          error: `Could not get base64Data from file at url: ${req.query.url}`,
        })
      );
  } else {
    res.send(
      ResponsePacket.asJSON(false, "Failure", {
        error: "url query param not provided",
      })
    );
  }
});

router.get("/media", (req: Request, res: Response) => {
  const maxCount =
    typeof req.query.maxCount === "string"
      ? Number.parseInt(req.query.maxCount)
      : -1;
  const sortedBy =
    <Database.SortedBy>req.query.sortedBy ?? Database.SortedBy.Default;
  const direction =
    <Database.Direction>req.query.direction ?? Database.Direction.Default;
  Database.getMedia(maxCount, sortedBy, direction)
    .then((response: Database.MediaResponseStructure[] | string) => {
      const successful: boolean =
        Boolean(response) &&
        !Object.prototype.hasOwnProperty.call(response, "message");
      res.send(
        ResponsePacket.asJSON(
          successful,
          successful ? "Success" : "Failure",
          response
        )
      );
    })
    .catch((err: any) =>
      res.status(500).send(
        ResponsePacket.asJSON(false, "Failure", {
          error: err,
        })
      )
    );
});
router.get("/mediaByColumnValue", (req: Request, res: Response) => {
  if (
    typeof req.query.columnID === "string" &&
    typeof req.query.columnValue === "string"
  ) {
    const maxCount =
      typeof req.query.maxCount === "string"
        ? Number.parseInt(req.query.maxCount)
        : null;
    const sortedBy =
      <Database.SortedBy>req.query.sortedBy ?? Database.SortedBy.Default;
    const direction =
      <Database.Direction>req.query.direction ?? Database.Direction.Default;
    Database.getMediaByColumnValue(req.query.columnID, req.query.columnValue)
      .then((response: Database.MediaResponseStructure[] | string) => {
        const successful: boolean =
          Boolean(response) &&
          !Object.prototype.hasOwnProperty.call(response, "message");
        res.send(
          ResponsePacket.asJSON(
            successful,
            successful ? "Success" : "Failure",
            response
          )
        );
      })
      .catch((err: any) =>
        res.status(500).send(
          ResponsePacket.asJSON(false, "Failure", {
            error: err,
          })
        )
      );
  }
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
    const cshUsername = req.body.cshUsername ?? "brewer";
    if (!files || !cshUsername) {
      res.send(
        ResponsePacket.error(
          "Malformed request! Analyze the 'data' property within this response to see what we received...",
          {
            cshUsername: cshUsername,
            files: files,
          }
        )
      );
    } else {
      let successfulUploads: string[] = [];
      let attemptedUploadCount = 0;
      if (typeof files !== "string") {
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
      } else {
        // File upload through slack interaction
        files = JSON.parse(files);
        for (const file of files) {
          attemptedUploadCount++;
          console.log("Uploaded file in loop: ");
          console.log(file);
          const thumbnailUrlSplit = file.thumb_360.split("/");
          const thumbnailFiletype =
            thumbnailUrlSplit[thumbnailUrlSplit.length - 1].split("."); // ["filename", "png"]
          console.log("tft: " + thumbnailFiletype);
          const thumbnailMimetype =
            MIMETypes[thumbnailFiletype[thumbnailFiletype.length - 1]]; // "image/png"
          console.log("tmt: " + thumbnailMimetype);
          const apiPublicFileUrl = await downloadFileFromUrl(file.url_private, true);
          await Database.insertMedia(
            file.user,
            cshUsername,
            apiPublicFileUrl,
            file.url_private,
            file.mimetype,
            file.thumb_360,
            thumbnailMimetype,
          );
          successfulUploads.push(file.url_private);
        }
      }
      const uploadDelta = attemptedUploadCount - successfulUploads.length;
      if (uploadDelta !== 0)
        throw new Error(`Upload aborted, at least 1 upload failed!`);
      res.send(
        ResponsePacket.asJSON(
          true,
          `Successfully uploaded all (${successfulUploads.length}) files!`,
          {
            files: successfulUploads,
          }
        )
      );
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).send(ResponsePacket.asJSON(false, err.toString()));
  }
});

module.exports = router;
