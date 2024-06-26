import mysql from "mysql2/promise";

const DEFAULT_CONFIG = {
  host: "localhost",
  user: "root",
  port: 33306,
  password: "admin",
  database: "shishadb",
};

const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG;

const connection = await mysql.createConnection(connectionString);

export class EntryModel {
  getAll = async ({ category }) => {
    let entries = [];

    try {
      if (category) {
        const lowerCaseCategory = category.toLowerCase();

        [entries] = await connection.query(
          `SELECT entries.id, users.username AS username, entries.title AS entry_title, entries.description,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', categories.id,
             'name', categories.name
           )
         ) AS categories
         FROM entries
         JOIN users ON entries.user_id = users.id
         JOIN entry_categories ON entries.id = entry_categories.entry_id
         JOIN categories ON entry_categories.category_id = categories.id
         WHERE categories.name = ?
         GROUP BY entries.id;`,
          [lowerCaseCategory]
        );

        return entries;
      }

      [entries] = await connection.query(
        `SELECT entries.id, users.username AS username, entries.title AS entry_title, entries.description,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'id', categories.id,
           'name', categories.name
         )
       ) AS categories
       FROM entries
       JOIN users ON entries.user_id = users.id
       JOIN entry_categories ON entries.id = entry_categories.entry_id
       JOIN categories ON entry_categories.category_id = categories.id
       GROUP BY entries.id;`
      );

      return entries;
    } catch (error) {
      throw new Error(error);
    }
  };

  getById = async ({ id }) => {
    try {
      const [entries] = await connection.query(
        `SELECT entries.id, users.username AS username, entries.title AS entry_title, entries.description,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'id', categories.id,
           'name', categories.name
         )
       ) AS categories
       FROM entries
       JOIN users ON entries.user_id = users.id
       JOIN entry_categories ON entries.id = entry_categories.entry_id
       JOIN categories ON entry_categories.category_id = categories.id
       WHERE entries.id = ?
       GROUP BY entries.id;`,
        [id]
      );

      if (entries.length === 0) return null;

      return entries[0];
    } catch (error) {
      throw new Error(error);
    }
  };

  create = async ({ userId, input }) => {
    const { title, description, entry_categories } = input;

    try {
      const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ?;",
        [userId]
      );

      if (existingUser.length === 0) {
        throw new Error("User not found");
      }

      // Insertar la entrada
      const [entryResult] = await connection.query(
        `INSERT INTO entries (user_id, title, description)
          VALUES (?, ?, ?);`,
        [userId, title, description]
      );

      // Obtener el id de la entrada recién insertada
      const entryId = entryResult.insertId;

      // Insertar entry_categories
      for (const entry_category of entry_categories) {
        const { category_name } = entry_category;
        // Verificar si la categoría ya existe
        const [categoryResult] = await connection.query(
          `SELECT id FROM categories WHERE name = ?`,
          [category_name]
        );
        let categoryId;
        if (categoryResult.length > 0) {
          categoryId = categoryResult[0].id;
        } else {
          // Si la categoría no existe, insertarla y obtener su id
          const [insertedCategory] = await connection.query(
            `INSERT INTO categories (name) VALUES (?)`,
            [category_name]
          );
          categoryId = insertedCategory.insertId;
        }
        // Insertar el enlace entre la entrada y la categoría
        await connection.query(
          `INSERT INTO entry_categories (entry_id, category_id) VALUES (?, ?)`,
          [entryId, categoryId]
        );
      }

      // Obtener la entrada completa
      const [entry] = await connection.query(
        `SELECT entries.id, users.username AS username, entries.title AS entry_title, entries.description,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', categories.id,
             'name', categories.name
           )
         ) AS categories
         FROM entries
         JOIN users ON entries.user_id = users.id
         JOIN entry_categories ON entries.id = entry_categories.entry_id
         JOIN categories ON entry_categories.category_id = categories.id
         WHERE entries.id = ?
         GROUP BY entries.id;`,
        [entryId]
      );

      return entry;
    } catch (e) {
      throw new Error(e);
    }
  };

  delete = async ({ id, userId }) => {
    try {
      const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ?;",
        [userId]
      );

      if (existingUser.length === 0) {
        throw new Error("User not found");
      }

      const [existingEntry] = await connection.query(
        "SELECT * FROM entries WHERE id = ? AND user_id = ?",
        [id, userId]
      );

      if (existingEntry.length === 0) {
        throw new Error("Entry not found");
      }

      const [result1] = await connection.query(
        "DELETE FROM entry_categories WHERE entry_id = ?",
        [id]
      );

      const [result2] = await connection.query(
        "DELETE FROM entries WHERE id = ? AND user_id = ?",
        [id, userId]
      );

      if (result1.affectedRows > 0 && result2.affectedRows > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  update = async ({ id, userId, input }) => {
    const { title, description, entry_categories } = input;

    try {
      const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ?;",
        [userId]
      );

      if (existingUser.length === 0) {
        throw new Error("User not found");
      }

      const [existingEntry] = await connection.query(
        "SELECT * FROM entries WHERE id = ? AND user_id = ?",
        [id, userId]
      );

      if (existingEntry.length === 0) {
        throw new Error("Entry not found");
      }

      const updateFields = [];
      const updateValues = [];
      let result1, result2;

      if (title !== undefined) {
        updateFields.push("title = ?");
        updateValues.push(title);
      }

      if (description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(description);
      }

      if (entry_categories !== undefined) {
        // Eliminar todos los registros de entry_categories para el entry_id dado
        await connection.query(
          "DELETE FROM entry_categories WHERE entry_id = ?",
          [id]
        );

        // Insertar los nuevos registros de entry_categories
        for (const entry_category of entry_categories) {
          const { category_name } = entry_category;
          // Verificar si la categoría ya existe
          const [categoryResult] = await connection.query(
            `SELECT id FROM categories WHERE name = ?`,
            [category_name]
          );
          let categoryId;
          if (categoryResult.length > 0) {
            categoryId = categoryResult[0].id;
          } else {
            // Si la categoría no existe, insertarla y obtener su id
            const [insertedCategory] = await connection.query(
              `INSERT INTO categories (name) VALUES (?)`,
              [category_name]
            );
            categoryId = insertedCategory.insertId;
          }
          // Insertar el enlace entre la entrada y la categoría
          [result1] = await connection.query(
            `INSERT INTO entry_categories (entry_id, category_id) VALUES (?, ?)`,
            [id, categoryId]
          );
        }
      }

      if (updateFields.length > 0) {
        [result2] = await connection.query(
          `UPDATE entries SET ${updateFields.join(", ")} WHERE id = ? AND user_id = ?`,
          [...updateValues, id, userId]
        );
      }

      // Verifica si se actualizó al menos una fila
      if (
        (result1 && result1.affectedRows > 0) ||
        (result2 && result2.affectedRows > 0)
      ) {
        const [entries] = await connection.query(
          `SELECT entries.id, users.username AS username, entries.title AS entry_title, entries.description,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', categories.id,
                'name', categories.name
              )
            ) AS categories
            FROM entries
            JOIN users ON entries.user_id = users.id
            JOIN entry_categories ON entries.id = entry_categories.entry_id
            JOIN categories ON entry_categories.category_id = categories.id
            WHERE entries.id = ?
            GROUP BY entries.id;`,
          [id]
        );
        return entries[0];
      } else {
        throw new Error("No data entered");
      }
    } catch (error) {
      throw new Error(error);
    }
  };
}
