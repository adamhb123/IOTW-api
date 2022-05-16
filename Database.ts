import mysql from "mysql2";
import Config from "./Config";

const conn = mysql.createConnection({
  host: Config.mysql.host,
  user: Config.mysql.user,
  password: Config.mysql.password,
  database: Config.mysql.databaseName,
});

export function getMedia() {
  /**
   * Retrieves and returns all media in the database
   *
   * @remarks
   * This is our math utilities lib for shared projects.
   *
   * @returns All media in the database
   */
  conn.query("SELECT * FROM ", (err, rows) => {
    if (err) throw err;
    console.log(rows);
    return rows;
  });
}

export function insertMedia(
  path: string,
  userID: string,
  upvotes: number = 0,
  downvotes: number = 0
) {
  /**
   * Inserts the described media into the database
   *
   * @remarks
   * This function does NOT store the actual media data, just the local path to the file.
   *
   * @param path - The path of the media
   * @returns Whether the database modification was successful or not
   */
  conn.query("SELECT MAX(ID) AS maxID from media", (res: Response) => {
    const filename = path.split("/")[-1];
    const query = `INSERT INTO media (name, path, userID, upvotes, downvotes)
             VALUES ('${filename}', '${path}', '${userID}', ${upvotes}, ${downvotes})`;
    conn.query(query, (err, result) => {
      if (err) throw err;
      console.log(result);
    });
  });
}
insertMedia("test", "6942069");
