import { Router } from 'express'
import { FlavourController } from '../controllers/flavours.js'

export const createFlavourRouter = ({ flavourModel }) => {
  const flavourRouter = Router()

  const flavourController = new FlavourController({ flavourModel })

  flavourRouter.get('/', flavourController.getAll)
  flavourRouter.post('/', flavourController.create)

  flavourRouter.get('/:id', flavourController.getById)
  flavourRouter.delete('/:id', flavourController.delete)
  flavourRouter.patch('/:id', flavourController.update)
  flavourRouter.put('/:id', flavourController.update)

  return flavourRouter
}
