import mysql from "mysql2";
import Config from "./config";
import Logger from "easylogger-ts";

export interface MediaResponseStructure {
  uploaderID: string;
  cshUsername: string;
  apiPublicFileUrl: string;
  imageUrl: string;
  imageMimetype: string;
  thumbnailUrl: string;
  thumbnailMimetype: string;
  updoots: number;
  downdoots: number;
}

export enum SortedBy {
  Updoots = "updoots",
  Downdoots = "downdoots",
  UploaderID = "uploaderID",
  CSHUsername = "cshUsername",
  DootDifference = "dootDifference",
  AbsoluteDootDifference = "absoluteDootDifference",
  Default = "updoots",
}

export enum Direction {
  Ascending = "ascending",
  Descending = "descending",
  Default = "descending",
}
const directionEnumToSQL = (input: Direction) =>
  input === "ascending" ? "ASC" : input === "descending" ? "DESC" : "DESC";

const dbConfig = {
  host: Config.mysql.host,
  port: Config.mysql.port,
  user: Config.mysql.user,
  password: Config.mysql.password,
  database: Config.mysql.databaseName,
};

mysql.createConnection(dbConfig);
const conn = mysql.createPool(dbConfig).promise();

/**
 * Retrieves and returns all media in the database
 *
 * @returns All media in the database
 */
export async function getMedia(
  maxCount: number = -1,
  sortedBy: SortedBy = SortedBy.Default,
  direction: Direction = Direction.Default
): Promise<any> {
  // could replace 'media' with a 'TABLE_NAME' envvar
  let result: any;
  const sqlDirection = directionEnumToSQL(direction);
  await conn
    .query(
      `SELECT * FROM media ORDER BY ${sortedBy} ${sqlDirection} ${
        maxCount > 0 ? `LIMIT ${maxCount}` : ""
      }`
    )
    .then(([_rows]: any) => {
      result = _rows;
    })
    .catch((err: any) => (result = err));
  return result;
}

export async function getMediaByColumnValue(
  column_id: string,
  column_value: string,
  maxCount: number = -1,
  sortedBy: SortedBy = SortedBy.Default,
  direction: Direction = Direction.Default
): Promise<any> {
  let result: any;
  const sqlDirection = directionEnumToSQL(direction);
  await conn
    .query(
      `SELECT * FROM media WHERE ${column_id}=${column_value} ORDER BY ${sortedBy} ${sqlDirection} ${
        maxCount > 0 ? `LIMIT ${maxCount}` : ""
      }`
    )
    .then(([_rows]: any) => {
      result = _rows;
    })
    .catch((err: any) => (result = err));
  return result;
}

/**
 * Inserts the described media into the database
 *
 * @param uploaderID - The uploader's slack ID
 * @param cshUsername - The uploader's csh username
 * @param apiPublicFileUrl - DB api url
 * @param imageUrl - Slack private image url
 * @param imageMimetype - Slack private image mimetype
 * @param thumbnailUrl - Slack thumb_360 url
 * @param thumbnailMimetype - Slack thumb_360 mimetype
 * @param updoots - Updoot count
 * @param downdoots - Downdoot count
 * @returns Result of insertion query
 */
export async function insertMedia(
  uploaderID: string,
  cshUsername: string,
  apiPublicFileUrl: string,
  imageUrl: string,
  imageMimetype: string,
  thumbnailUrl: string,
  thumbnailMimetype: string,
  updoots: number = 0,
  downdoots: number = 0
): Promise<any> {
  const query = `INSERT INTO media (uploaderID, cshUsername, apiPublicFileUrl, imageUrl, imageMimetype, thumbnailUrl, thumbnailMimetype, updoots, downdoots)
            VALUES ("${uploaderID}", "${cshUsername}", "${apiPublicFileUrl}","${imageUrl}", "${imageMimetype}", "${thumbnailUrl}", "${thumbnailMimetype}", ${updoots}, ${downdoots})`;
  return await conn.query(query);
}

export default {
  SortedBy,
  Direction,
  getMedia,
  getMediaByColumnValue,
  insertMedia,
};
