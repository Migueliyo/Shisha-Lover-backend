import mysql from "mysql2/promise";
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

export class UserModel {
  getAll = async () => {
    const [users] = await connection.query("SELECT * FROM users;");

    return users;
  };

  getById = async ({ id }) => {
    const [users] = await connection.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);

    if (users.length === 0) return null;

    return users[0];
  };

  create = async ({ input }) => {
    const { username, password, first_name, last_name, email } = input;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await connection.query(
        `INSERT INTO users (username, password, first_name, last_name, email)
          VALUES (?, ?, ?, ?, ?);`,
        [username, hashedPassword, first_name, last_name, email]
      );
    } catch (e) {
      throw new Error("Error creating the user");
    }

    const [users] = await connection.query(
      "SELECT * FROM users WHERE username = ?",
      username
    );

    return users[0];
  };

  delete = async ({ id }) => {
    try {
      const [result] = await connection.query(
        "DELETE FROM users WHERE id = ?",
        id
      );

      if (result.affectedRows > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error("Error deleting the user");
    }
  };

  update = async ({ id, input }) => {
    const { username, password, first_name, last_name, email } = input;

    try {
      const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ?",
        [id]
      );

      if (existingUser.length === 0) {
        throw new Error("User not found");
      }

      const updateFields = [];
      const updateValues = [];

      if (username !== undefined) {
        updateFields.push("username = ?");
        updateValues.push(username);
      }

      if (password !== undefined) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push("password = ?");
        updateValues.push(hashedPassword);
      }

      if (first_name !== undefined) {
        updateFields.push("first_name = ?");
        updateValues.push(first_name);
      }

      if (last_name !== undefined) {
        updateFields.push("last_name = ?");
        updateValues.push(last_name);
      }

      if (email !== undefined) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }

      if (updateFields.length > 0) {
        const [result] = await connection.query(
          `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
          [...updateValues, id]
        );

        // Verifica si se actualizó al menos una fila
        if (result.affectedRows > 0) {
          const [users] = await connection.query(
            "SELECT * FROM users WHERE id = ?",
            [id]
          );
          return users[0];
        }
      } else {
        throw new Error("No data entered");
      }
    } catch (error) {
      throw new Error("Error updating the user");
    }
  };
}
