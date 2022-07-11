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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});