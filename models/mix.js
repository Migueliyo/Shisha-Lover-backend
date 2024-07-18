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
    let mixes = [];

    try {
      let lowerCaseCategory, lowerCaseFlavour;
      let query = `
        SELECT 
          mixes.id, 
          mixes.name AS mix_name, 
          users.username AS username, 
          (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', mix_likes.id, 
                    'username', like_users.username
                )
            )
            FROM mix_likes
            JOIN users like_users ON mix_likes.user_id = like_users.id
            WHERE mix_likes.mix_id = mixes.id
          ) AS likes,
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
          ) AS categories,
          (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'id', mix_comments.id, 
                      'username', users.username, 
                      'avatar', users.avatar,                      
                      'content', mix_comments.content
                  )
              )
              FROM mix_comments
              WHERE mix_comments.mix_id = mixes.id
          ) AS comments
        FROM mixes
        JOIN users ON mixes.user_id = users.id
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id`;

      let conditions = [];
      let params = [];

      if (category) {
        lowerCaseCategory = category.toLowerCase();
        conditions.push(`EXISTS (SELECT 1 FROM categories c WHERE LOWER(c.name) = ? AND c.id IN 
          (SELECT category_id FROM flavour_categories fc JOIN mix_flavours mf ON fc.flavour_id = 
          mf.flavour_id WHERE mf.mix_id = mixes.id))`);
        params.push(lowerCaseCategory);
      }

      if (flavour) {
        lowerCaseFlavour = flavour.toLowerCase();
        conditions.push(`EXISTS (SELECT 1 FROM flavours f WHERE LOWER(f.name) = ? AND f.id = 
          mix_flavours.flavour_id)`);
        params.push(lowerCaseFlavour);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += `
        GROUP BY mixes.id, mixes.name, users.username
        HAVING categories IS NOT NULL`;

      [mixes] = await connection.query(query, params);

      return mixes;
    } catch (error) {
      throw new Error(error);
    }
  };

  getById = async ({ id }) => {
    try {
      const [mixes] = await connection.query(
        `SELECT 
        mixes.id, 
        mixes.name AS mix_name, 
        users.username AS username, 
        (
          SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                  'id', mix_likes.id, 
                  'username', like_users.username
              )
          )
          FROM mix_likes
          JOIN users like_users ON mix_likes.user_id = like_users.id
          WHERE mix_likes.mix_id = mixes.id
        ) AS likes,
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
        ) AS categories,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', mix_comments.id, 
                    'username', users.username, 
                    'avatar', users.avatar,
                    'content', mix_comments.content
                )
            )
            FROM mix_comments
            WHERE mix_comments.mix_id = mixes.id
        ) AS comments
        FROM mixes
        JOIN users ON mixes.user_id = users.id
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id
        WHERE mixes.id = ?
        GROUP BY mixes.id, mixes.name, users.username;`,
        [id]
      );

      if (mixes.length === 0) return null;

      return mixes[0];
    } catch (error) {
      throw new Error(error);
    }
  };

  create = async ({ userId, input }) => {
    const { name, mix_flavours } = input;
    let mixId = null; // Inicializar mixId con un valor predeterminado

    try {
      const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ?;",
        [userId]
      );

      if (existingUser.length === 0) {
        throw new Error("User not found");
      }

      // Insertar la mezcla
      const [insertResult] = await connection.query(
        `INSERT INTO mixes (user_id, name)
          VALUES (?, ?);`,
        [userId, name]
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
          (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', mix_likes.id, 
                    'username', like_users.username
                )
            )
            FROM mix_likes
            JOIN users like_users ON mix_likes.user_id = like_users.id
            WHERE mix_likes.mix_id = mixes.id
          ) AS likes,
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
          ) AS categories,
          (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'id', mix_comments.id, 
                      'username', users.username, 
                      'avatar', users.avatar,
                      'content', mix_comments.content
                  )
              )
              FROM mix_comments
              WHERE mix_comments.mix_id = mixes.id
          ) AS comments
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
      throw new Error(error);
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

      const [existingMix] = await connection.query(
        "SELECT * FROM mixes WHERE id = ? AND user_id = ?;",
        [id, userId]
      );

      if (existingMix.length === 0) {
        throw new Error("Mix not found");
      }

      const [result0] = await connection.query(
        "DELETE FROM mix_likes WHERE mix_id = ?;",
        [id]
      );

      const [result1] = await connection.query(
        "DELETE FROM mix_flavours WHERE mix_id = ?;",
        [id]
      );

      const [result2] = await connection.query(
        "DELETE FROM mix_comments WHERE mix_id = ?;",
        [id]
      );

      const [result3] = await connection.query(
        "DELETE FROM mixes WHERE id = ? AND user_id = ?;",
        [id, userId]
      );

      if (
        result0.affectedRows > 0 &&
        result1.affectedRows > 0 &&
        result2.affectedRows > 0 &&
        result3.affectedRows > 0
      ) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  update = async ({ id, userId, input }) => {
    const { name, mix_flavours } = input;

    try {
      const [existingUser] = await connection.query(
        "SELECT * FROM users WHERE id = ?;",
        [userId]
      );

      if (existingUser.length === 0) {
        throw new Error("User not found");
      }

      const [existingMix] = await connection.query(
        "SELECT * FROM mixes WHERE id = ? AND user_id = ?;",
        [id, userId]
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
          "UPDATE mixes SET name = ? WHERE id = ? AND user_id = ?",
          [name, id, userId]
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
          (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'id', mix_likes.id, 
                    'username', like_users.username
                )
            )
            FROM mix_likes
            JOIN users like_users ON mix_likes.user_id = like_users.id
            WHERE mix_likes.mix_id = mixes.id
          ) AS likes,
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
          ) AS categories,
          (
              SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'id', mix_comments.id, 
                      'username', users.username, 
                      'avatar', users.avatar,
                      'content', mix_comments.content
                  )
              )
              FROM mix_comments
              WHERE mix_comments.mix_id = mixes.id
          ) AS comments
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
      throw new Error(error);
    }
  };

  // Método para agregar un like a una mezcla
  addLike = async ({ id, userId }) => {
    try {
      // Verificar si el usuario ya dio like a esta mezcla
      const [existingLike] = await connection.query(
        "SELECT * FROM mix_likes WHERE user_id = ? AND mix_id = ?;",
        [userId, id]
      );

      if (existingLike.length > 0) {
        throw new Error("User already liked this mix");
      }

      // Insertar el like
      const [insertResult] = await connection.query(
        "INSERT INTO mix_likes (user_id, mix_id) VALUES (?, ?);",
        [userId, id]
      );

      if (insertResult.affectedRows > 0) {
        const likeId = insertResult.insertId;
        return { success: true, likeId };
      } else {
        return { success: false };
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  // Método para eliminar un like de una mezcla
  removeLike = async ({ id, userId }) => {
    try {
      // Verificar si el usuario ya dio like a esta mezcla
      const [existingLike] = await connection.query(
        "SELECT id FROM mix_likes WHERE user_id = ? AND mix_id = ?;",
        [userId, id]
      );

      const likeId = existingLike[0].id;

      if (likeId === undefined) {
        throw new Error("User already dont liked this mix");
      }

      // Eliminar el like
      const [deleteResult] = await connection.query(
        "DELETE FROM mix_likes WHERE id = ? AND user_id = ?;",
        [likeId, userId]
      );

      if (deleteResult.affectedRows > 0) {
        return { success: true, likeId };
      } else {
        return { success: false };
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  // Método para consultar un like de una mezcla
  checkLike = async ({ id, userId }) => {
    try {
      const [existingLike] = await connection.query(
        "SELECT * FROM mix_likes WHERE user_id = ? AND mix_id = ?;",
        [userId, id]
      );

      return existingLike.length > 0;
    } catch (error) {
      throw new Error(error);
    }
  };

  // Método para añadir un comentario de una mezcla
  addComment = async ({ id, userId, input }) => {
    const { content } = input;
    try {
      // Insertar el comentario
      const [insertResult] = await connection.query(
        "INSERT INTO mix_comments (user_id, mix_id, content) VALUES (?, ?, ?);",
        [userId, id, content]
      );

      if (insertResult.affectedRows > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  // Método para eliminar un comentario de una mezcla
  removeComment = async ({ id, userId, commentId }) => {
    try {
      const [existingLike] = await connection.query(
        "SELECT * FROM mix_comments WHERE id = ? AND user_id = ? AND mix_id = ?;",
        [commentId, userId, id]
      );

      if (existingLike.length === 0)
        throw new Error("User already dont commented this mix");

      // Eliminar el comentario
      const [deleteResult] = await connection.query(
        "DELETE FROM mix_comments WHERE id = ? AND user_id = ? AND mix_id = ?;",
        [commentId, userId, id]
      );

      if (deleteResult.affectedRows > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error(error);
    }
  };
}
