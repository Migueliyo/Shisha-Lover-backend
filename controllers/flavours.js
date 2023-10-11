import { validateFlavour, validatePartialFlavour } from '../schemas/flavour.js'

export class FlavourController {
  constructor ({ flavourModel }) {
    this.flavourModel = flavourModel
  }

  getAll = async (req, res) => {
    const { brand } = req.query
    const flavours = await this.flavourModel.getAll({ brand })
    res.json(flavours)
  }

  getById = async (req, res) => {
    const { id } = req.params
    const flavour = await this.flavourModel.getById({ id })
    if (flavour) return res.json(flavour)
    res.status(404).json({ message: 'Flavour not found' })
  }

  create = async (req, res) => {
    try {
      const result = validateFlavour(req.body)

      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
      }

      const newFlavour = await this.flavourModel.create({ input: result.data })

      res.status(201).json(newFlavour)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  delete = async (req, res) => {
    const { id } = req.params

    const result = await this.flavourModel.delete({ id })

    if (result === false) {
      return res.status(404).json({ message: 'Flavour not found' })
    }

    return res.json({ message: 'Flavour deleted' })
  }

  update = async (req, res) => {
    try {
      const result = validatePartialFlavour(req.body)

      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
      }
  
      const { id } = req.params
  
      const updatedFlavour = await this.flavourModel.update({ id, input: result.data })
  
      return res.json(updatedFlavour)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
}
