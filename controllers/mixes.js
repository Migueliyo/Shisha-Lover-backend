import { validateMix } from '../schemas/mix.js'

export class MixController {
  constructor ({ mixModel }) {
    this.mixModel = mixModel
  }

  getAll = async (req, res) => {
    const { category } = req.query
    const mixes = await this.mixModel.getAll({ category })
    res.json(mixes)
  }

  getById = async (req, res) => {
    const { id } = req.params
    const mix = await this.mixModel.getById({ id })
    if (mix) return res.json(mix)
    res.status(404).json({ message: 'Mix not found' })
  }

  create = async (req, res) => {
    try {
      const result = validateMix(req.body)
  
      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
      }
  
      const newMix = await this.mixModel.create({ input: result.data })
  
      res.status(201).json(newMix)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }
  

  delete = async (req, res) => {
    const { id } = req.params

    const result = await this.mixModel.delete({ id })

    if (result === false) {
      return res.status(404).json({ message: 'Mix not found' })
    }

    return res.json({ message: 'Mix deleted' })
  }

  update = async (req, res) => {
    try {
      const result = validateMix(req.body)

      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) })
      }
  
      const { id } = req.params
  
      const updatedMix = await this.mixModel.update({ id, input: result.data })
  
      return res.json(updatedMix)
    } catch (error) {
      console.log(error)
      res.status(400).json({ message: error.message });
    }
  }
}
