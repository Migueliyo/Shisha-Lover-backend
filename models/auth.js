import mysql from "mysql2/promise";
import jwt from "jsonwebtoken"
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
    const { email, password } = input;
    
    const [user] = await connection.query(
        'SELECT * FROM users WHERE email = ?' , email
    )

    if (user.length === 0) 
        throw new Error("User not found");

    const validPassword = await bcrypt.compare(password, user[0].password);

    if (!validPassword) 
        throw new Error("Incorrect password");
    
    // create token
    const jwtToken = jwt.sign(
      {
        email: user[0].email,
        id: user[0].id,
      },
      process.env.TOKEN_SECRET
    );

    return jwtToken;
  };

  register = async () => {};
}
