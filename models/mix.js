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

export class MixModel {
  getAll = async ({ category }) => {
    if (category) {
      const lowerCaseCategory = category.toLowerCase();

      const [mixes] = await connection.query(
        `SELECT mixes.id, mixes.name AS mix_name, users.username AS username, 
        GROUP_CONCAT(DISTINCT CONCAT(flavours.name, ':', mix_flavours.percentage) ORDER BY mix_flavours.id) AS flavour_percentage_pairs, 
        GROUP_CONCAT(DISTINCT categories.name) AS category_names
        FROM mixes
        JOIN users ON mixes.user_id = users.id
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id
        JOIN mix_categories ON mixes.id = mix_categories.mix_id
        JOIN categories ON mix_categories.category_id = categories.id
        WHERE categories.name = ?
        GROUP BY mixes.id;`,
        [lowerCaseCategory]
      );

      return mixes;
    }

    const [mixes] = await connection.query(
      `SELECT mixes.id, mixes.name AS mix_name, users.username AS username, 
      GROUP_CONCAT(DISTINCT CONCAT(flavours.name, ':', mix_flavours.percentage) ORDER BY mix_flavours.id) AS flavour_percentage_pairs, 
      GROUP_CONCAT(DISTINCT categories.name) AS category_names
      FROM mixes
      JOIN users ON mixes.user_id = users.id
      JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
      JOIN flavours ON mix_flavours.flavour_id = flavours.id
      JOIN mix_categories ON mixes.id = mix_categories.mix_id
      JOIN categories ON mix_categories.category_id = categories.id
      GROUP BY mixes.id;`
    );

    return mixes;
  };

  getById = async ({ id }) => {
    const [mixes] = await connection.query(
      `SELECT mixes.id, mixes.name AS mix_name, users.username AS username, 
      GROUP_CONCAT(DISTINCT CONCAT(flavours.name, ':', mix_flavours.percentage) ORDER BY mix_flavours.id) AS flavour_percentage_pairs, 
      GROUP_CONCAT(DISTINCT categories.name) AS category_names
      FROM mixes
      JOIN users ON mixes.user_id = users.id
      JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
      JOIN flavours ON mix_flavours.flavour_id = flavours.id
      JOIN mix_categories ON mixes.id = mix_categories.mix_id
      JOIN categories ON mix_categories.category_id = categories.id
      WHERE mixes.id = ?
      GROUP BY mixes.id;`,
      [id]
    );

    if (mixes.length === 0) return null;

    return mixes;
  };

  create = async ({ input }) => {
    const { name, username, mix_flavours, mix_categories } = input;

    try {
      // Insertar la mezcla
      await connection.query(
        `INSERT INTO mixes (user_id, name)
          VALUES ((SELECT id FROM users WHERE username = ?), ?);`,
        [username, name]
      );

      // Obtener el id de la mezcla recién insertada
      const [mixResult] = await connection.query(
        `SELECT id FROM mixes WHERE name = ?`,
        [name]
      );
      const mixId = mixResult[0].id;

      // Insertar mix_flavours
      for (const mix_flavour of mix_flavours) {
        const { flavour_name, percentage } = mix_flavour;
        await connection.query(
          `INSERT INTO mix_flavours (mix_id, flavour_id, percentage)
            VALUES (?, (SELECT id FROM flavours WHERE name = ?), ?)`,
          [mixId, flavour_name, percentage]
        );
      }

      // Insertar mix_categories
      for (const mix_category of mix_categories) {
        const { category_name } = mix_category;
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
        // Insertar el enlace entre la mezcla y la categoría
        await connection.query(
          `INSERT INTO mix_categories (mix_id, category_id) VALUES (?, ?)`,
          [mixId, categoryId]
        );
      }

      // Obtener la mezcla completa
      const [mixes] = await connection.query(
        `SELECT mixes.id, mixes.name AS mix_name, users.username AS username, 
        GROUP_CONCAT(DISTINCT CONCAT(flavours.name, ':', mix_flavours.percentage) ORDER BY mix_flavours.id) AS flavour_percentage_pairs, 
        GROUP_CONCAT(DISTINCT categories.name) AS category_names
        FROM mixes
        JOIN users ON mixes.user_id = users.id
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id
        JOIN mix_categories ON mixes.id = mix_categories.mix_id
        JOIN categories ON mix_categories.category_id = categories.id
        WHERE mixes.id = ?
        GROUP BY mixes.id;`,
        [mixId]
      );

      return mixes;
    } catch (error) {
      throw new Error("Error creating a new mix: " + error);
    }
  };

  delete = async ({ id }) => {
    try {
      const [result1] = await connection.query(
        "DELETE FROM mix_flavours WHERE mix_id = ?",
        [id]
      );

      const [result2] = await connection.query(
        "DELETE FROM mix_categories WHERE mix_id = ?",
        [id]
      );

      const [result3] = await connection.query(
        "DELETE FROM mixes WHERE id = ?",
        [id]
      );

      if (
        result1.affectedRows > 0 &&
        result2.affectedRows > 0 &&
        result3.affectedRows > 0
      ) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error("Error deleting the mix: " + error);
    }
  };

  update = async ({ id, input }) => {
    const { name, mix_flavours, mix_categories } = input;

    try {
      const [existingMix] = await connection.query(
        "SELECT * FROM mixes WHERE id = ?",
        [id]
      );

      if (existingMix.length === 0) {
        throw new Error("Mix not found");
      }

      let result1, result2, result3;

      if (name != undefined) {
        // Actualizar el nombre de la mezcla
        [result1] = await connection.query(
          "UPDATE mixes SET name = ? WHERE id = ?",
          [name, id]
        );
      }

      if (mix_flavours !== undefined) {
        // Eliminar todos los registros de mix_flavours para el mix_id dado
        await connection.query("DELETE FROM mix_flavours WHERE mix_id = ?", [
          id,
        ]);

        // Insertar los nuevos registros de mix_flavours
        for (const mix_flavour of mix_flavours) {
          const { flavour_name, percentage } = mix_flavour;
          [result2] = await connection.query(
            `INSERT INTO mix_flavours (mix_id, flavour_id, percentage)
            VALUES (?, (SELECT id FROM flavours WHERE name = ?), ?)`,
            [id, flavour_name, percentage]
          );
        }
      }

      if (mix_categories !== undefined) {
        // Eliminar todos los registros de mix_categories para el mix_id dado
        await connection.query("DELETE FROM mix_categories WHERE mix_id = ?", [
          id,
        ]);

        // Insertar los nuevos registros de mix_categories
        for (const mix_category of mix_categories) {
          const { category_name } = mix_category;
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
          // Insertar el enlace entre la mezcla y la categoría
          [result3] = await connection.query(
            `INSERT INTO mix_categories (mix_id, category_id) VALUES (?, ?)`,
            [id, categoryId]
          );
        }
      }

      // Verifica si se actualizó al menos una fila
      if (
        (result1 && result1.affectedRows > 0) ||
        (result2 && result2.affectedRows > 0) ||
        (result3 && result3.affectedRows > 0)
      ) {
        // Obtener la mezcla completa utilizando su id actualizado
        const [mixes] = await connection.query(
          `SELECT mixes.id, mixes.name AS mix_name, users.username AS username, 
          GROUP_CONCAT(DISTINCT CONCAT(flavours.name, ':', mix_flavours.percentage) ORDER BY mix_flavours.id) AS flavour_percentage_pairs, 
          GROUP_CONCAT(DISTINCT categories.name) AS category_names
          FROM mixes
          JOIN users ON mixes.user_id = users.id
          JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
          JOIN flavours ON mix_flavours.flavour_id = flavours.id
          JOIN mix_categories ON mixes.id = mix_categories.mix_id
          JOIN categories ON mix_categories.category_id = categories.id
          WHERE mixes.id = ?
          GROUP BY mixes.id;`,
          [id]
        );
        return mixes[0];
      } else {
        throw new Error("No data entered");
      }
    } catch (error) {
      throw new Error("Error updating the mix: " + error);
    }
  };
}
