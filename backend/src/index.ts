import express from "express";
import cors from "cors";
import http from "node:http";
import routes from "./routes";
import { connectMongo } from "./services/mongo";
import dotenv from "dotenv";


dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use("/api", routes);

const PORT = process.env.PORT || 5000;

(async () => {
  await connectMongo();
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
