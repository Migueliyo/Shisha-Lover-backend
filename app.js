import express, { json } from "express";
import dotenv from "dotenv";
import path from 'path';

import { createAuthRouter } from "./routes/auth.js";
import { createFlavourRouter } from "./routes/flavours.js";
import { createMixRouter } from "./routes/mixes.js";
import { createUserRouter } from "./routes/users.js";
import { createEntryRouter } from "./routes/entries.js";
import { createUploadRouter } from "./routes/upload.js";

import { corsMiddleware } from "./middlewares/cors.js";
import { authenticationMiddleware } from "./middlewares/auth.js";

import { AuthModel } from "./models/auth.js";
import { FlavourModel } from "./models/flavour.js";
import { MixModel } from "./models/mix.js";
import { UserModel } from "./models/user.js";
import { EntryModel } from "./models/entry.js";

const app = express();
dotenv.config();

const authModel = new AuthModel();
const flavourModel = new FlavourModel();
const mixModel = new MixModel();
const userModel = new UserModel();
const entryModel = new EntryModel();

app.use(json());
app.use(corsMiddleware());
app.use("/api", authenticationMiddleware);

app.disable("x-powered-by");

app.use("/", createAuthRouter({ authModel }));
app.use("/api/flavours", createFlavourRouter({ flavourModel }));
app.use("/api/mixes", createMixRouter({ mixModel }));
app.use("/api/users", createUserRouter({ userModel }));
app.use("/api/entries", createEntryRouter({ entryModel }));
app.use('/api/upload', createUploadRouter());

app.use('/static/users-avatar', express.static(path.join('static/users-avatar')));

const PORT = process.env.PORT ?? 1234;
app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`);
});
