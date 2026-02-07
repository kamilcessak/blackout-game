import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import mapRoutes from "./features/map/map.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/map", mapRoutes);

app.get("/", (req, res) => {
  console.log("Ktoś zapukał do API!");
  res.json({ message: "Połączono z bazą dowodzenia Blackout!" });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
