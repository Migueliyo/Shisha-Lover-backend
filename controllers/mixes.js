import { validateMix, validatePartialMix } from '../schemas/mix.js'

export class MixController {
  constructor ({ mixModel }) {
    this.mixModel = mixModel
  }

  getAll = async (req, res) => {
    const { category } = req.query
    const { flavour } = req.query
    const mixes = await this.mixModel.getAll({ category, flavour })
    res.json({error: false, data: mixes})
  }

  getById = async (req, res) => {
    const { id } = req.params
    const mix = await this.mixModel.getById({ id })
    if (mix) return res.json({error: false, data: mix})
    res.status(404).json({ error: true, message: 'Mix not found' })
  }

  create = async (req, res) => {
    try {
      const result = validateMix(req.body)
  
      if (!result.success) {
        return res.status(400).json({ error: true, message: JSON.parse(result.error.message) })
      }
  
      const newMix = await this.mixModel.create({ input: result.data })
  
      res.status(201).json({ error: false, data: newMix })
    } catch (error) {
      res.status(400).json({ error: true, message: error.message })
    }
  }
  

  delete = async (req, res) => {
    const { id } = req.params

    const result = await this.mixModel.delete({ id })

    if (result === false) {
      return res.status(404).json({ error: true, message: 'Mix not found' })
    }

    return res.json({ error: false, message: 'Mix deleted' })
  }

  update = async (req, res) => {
    try {
      const result = validatePartialMix(req.body)

      if (!result.success) {
        return res.status(400).json({ error: true, message: JSON.parse(result.error.message) })
      }
  
      const { id } = req.params
  
      const updatedMix = await this.mixModel.update({ id, input: result.data })
  
      return res.json({ error: false, data: updatedMix })
    } catch (error) {
      console.log(error)
      res.status(400).json({ error: true, message: error.message })
    }
  }

  addLike = async (req, res) => {
    try {
      const { id } = req.params;
      // const userId = 1;
      const userId = req.user.id; 
      await this.mixModel.addLike({ id, userId });
      res.json({ error: false, message: 'Like added successfully' });
    } catch (error) {
      res.status(400).json({ erorr: true, message: error.message });
    }
  }

  removeLike = async (req, res) => {
    try {
      const { id } = req.params;
      // const userId = 1;
      const userId = req.user.id; 
      await this.mixModel.removeLike({ id, userId });
      res.json({ error: false, message: 'Like removed successfully' });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  }
}
