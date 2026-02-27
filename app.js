import express from "express";
import db from "./data/db.js";

const PORT = 3000;
const app = express();
app.use(express.json());

app.get("/hosszu/:perc", (req, res) => {
  const ido = +req.params.perc;
  const result = db
    .prepare("SELECT nev, tipus, ido FROM fitnesz WHERE ido > ?")
    .all(ido);
  res.status(200).json(result);
});

app.get("/vendeg", (req, res) => {
  const vendeg = req.query.nev;
  const result = db
    .prepare("SELECT tipus, ido, datum FROM fitnesz WHERE nev = ?")
    .all(vendeg);
  res.status(200).json(result);
});

app.get("/aktiv/:darab", (req, res) => {
  const darab = +req.params.darab;
  const result = db
    .prepare(
      "SELECT nev, COUNT(nev) AS total FROM fitnesz GROUP BY nev HAVING total > ?",
    )
    .all(darab);
  res.status(200).json(result);
});

app.put("/modosit", (req, res) => {
  const id = +req.body.azon;
  const kaloria = +req.body.kaloria;
  const regiEdzes = db.prepare("SELECT * FROM fitnesz WHERE azon = ?").get(id);
  if (!id) {
    return res.status(404).json({ message: "Nincs ilyen edzés!" });
  }
  if (!regiEdzes) {
    return res.status(404).json({ message: "Nincs ilyen edzés!" });
  }
  if (kaloria < 100) {
    return res.status(400).json({ message: "Túl alacsony érték!" });
  }
  if (kaloria < regiEdzes.kaloria) {
    return res.status(400).json({ message: "Nem megfelelő kalóriaérték!" });
  }

  const result = db
    .prepare("UPDATE fitnesz SET kaloria = ? WHERE azon = ?")
    .run(kaloria, id);

  res.status(200).json(result);
});

app.post("/ujedzes", (req, res) => {
  const { nev, tipus, ido, kaloria, datum } = req.body;
  const today = new Date();
  const formatted = today.toISOString().split("T")[0];
  if (!nev || !tipus || !ido || !kaloria || !datum) {
    return res.status(400).json({ message: "Hiányzó adatok!" });
  }
  if (
    tipus != "kardio" ||
    tipus != "ero" ||
    tipus != "joga" ||
    tipus != "crossfit"
  ) {
    return res.status(400).json({ message: "Hiányzó edzéstípus!" });
  }
  if (ido < 20 || ido > 300) {
    return res.status(400).json({ message: "Érvénytelen időtartam!" });
  }
  if (kaloria < 100 || kaloria > ido * 20) {
    return res.status(400).json({ message: "Nem megfelelő kalóriaérték." });
  }
  if (datum > formatted) {
    return res.status(400).json({ message: "A dátum nem lehet jövőbeli." });
  }

  const result = db
    .prepare(
      "INSERT INTO fitnesz (nev, tipus, ido, kaloria, datum) VALUES (?, ?, ?, ?, ?)",
    )
    .run(nev, tipus, ido, kaloria, datum);
  res
    .status(201)
    .json({ message: "Edzés sikeresen rögzítve" + result.lastInsertRowid });
});

app.listen(PORT, () => {
  console.log("Server runs on 3000");
});
