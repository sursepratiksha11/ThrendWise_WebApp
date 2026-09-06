import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
