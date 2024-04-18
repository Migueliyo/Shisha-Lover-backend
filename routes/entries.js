import { Router } from 'express'
import { EntryController } from '../controllers/entries.js'

export const createEntryRouter = ({ entryModel }) => {
  const entryRouter = Router()

  const entryController = new EntryController({ entryModel })

  entryRouter.get('/', entryController.getAll)
  entryRouter.post('/', entryController.create)

  entryRouter.get('/:id', entryController.getById)
  entryRouter.delete('/:id', entryController.delete)
  entryRouter.patch('/:id', entryController.update)
  entryRouter.put('/:id', entryController.update)

  return entryRouter
}
