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

export class FlavourModel {
  getAll = async ({ brand }) => {
    if (brand) {
      const lowerCaseBrand = brand.toLowerCase();

      const [flavours] = await connection.query(
        `SELECT flavours.id, flavours.name AS flavour_name, flavours.description, brands.name AS brand_name,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', categories.id,
             'name', categories.name
           )
         ) AS categories
        FROM flavours
        JOIN brands ON flavours.brand_id = brands.id
        JOIN flavour_categories ON flavours.id = flavour_categories.flavour_id
        JOIN categories ON flavour_categories.category_id = categories.id
        WHERE brands.name = ?
        GROUP BY flavours.id;`,
        [lowerCaseBrand]
      );

      return flavours;
    }

    const [flavours] = await connection.query(
      `SELECT flavours.id, flavours.name AS flavour_name, flavours.description, brands.name AS brand_name,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'id', categories.id,
           'name', categories.name
         )
       ) AS categories
      FROM flavours
      JOIN brands ON flavours.brand_id = brands.id
      JOIN flavour_categories ON flavours.id = flavour_categories.flavour_id
      JOIN categories ON flavour_categories.category_id = categories.id
      GROUP BY flavours.id;`
    );

    return flavours;
  };

  getById = async ({ id }) => {
    const [flavours] = await connection.query(
      `SELECT flavours.id, flavours.name AS flavour_name, flavours.description, brands.name AS brand_name,
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'id', categories.id,
           'name', categories.name
         )
       ) AS categories
      FROM flavours
      JOIN brands ON flavours.brand_id = brands.id
      JOIN flavour_categories ON flavours.id = flavour_categories.flavour_id
      JOIN categories ON flavour_categories.category_id = categories.id
      WHERE flavours.id = ?
      GROUP BY flavours.id;`,
      [id]
    );

    if (flavours.length === 0) return null;

    return flavours[0];
  };

  create = async ({ input }) => {
    const { name, description, brand, flavour_categories } = input;

    const [brandIdResult] = await connection.query(
      "SELECT id FROM brands WHERE name = ?",
      brand
    );

    if (brandIdResult.length === 0) {
      throw new Error("Brand not exist");
    }

    const brandId = brandIdResult[0].id;

    try {
      // Insertar el sabor
      await connection.query(
        `INSERT INTO flavours (name, description, brand_id)
          VALUES (?, ?, ?);`,
        [name, description, brandId]
      );

      // Obtener el id del sabor recién insertado
      const [flavourResult] = await connection.query(
        `SELECT id FROM flavours WHERE name = ?`,
        [name]
      );
      const flavourId = flavourResult[0].id;

      // Insertar flavour_categories
      for (const flavour_category of flavour_categories) {
        const { category_name } = flavour_category;
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
        // Insertar el enlace entre el sabor y la categoría
        await connection.query(
          `INSERT INTO flavour_categories (flavour_id, category_id) VALUES (?, ?)`,
          [flavourId, categoryId]
        );
      }

      // Obtener el sabor completa
      const [flavour] = await connection.query(
        `SELECT flavours.id, flavours.name AS flavour_name, flavours.description, brands.name AS brand_name,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', categories.id,
             'name', categories.name
           )
         ) AS categories
        FROM flavours
        JOIN brands ON flavours.brand_id = brands.id
        JOIN flavour_categories ON flavours.id = flavour_categories.flavour_id
        JOIN categories ON flavour_categories.category_id = categories.id
        WHERE flavours.id = ?
        GROUP BY flavours.id;`,
        [flavourId]
      );

      return flavour;
    } catch (e) {
      throw new Error("Error creating the flavour ->" + e);
    }
  };

  delete = async ({ id }) => {
    try {
      const [result1] = await connection.query(
        "DELETE FROM flavour_categories WHERE flavour_id = ?",
        [id]
      );

      const [result2] = await connection.query(
        "DELETE FROM flavours WHERE id = ?",
        [id]
      );

      if (result1.affectedRows > 0 && result2.affectedRows > 0) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new Error("Error deleting the flavour");
    }
  };

  update = async ({ id, input }) => {
    const { name, description, brand, flavour_categories } = input;

    try {
      const [existingFlavour] = await connection.query(
        "SELECT * FROM flavours WHERE id = ?",
        [id]
      );

      if (existingFlavour.length === 0) {
        throw new Error("Flavour not found");
      }

      const updateFields = [];
      const updateValues = [];
      let result1, result2;

      if (name !== undefined) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }

      if (description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(description);
      }

      if (brand !== undefined) {
        updateFields.push("brand_id = ?");
        const [brandIdResult] = await connection.query(
          "SELECT id FROM brands WHERE name = ?",
          [brand]
        );

        if (brandIdResult.length === 0) {
          throw new Error("Brand not found");
        }
        const brandId = brandIdResult[0].id;
        updateValues.push(brandId);
      }

      if (flavour_categories !== undefined) {
        // Eliminar todos los registros de flavour_categories para el flavour_id dado
        await connection.query(
          "DELETE FROM flavour_categories WHERE flavour_id = ?",
          [id]
        );

        // Insertar los nuevos registros de flavour_categories
        for (const flavour_category of flavour_categories) {
          const { category_name } = flavour_category;
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
          // Insertar el enlace entre el sabor y la categoría
          [result1] = await connection.query(
            `INSERT INTO flavour_categories (flavour_id, category_id) VALUES (?, ?)`,
            [id, categoryId]
          );
        }
      }

      if (updateFields.length > 0) {
        [result2] = await connection.query(
          `UPDATE flavours SET ${updateFields.join(", ")} WHERE id = ?`,
          [...updateValues, id]
        );
      }

      // Verifica si se actualizó al menos una fila
      if (
        (result1 && result1.affectedRows > 0) ||
        (result2 && result2.affectedRows > 0)
      ) {
        const [flavours] = await connection.query(
          `SELECT flavours.id, flavours.name AS flavour_name, flavours.description, brands.name AS brand_name,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', categories.id,
              'name', categories.name
            )
          ) AS categories
          FROM flavours
          JOIN brands ON flavours.brand_id = brands.id
          JOIN flavour_categories ON flavours.id = flavour_categories.flavour_id
          JOIN categories ON flavour_categories.category_id = categories.id
          WHERE flavours.id = ?
          GROUP BY flavours.id;`,
          [id]
        );
        return flavours[0];
      } else {
        throw new Error("No data entered");
      }
    } catch (error) {
      throw new Error("Error updating the flavour -> " + error);
    }
  };
}
