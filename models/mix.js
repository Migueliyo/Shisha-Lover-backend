import mysql from 'mysql2/promise'

const DEFAULT_CONFIG = {
  host: 'localhost',
  user: 'root',
  port: 33306,
  password: 'admin',
  database: 'shishadb'
}

const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG

const connection = await mysql.createConnection(connectionString)

export class MixModel {
  getAll = async ({ type }) => {
    if (type) {
      const lowerCaseType = type.toLowerCase()

      const [mixes] = await connection.query(
        `SELECT mixes.id, mixes.name, mixes.type, flavours.name AS flavour_name, mix_flavours.percentage
        FROM mixes
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id
        WHERE mixes.type = ?;`,
        [lowerCaseType]
      )

      return mixes
    }

    const [mixes] = await connection.query(
        `SELECT mixes.id, mixes.name, mixes.type, flavours.name AS flavour_name, mix_flavours.percentage
        FROM mixes
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id;`
    )

    return mixes
  }

  getById = async ({ id }) => {
    const [mixes] = await connection.query(
        `SELECT mixes.id, mixes.name, mixes.type, flavours.name AS flavour_name, mix_flavours.percentage
        FROM mixes
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id
        WHERE mixes.id = ?;`,
        [id]
    )

    if (mixes.length === 0) return null

    return mixes
  }

  create = async ({ input }) => {
    const {
      name,
      type,
      mix_flavours
    } = input

    try {
      await connection.query(
        `INSERT INTO mixes (name, type)
          VALUES (?, ?);`,
        [name, type]
      )
      for (const mix_flavour of mix_flavours) {
        const {flavour_name, percentage} = mix_flavour
        await connection.query(
            `INSERT INTO mix_flavours (mix_id, flavour_id, percentage) VALUES 
            ((SELECT id FROM mixes WHERE name = ?), 
            (SELECT id FROM flavours WHERE name = ?), ?);`,
            [name, flavour_name, percentage]
        )
      }
    } catch (e) {
      throw new Error('The name for the mix have to be unique')
    }

    const [mixes] = await connection.query(
        `SELECT mixes.id, mixes.name, mixes.type, flavours.name AS flavour_name, mix_flavours.percentage
        FROM mixes
        JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
        JOIN flavours ON mix_flavours.flavour_id = flavours.id
        WHERE mixes.name = ?;`,
        [name]
    )

    return mixes
  }

  delete = async ({ id }) => {
    try {
        const [result1] = await connection.query(
            'DELETE FROM mix_flavours WHERE mix_id = ?',
            [id]
          )
          
          const [result2] = await connection.query(
            'DELETE FROM mixes WHERE id = ?',
            [id]
          )
          
  
      if (result1.affectedRows > 0 && result2.affectedRows > 0) {
        return true
      } else {
        return false
      }
    } catch (error) {
      throw new Error('Error deleting the mix')
    }
  }
  
  update = async ({ id, input }) => {
    const {
      name,
      type,
      mix_flavours
    } = input;
  
    try {
      const [existingMix] = await connection.query(
        'SELECT * FROM mixes WHERE id = ?',
        [id]
      );
  
      if (existingMix.length === 0) {
        throw new Error('Mix not found')
      }
  
      const [updateResult] = await connection.query(
        'UPDATE mixes SET name = ?, type = ? WHERE id = ?',
        [name, type, id]
      );
  
      // Elimina todos los registros de mix_flavours para el mix_id dado
      await connection.query('DELETE FROM mix_flavours WHERE mix_id = ?', [id])
  
      // Inserta los nuevos registros de mix_flavours
      for (const mix_flavour of mix_flavours) {
        const { flavour_name, percentage } = mix_flavour;
        await connection.query(
          `INSERT INTO mix_flavours (mix_id, flavour_id, percentage)
          VALUES (?, (SELECT id FROM flavours WHERE name = ?), ?)`,
          [id, flavour_name, percentage]
        );
      }
  
      if (updateResult.affectedRows > 0) {
        const [mixes] = await connection.query(
          `SELECT mixes.id, mixes.name, mixes.type, flavours.name AS flavour_name, mix_flavours.percentage
          FROM mixes
          JOIN mix_flavours ON mixes.id = mix_flavours.mix_id
          JOIN flavours ON mix_flavours.flavour_id = flavours.id
          WHERE mixes.id = ?;`,
          [id]
        );
        return mixes
      }
    } catch (error) {
      throw new Error('Error updating the mix')
    }
  }
  
}
