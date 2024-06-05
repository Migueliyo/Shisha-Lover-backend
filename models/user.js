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
  getAll = async ({ email, username }) => {
    try {
      let users = [];
      
      if (email) {
        [users] = await connection.query(
          `SELECT 
          users.id, 
          users.username, 
          users.password, 
          users.first_name, 
          users.last_name, 
          users.email, 
          users.description,
          users.avatar,
          users.created_at,
          JSON_ARRAYAGG(
              CASE WHEN mix_likes.mix_id IS NOT NULL THEN JSON_OBJECT('mix_id', mix_likes.mix_id) ELSE NULL END
          ) AS liked_mixes
        FROM users
        LEFT JOIN mix_likes ON users.id = mix_likes.user_id
        WHERE users.email = ?
        GROUP BY users.id;`,
          [email]
        );
  
        return users[0];
      }
  
      if (username) {
        [users] = await connection.query(
          `SELECT 
          users.id, 
          users.username, 
          users.password, 
          users.first_name, 
          users.last_name, 
          users.email, 
          users.description,
          users.avatar,
          users.created_at,
          JSON_ARRAYAGG(
              CASE WHEN mix_likes.mix_id IS NOT NULL THEN JSON_OBJECT('mix_id', mix_likes.mix_id) ELSE NULL END
          ) AS liked_mixes
        FROM users
        LEFT JOIN mix_likes ON users.id = mix_likes.user_id
        WHERE users.username = ?
        GROUP BY users.id;`,
          [username]
        );
  
        return users[0];
      }
  
      [users] = await connection.query(
        `SELECT 
        users.id, 
        users.username, 
        users.password, 
        users.first_name, 
        users.last_name, 
        users.email, 
        users.avatar,
        users.description,
        users.created_at,
        JSON_ARRAYAGG(
            CASE WHEN mix_likes.mix_id IS NOT NULL THEN JSON_OBJECT('mix_id', mix_likes.mix_id) ELSE NULL END
        ) AS liked_mixes
      FROM users
      LEFT JOIN mix_likes ON users.id = mix_likes.user_id
      GROUP BY users.id;`
      );
  
      return users;
    } catch (error) {
      throw new Error(error);
    }
  };
  

  getById = async ({ id }) => {
    try {
      const [users] = await connection.query(
        `SELECT 
        users.id, 
        users.username, 
        users.password, 
        users.first_name, 
        users.last_name, 
        users.email, 
        users.description,
        users.avatar,
        users.created_at,
        JSON_ARRAYAGG(
            CASE WHEN mix_likes.mix_id IS NOT NULL THEN JSON_OBJECT('mix_id', mix_likes.mix_id) ELSE NULL END
        ) AS liked_mixes
      FROM users
      LEFT JOIN mix_likes ON users.id = mix_likes.user_id
      WHERE users.id = ?
      GROUP BY users.id;`,
        [id]
      );

      if (users.length === 0) return null;

      return users[0];
    } catch (error) {
      throw new Error(error);
    }
  };

  create = async ({ input }) => {
    const { username, password, first_name, last_name, email, description } = input;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      await connection.query(
        `INSERT INTO users (username, password, first_name, last_name, email, description)
          VALUES (?, ?, ?, ?, ?);`,
        [username, hashedPassword, first_name, last_name, email, description]
      );

      const [users] = await connection.query(
        `SELECT 
        users.id, 
        users.username, 
        users.password, 
        users.first_name, 
        users.last_name, 
        users.email, 
        users.avatar,
        users.description,
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
    const { username, password, first_name, last_name, email, description } = input;

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

      if (description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(description);
      }

      if (updateFields.length > 0) {
        const [result] = await connection.query(
          `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
          [...updateValues, id]
        );

        // Verifica si se actualizó al menos una fila
        if (result.affectedRows > 0) {
          const [users] = await connection.query(
            `SELECT 
              users.id, 
              users.username, 
              users.password, 
              users.first_name, 
              users.last_name, 
              users.email, 
              users.description,
              users.avatar,
              users.created_at,
              JSON_ARRAYAGG(
                  CASE WHEN mix_likes.mix_id IS NOT NULL THEN JSON_OBJECT('mix_id', mix_likes.mix_id) ELSE NULL END
              ) AS liked_mixes
            FROM users
            LEFT JOIN mix_likes ON users.id = mix_likes.user_id
            WHERE users.id = ?
            GROUP BY users.id;`,
            [id]
          );
          return users[0];
        }
      } else {
        throw new Error("No data entered");
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  updateAvatar = async ({ id, avatar }) => {
    try {
      const [result] = await connection.query(
        "UPDATE users SET avatar = ? WHERE id = ?",
        [avatar, id]
      );

      if (result.affectedRows > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error("Error updating the avatar");
    }
  };
}
