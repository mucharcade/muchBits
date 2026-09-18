import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 3000;
const currentFile = fileURLToPath(import.meta.url);
const publicDirectory = path.dirname(currentFile);

app.use(express.static(publicDirectory));

app.get('/', (request, response) => {
    response.sendFile(path.join(publicDirectory, 'ingame.html'));
});

app.listen(port, () => {
    console.log(`MuchBits disponible en http://localhost:${port}`);
});