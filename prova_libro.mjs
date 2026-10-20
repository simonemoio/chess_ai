// Prova del libro senza motore:  node prova_libro.mjs  (servono i file data/libro-*.json)
import { readFileSync } from "fs";
globalThis.fetch = async (u) => ({ ok: true, json: async () => JSON.parse(readFileSync("./data/" + u.split("?")[0].split("/").pop(), "utf8")) });
const { distribuzione } = await import("./js/avversario.js");
const { Chess } = await import("./vendor/chess.js");
let chiamate = 0;
const finto = { multipv: async () => { chiamate++; return [{ uci: "a2a3", cp: 0, matto: null }]; } };
const g = new Chess();
for (const elo of [1100, 1500, 1900]) console.log(elo, JSON.stringify(await distribuzione(finto, g.fen(), elo)));
console.log("motore chiamato in libro:", chiamate);
g.move("d4");
console.log("dopo 1.d4:", JSON.stringify(await distribuzione(finto, g.fen(), 1460, 2)));
g.move("e5"); g.move("Nc3"); g.move("Nf6"); g.move("h4");
console.log("fuori libro:", JSON.stringify(await distribuzione(finto, g.fen(), 1500)), "motore chiamato:", chiamate);
