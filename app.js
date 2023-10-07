import express, { json } from 'express'
import { createFlavourRouter } from './routes/flavours.js'
import { corsMiddleware } from './middlewares/cors.js'
import { FlavourModel } from './models/flavour.js'

const app = express()
const flavourModel = new FlavourModel();

app.use(json())
app.use(corsMiddleware())
app.disable('x-powered-by')
app.use('/flavours', createFlavourRouter({ flavourModel }))

const PORT = process.env.PORT ?? 1234
app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})

