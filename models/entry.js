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
    if (category) {
      const lowerCaseCategory = category.toLowerCase();

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
         WHERE categories.name = ?
         GROUP BY entries.id;`,
         [lowerCaseCategory]
      );

      return entries;
    }

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
       GROUP BY entries.id;`
    );

    return entries;
  };

  getById = async ({ id }) => {
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
  };

  create = async ({ input }) => {
    const { username, title, description, entry_categories } = input;

    const [userIdResult] = await connection.query(
      "SELECT id FROM users WHERE username = ?",
      username
    );

    if (userIdResult.length === 0) {
      throw new Error("User not exist");
    }

    const userId = userIdResult[0].id;

    try {
      // Insertar la entrada
      await connection.query(
        `INSERT INTO entries (user_id, title, description)
          VALUES (?, ?, ?);`,
        [userId, title, description]
      );

      // Obtener el id de la entrada recién insertada
      const [entryResult] = await connection.query(
        `SELECT id FROM entries WHERE title = ?`,
        [title]
      );
      const entryId = entryResult[0].id;

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
      throw new Error("Error creating the entry ->" + e);
    }
  };

  delete = async ({ id }) => {
    try {
      const [result1] = await connection.query(
        "DELETE FROM entry_categories WHERE entry_id = ?",
        [id]
      );

      const [result2] = await connection.query(
        "DELETE FROM entries WHERE id = ?",
        [id]
      );

      if (result1.affectedRows > 0 && result2.affectedRows > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error("Error deleting the entry");
    }
  };

  update = async ({ id, input }) => {
    const { username, title, description, entry_categories } = input;

    try {
      const [existingEntry] = await connection.query(
        "SELECT * FROM entries WHERE id = ?",
        [id]
      );

      if (existingEntry.length === 0) {
        throw new Error("Entry not found");
      }

      const updateFields = [];
      const updateValues = [];
      let result1, result2;

      if (username !== undefined) {
        const [userIdResult] = await connection.query(
          "SELECT id FROM users WHERE username = ?",
          username
        );
    
        if (userIdResult.length === 0) {
          throw new Error("User not exist");
        }

        updateFields.push("user_id = ?");
        updateValues.push(userIdResult[0].id);
      }

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
          `UPDATE entries SET ${updateFields.join(", ")} WHERE id = ?`,
          [...updateValues, id]
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
      throw new Error("Error updating the entry -> " + error);
    }
  };
}
