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
  getAll = async ({ category, flavour }) => {
    let lowerCaseCategory, lowerCaseFlavour;
    let query = `
        SELECT 
        mixes.id, 
        mixes.name AS mix_name, 
        users.username AS username, 
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', flavours.id, 
                'name', flavours.name, 
                'percentage', mix_flavours.percentage
            )
        ) AS flavours, 
        (
            SELECT JSON_ARRAYAGG(JSON_OBJECT('id', category_id, 'name', c.name)) 
            FROM (
                SELECT DISTINCT flavour_categories.category_id 
                FROM flavour_categories 
                JOIN mix_flavours ON flavour_categories.flavour_id = mix_flavours.flavour_id
                WHERE mix_flavours.mix_id = mixes.id
            ) AS unique_categories
            JOIN categories c ON unique_categories.category_id = c.id`;

    if (category) {
      lowerCaseCategory = category.toLowerCase();
      query += `
            WHERE c.name = ?`;
    }

    query += `
            ) AS categories
        FROM mixes
        JOIN users ON mixes.user_id = users.id
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id`;

    if (flavour) {
      lowerCaseFlavour = flavour.toLowerCase();
      query += `
        WHERE flavours.name = ?`;
    }

    query += `
        GROUP BY mixes.id, mixes.name, users.username
        HAVING categories IS NOT NULL`;

    let params = [];
    if (category && flavour) {
      params = [lowerCaseCategory, lowerCaseFlavour];
    } else if (category) {
      params = [lowerCaseCategory];
    } else if (flavour) {
      params = [lowerCaseFlavour];
    }

    const [mixes] = await connection.query(query, params);
    return mixes;
  };

  getById = async ({ id }) => {
    const [mixes] = await connection.query(
      `SELECT 
      mixes.id, 
      mixes.name AS mix_name, 
      users.username AS username, 
      JSON_ARRAYAGG(
          JSON_OBJECT(
              'id', flavours.id, 
              'name', flavours.name, 
              'percentage', mix_flavours.percentage
          )
      ) AS flavours, 
      (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', category_id, 'name', c.name)) 
          FROM (
              SELECT DISTINCT flavour_categories.category_id 
              FROM flavour_categories 
              JOIN mix_flavours ON flavour_categories.flavour_id = mix_flavours.flavour_id
              WHERE mix_flavours.mix_id = mixes.id
          ) AS unique_categories
          JOIN categories c ON unique_categories.category_id = c.id
      ) AS categories
      FROM mixes
      JOIN users ON mixes.user_id = users.id
      JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
      JOIN flavours ON mix_flavours.flavour_id = flavours.id
      WHERE mixes.id = ?
      GROUP BY mixes.id, mixes.name, users.username;`,
      [id]
    );

    if (mixes.length === 0) return null;

    return mixes;
  };

  create = async ({ input }) => {
    const { name, username, mix_flavours } = input;
    let mixId = null; // Inicializar mixId con un valor predeterminado
  
    try {
      const [existingUser] = await connection.query(
        'SELECT * FROM users WHERE username = ?;',
        [username]
      );
  
      if (existingUser.length === 0) {
        throw new Error("User not found");
      }
  
      // Insertar la mezcla
      const [insertResult] = await connection.query(
        `INSERT INTO mixes (user_id, name)
          VALUES ((SELECT id FROM users WHERE username = ?), ?);`,
        [username, name]
      );
  
      // Obtener el id de la mezcla recién insertada
      mixId = insertResult.insertId;
  
      // Insertar mix_flavours
      for (const mix_flavour of mix_flavours) {
        // Verificar que todos los sabores existen en la base de datos
        const existingFlavours = await Promise.all(
          mix_flavours.map(async (mix_flavour) => {
            const { flavour_name } = mix_flavour;
            const [flavourResult] = await connection.query(
              "SELECT id FROM flavours WHERE name = ?",
              [flavour_name]
            );
            return flavourResult.length > 0;
          })
        );
  
        if (!existingFlavours.every((flavourExists) => flavourExists)) {
          throw new Error("One or more flavours do not exist");
        }
  
        const { flavour_name, percentage } = mix_flavour;
        await connection.query(
          `INSERT INTO mix_flavours (mix_id, flavour_id, percentage)
          VALUES (?, (SELECT id FROM flavours WHERE name = ?), ?);`,
          [mixId, flavour_name, percentage]
        );
      }
  
      // Verificar que mixId no sea null antes de ejecutar la última consulta
      if (mixId !== null) {
        // Obtener la mezcla completa
        const [mixes] = await connection.query(
          `SELECT 
          mixes.id, 
          mixes.name AS mix_name, 
          users.username AS username, 
          JSON_ARRAYAGG(
              JSON_OBJECT(
                  'id', flavours.id, 
                  'name', flavours.name, 
                  'percentage', mix_flavours.percentage
              )
          ) AS flavours, 
          (
              SELECT JSON_ARRAYAGG(JSON_OBJECT('id', category_id, 'name', c.name)) 
              FROM (
                  SELECT DISTINCT flavour_categories.category_id 
                  FROM flavour_categories 
                  JOIN mix_flavours ON flavour_categories.flavour_id = mix_flavours.flavour_id
                  WHERE mix_flavours.mix_id = mixes.id
              ) AS unique_categories
              JOIN categories c ON unique_categories.category_id = c.id
          ) AS categories
          FROM mixes
          JOIN users ON mixes.user_id = users.id
          JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
          JOIN flavours ON mix_flavours.flavour_id = flavours.id
          WHERE mixes.id = ?
          GROUP BY mixes.id, mixes.name, users.username;`,
          [mixId]
        );
  
        return mixes;
      } else {
        throw new Error("mixId is null");
      }
    } catch (error) {
      // Eliminar la mezcla que se había creado por error si mixId no es null
      if (mixId !== null) {
        await connection.query("DELETE FROM mixes WHERE id = ?", mixId);
      }
      throw new Error("Error creating a new mix -> " + error);
    }
  };
  

  delete = async ({ id }) => {
    try {
      const [result1] = await connection.query(
        "DELETE FROM mix_flavours WHERE mix_id = ?;",
        [id]
      );

      const [result2] = await connection.query(
        "DELETE FROM mixes WHERE id = ?;",
        [id]
      );

      if (result1.affectedRows > 0 && result2.affectedRows > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error("Error deleting the mix: " + error);
    }
  };

  update = async ({ id, input }) => {
    const { name, mix_flavours } = input;

    try {
      const [existingMix] = await connection.query(
        "SELECT * FROM mixes WHERE id = ?;",
        [id]
      );

      if (existingMix.length === 0) {
        throw new Error("Mix not found");
      }

      let result1, result2;

      if (mix_flavours !== undefined) {
        // Verificar que todos los sabores existen en la base de datos
        const existingFlavours = await Promise.all(
          mix_flavours.map(async (mix_flavour) => {
            const { flavour_name } = mix_flavour;
            const [flavourResult] = await connection.query(
              "SELECT id FROM flavours WHERE name = ?",
              [flavour_name]
            );
            return flavourResult.length > 0;
          })
        );

        if (!existingFlavours.every((flavourExists) => flavourExists)) {
          throw new Error("One or more flavours do not exist");
        }

        // Eliminar todos los registros de mix_flavours para el mix_id dado
        await connection.query("DELETE FROM mix_flavours WHERE mix_id = ?", [
          id,
        ]);

        // Insertar los nuevos registros de mix_flavours
        for (const mix_flavour of mix_flavours) {
          const { flavour_name, percentage } = mix_flavour;
          [result1] = await connection.query(
            `INSERT INTO mix_flavours (mix_id, flavour_id, percentage)
            VALUES (?, (SELECT id FROM flavours WHERE name = ?), ?)`,
            [id, flavour_name, percentage]
          );
        }
      }

      if (name != undefined) {
        // Actualizar el nombre de la mezcla
        [result2] = await connection.query(
          "UPDATE mixes SET name = ? WHERE id = ?",
          [name, id]
        );
      }

      // Verifica si se actualizó al menos una fila
      if (
        (result1 && result1.affectedRows > 0) ||
        (result2 && result2.affectedRows > 0)
      ) {
        // Obtener la mezcla completa utilizando su id actualizado
        const [mixes] = await connection.query(
          `SELECT 
          mixes.id, 
          mixes.name AS mix_name, 
          users.username AS username, 
          JSON_ARRAYAGG(
              JSON_OBJECT(
                  'id', flavours.id, 
                  'name', flavours.name, 
                  'percentage', mix_flavours.percentage
              )
          ) AS flavours, 
          (
              SELECT JSON_ARRAYAGG(JSON_OBJECT('id', category_id, 'name', c.name)) 
              FROM (
                  SELECT DISTINCT flavour_categories.category_id 
                  FROM flavour_categories 
                  JOIN mix_flavours ON flavour_categories.flavour_id = mix_flavours.flavour_id
                  WHERE mix_flavours.mix_id = mixes.id
              ) AS unique_categories
              JOIN categories c ON unique_categories.category_id = c.id
          ) AS categories
          FROM mixes
          JOIN users ON mixes.user_id = users.id
          JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
          JOIN flavours ON mix_flavours.flavour_id = flavours.id
          WHERE mixes.id = ?
          GROUP BY mixes.id, mixes.name, users.username;`,
          [id]
        );
        return mixes[0];
      } else {
        throw new Error("No data entered");
      }
    } catch (error) {
      throw new Error("Error updating the mix -> " + error);
    }
  };
}
