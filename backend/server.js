const express = require('express');
const app = express();
const port = 5000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Backend dumpy awoogaa');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});