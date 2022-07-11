const { application } = require("express");
const express = require("express");
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b088yB34m": "http://www.lighthouselabs.ca",
  "600613": "http://www.google.com"

};

app.get('/', (req, res) => {
  res.send("hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});