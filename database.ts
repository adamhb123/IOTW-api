import mysql from "mysql2";
import Config from "./config";

const dbConfig = {
  host: Config.mysql.host,
  port: Config.mysql.port,
  user: Config.mysql.user,
  password: Config.mysql.password,
  database: Config.mysql.databaseName,
};

mysql.createConnection(dbConfig);
const conn = mysql.createPool(dbConfig).promise();

export async function getMedia(): Promise<any> {
  /**
   * Retrieves and returns all media in the database
   *
   * @returns All media in the database
   */
  // could replace 'media' with a 'TABLE_NAME' envvar
  let rows;
  await conn
    .query(`SELECT * FROM media`)
    .then(([_rows]: any) => {
      rows = _rows;
    })
    .catch((err: any) => err);
  return rows;
}

export async function insertMedia(
  slackPrivateUrl: string,
  uploaderID: string,
  updoots: number = 0,
  downdoots: number = 0
): Promise<any> {
  /**
   * Inserts the described media into the database
   *
   * @remarks
   * This function does NOT store the actual media data, just the local path to the file.
   *
   * @param slackPrivateUrl - The slack private url of the media
   * @param uploaderID - The uploader's slack ID
   * @param updoots - Updoot count
   * @param downdoots - Downdoot count
   * @returns Result of insertion query
   */
  const query = `INSERT INTO media (uploaderID, slackPrivateUrl, updoots, downdoots)
            VALUES ('${uploaderID}', '${slackPrivateUrl}', ${updoots}, ${downdoots})`;
  return await conn.query(query);
}
