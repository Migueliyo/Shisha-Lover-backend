import { Router } from 'express'
import { MixController } from '../controllers/mixes.js'

export const createMixRouter = ({ mixModel }) => {
  const mixRouter = Router()

  const mixController = new MixController({ mixModel })

  mixRouter.get('/', mixController.getAll)
  mixRouter.post('/', mixController.create)

  mixRouter.get('/:id', mixController.getById)
  mixRouter.delete('/:id', mixController.delete)
  mixRouter.patch('/:id', mixController.update)
  mixRouter.put('/:id', mixController.update)

  return mixRouter
}
