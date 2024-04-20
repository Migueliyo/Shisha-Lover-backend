import { validateUser, validatePartialUser } from '../schemas/user.js'

export class UserController {
  constructor ({ userModel }) {
    this.userModel = userModel
  }

  getAll = async (req, res) => {
    const users = await this.userModel.getAll()
    res.json({error: false, data: users})
  }

  getById = async (req, res) => {
    const { id } = req.params
    const user = await this.userModel.getById({ id })
    if (user) return res.json({error: false, data: user})
    res.status(404).json({ error: true, message: 'User not found' })
  }

  create = async (req, res) => {
    try {
      const result = validateUser(req.body)

      if (!result.success) {
        return res.status(400).json({ error: true, message: JSON.parse(result.error.message) })
      }

      const newUser = await this.userModel.create({ input: result.data })

      res.status(201).json({ error: false, data: newUser })
    } catch (error) {
      res.status(400).json({ error: true, message: error.message })
    }
  }

  delete = async (req, res) => {
    const { id } = req.params

    const result = await this.userModel.delete({ id })

    if (result === false) {
      return res.status(404).json({ error: true, message: 'User not found' })
    }

    return res.json({ error: false, message: 'User deleted' })
  }

  update = async (req, res) => {
    try {
      const result = validatePartialUser(req.body)

      if (!result.success) {
        return res.status(400).json({ error: true, message: JSON.parse(result.error.message) })
      }
  
      const { id } = req.params
  
      const updatedUser = await this.userModel.update({ id, input: result.data })
  
      return res.json({ error: false, data: updatedUser })
    } catch (error) {
      res.status(400).json({ error: true, message: error.message })
    }
  }
}
