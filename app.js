import express, { json } from 'express'
import { createFlavourRouter } from './routes/flavours.js'
import { createMixRouter } from './routes/mixes.js'
import { corsMiddleware } from './middlewares/cors.js'
import { FlavourModel } from './models/flavour.js'
import { MixModel } from './models/mix.js'

const app = express()
const flavourModel = new FlavourModel();
const mixModel = new MixModel();

app.use(json())
app.use(corsMiddleware())
app.disable('x-powered-by')
app.use('/flavours', createFlavourRouter({ flavourModel }))
app.use('/mixes', createMixRouter({ mixModel }))

const PORT = process.env.PORT ?? 1234
app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})

