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
  await conn.query(`SELECT * FROM media`).then(
    ([_rows]: any) => {
      rows = _rows;
    }
  ).catch((err: any) => err);
  return rows;
}

export async function insertMedia(
  path: string,
  userID: string,
  upvotes: number = 0,
  downvotes: number = 0
): Promise<any> {
  /**
   * Inserts the described media into the database
   *
   * @remarks
   * This function does NOT store the actual media data, just the local path to the file.
   *
   * @param path - The path of the media
   * @returns Result of insertion query
   */
    const split = path.split("/");
    const filename = split[split.length-1];
    const query = `INSERT INTO media (name, path, userID, upvotes, downvotes)
            VALUES ('${filename}', '${path}', '${userID}', ${upvotes}, ${downvotes})`;
    return await conn.query(query)
}
// insertMedia("./test", "6942063213219").then(() => getMedia().then((res)=>console.log(res)));
