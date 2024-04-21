import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const DEFAULT_CONFIG = {
  host: "localhost",
  user: "root",
  port: 33306,
  password: "admin",
  database: "shishadb",
};

const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG;

const connection = await mysql.createConnection(connectionString);

export class AuthModel {
  login = async ({ input }) => {
    try {
      const { email, password } = input;

      const [user] = await connection.query(
        "SELECT * FROM users WHERE email = ?",
        email
      );

      if (user.length === 0) throw new Error("User not found");

      const validPassword = await bcrypt.compare(password, user[0].password);

      if (!validPassword) throw new Error("Incorrect password");

      // create token
      const jwtToken = jwt.sign(
        {
          username: user[0].username,
          email: user[0].email,
          first_name: user[0].first_name,
          last_name: user[0].last_name,
          created_at: user[0].created_at
        },
        process.env.TOKEN_SECRET
      );

      return jwtToken;
    } catch (error) {
      throw new Error(error)
    }
  };

  register = async ({ input }) => {
    const { username, password, first_name, last_name, email } = input;
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      await connection.query(
        `INSERT INTO users (username, password, first_name, last_name, email)
          VALUES (?, ?, ?, ?, ?);`,
        [username, hashedPassword, first_name, last_name, email]
      );

      const [users] = await connection.query(
        `SELECT 
        users.id, 
        users.username, 
        users.password, 
        users.first_name, 
        users.last_name, 
        users.email, 
        users.created_at,
        JSON_ARRAYAGG(
            CASE WHEN mix_likes.mix_id IS NOT NULL THEN JSON_OBJECT('mix_id', mix_likes.mix_id) ELSE NULL END
        ) AS liked_mixes
        FROM users
        LEFT JOIN mix_likes ON users.id = mix_likes.user_id
        WHERE users.username = ?
        GROUP BY users.id;`,
        username
      );

      return users[0];
    } catch (e) {
      throw new Error(e);
    }
  };
}
