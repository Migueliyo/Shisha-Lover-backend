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

export class FlavourModel {
  getAll = async ({ brand }) => {
    if (brand) {
      const lowerCaseBrand = brand.toLowerCase()

      const [flavours] = await connection.query(
        'SELECT * FROM flavours WHERE brand_id = (SELECT id FROM brands WHERE name = ?)',
        [lowerCaseBrand]
      )

      return flavours
    }

    const [flavours] = await connection.query(
      'SELECT * FROM flavours;'
    )

    return flavours
  }

  getById = async ({ id }) => {
    const [flavours] = await connection.query(
      'SELECT * FROM flavours WHERE id = ?',
      [id]
    )

    if (flavours.length === 0) return null

    return flavours[0]
  }

  create = async ({ input }) => {
    const {
      name,
      description,
      brand
    } = input

    const [brandIdResult] = await connection.query('SELECT id FROM brands WHERE name = ?' , brand)
    const brandId = brandIdResult[0].id

    try {
      await connection.query(
        `INSERT INTO flavours (name, description, brand_id)
          VALUES (?, ?, ?);`,
        [name, description, brandId]
      )
    } catch (e) {
      throw new Error('Error creating the flavour')
    }

    const [flavours] = await connection.query(
      'SELECT * FROM flavours WHERE name = ?', name
    )

    return flavours[0]
  }

  delete = async ({ id }) => {
    try {
      const [result] = await connection.query(
        'DELETE FROM flavours WHERE id = ?', id
      )
  
      if (result.affectedRows > 0) {
        return true
      } else {
        return false
      }
    } catch (error) {
      throw new Error('Error deleting the flavour')
    }
  }
  
  update = async ({ id, input }) => {
    const { name, description, brand } = input
  
    try {
      const [existingFlavour] = await connection.query(
        'SELECT * FROM flavours WHERE id = ?', [id]
      )
  
      if (existingFlavour.length === 0) {
        throw new Error('Mix not found')
      }
  
      const updateFields = []
      const updateValues = []
  
      if (name !== undefined) {
        updateFields.push('name = ?')
        updateValues.push(name)
      }
      
      if (description !== undefined) {
        updateFields.push('description = ?')
        updateValues.push(description)
      }
  
      if (brand !== undefined) {
        updateFields.push('brand_id = ?')
        const [brandIdResult] = await connection.query(
          'SELECT id FROM brands WHERE name = ?', [brand]
        )
        
        if (brandIdResult.length === 0) {
          throw new Error('Brand not found')
        }
        const brandId = brandIdResult[0].id
        updateValues.push(brandId)
      }
  
      if (updateFields.length > 0) {
        const [result] = await connection.query(
          `UPDATE flavours SET ${updateFields.join(', ')} WHERE id = ?`,
          [...updateValues, id]
        )

        // Verifica si se actualizó al menos una fila
        if (result.affectedRows > 0) {
          const [flavours] = await connection.query(
            'SELECT * FROM flavours WHERE id = ?',
            [id]
          )
          return flavours[0]
        } 
      } else {
        throw new Error('No data entered')
      }

    } catch (error) {
      throw new Error('Error updating the flavour')
    }
  }
  
}
