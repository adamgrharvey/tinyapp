const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

function generateRandomString() {
  let out = Math.random().toString(36).slice(2);
  return out.substring(0,6);
}

const urlDatabase = {
  "b088yB34m": "http://www.lighthouselabs.ca",
  "600613": "http://www.google.com"

};

const userDatabase = {

};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
//
// POST
//
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let val = Object.values(userDatabase);
  let error = false;
  // need to check if the email exists
  for (let i = 0; i < val.length; i++) {
    if (val[i].email === req.body.email) {
      error = true;
      res.sendStatus(400);
    }
  }
  if (!error) {
    if (req.body.email === '' || req.body.password === '') {
      res.clearCookie('email');
      res.sendStatus(400);
    } 
    else {
      let randomID = String(generateRandomString());
      userDatabase[String(randomID)] = {'id': randomID, 'email': req.body.email, 'password': req.body.password};
      res.cookie('id', randomID);
      res.redirect("/urls");
      console.log(userDatabase);
    }
  }

});

app.post("/urls/:id/", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  let val = Object.values(userDatabase);
  let error = true;
  // need to check if the email exists

  for (let i = 0; i < val.length; i++) {
    if (val[i].email === req.body.email && val[i].password === req.body.password) {
      error = false;
      res.cookie('id', val[i].id);
      res.redirect("/urls");
    }
  }
  // if it exists, ensure password matches.
  // if it does, send cookie containing the ID
  // and redirect.
  // else 
  if (error) {
    res.sendStatus(406);
  }
});
//
// GET
//
app.get('/', (req, res) => {
  res.send("hello!");
});

app.get('/register', (req, res) => {
  const templateVars = {
    id: userDatabase[req.cookies['id']],
  };
  res.render("register", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  //console.log(req.body);
  const longURL = urlDatabase[req.params.id];
  if (longURL === undefined) {
    res.sendStatus(404);
  }
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
 // console.log(userDatabase);
  const templateVars = {
    id: userDatabase[req.cookies['id']],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    id: userDatabase[req.cookies['id']],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});
 
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: userDatabase[req.cookies['id']],
    URLid: req.params.id,
    longURL: urlDatabase[req.params.id],
   };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { 
    id: userDatabase[req.cookies['id']],
    urls: urlDatabase
  };
  res.render("hello_world", templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = { 
    id: userDatabase[req.cookies['id']],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});

app.get('/logout', (req, res) => {
  res.clearCookie('id');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
