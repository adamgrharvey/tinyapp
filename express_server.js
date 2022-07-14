const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080;
const helper = require('./helpers');

app.set("view engine", "ejs");

// our databases. empty to start with.
const urlDatabase = {
};

const userDatabase = {
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['wrath of the lich king 2: arthas remixxed'],

}));
//
// POST
//
app.post("/urls/:id/delete", (req, res) => {

  // check if urlDatabase[req.params.id].userID === req.cookies.user_id
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(403).send('Must be logged in to delete.\n');
  }
});

app.post("/register", (req, res) => {
  
  // check if email exists, if it do, send error. else make it
  if (helper.getUserByEmail(req.body.email, userDatabase) !== null) {
    res.sendStatus(400);
  } else {
    if (req.body.email === '' || req.body.password === '') {
      req.session = null;
      res.sendStatus(400);
    } else {
      let randomID = String(helper.generateRandomString());
      userDatabase[String(randomID)] = {'user_id': randomID, 'email': req.body.email, 'password': bcrypt.hashSync(req.body.password, 10)};
      req.session.user_id = randomID;
      res.redirect("/urls");
    }
  }
});

app.post("/urls/:id/", (req, res) => {

  urlDatabase[req.params.id].longURL = req.body.longURL;
  urlDatabase[req.params.id].userID = req.session.user_id;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {


  if (req.session.user_id === undefined) {
    res.status(400).send('Login to shorten URLs.\n');
  } else {
    let currentIDs = Object.keys(urlDatabase);
    let shortURL = helper.generateRandomString();
    while (currentIDs.includes(shortURL)) {
      shortURL = helper.generateRandomString();
    }
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.session.user_id;
    res.redirect(`/urls/${shortURL}`);
  }

});

app.post("/login", (req, res) => {

  //check if account exists and the password is correct, log them in
  // else make send them status 403.
  let checkUser = helper.getUserByEmail(req.body.email, userDatabase);
  if (checkUser !== null) {
    if (checkUser.email === req.body.email && bcrypt.compareSync(req.body.password, checkUser.password)) {
      req.session.user_id = checkUser.user_id;
      res.redirect("/urls");
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(403);
  }
});
// //
// GET
//
app.get('/', (req, res) => {
  res.send("hello!");
});

app.get('/register', (req, res) => {
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user_id: userDatabase[req.session.user_id],
    };
    res.render("register", templateVars);
  }

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.sendStatus(404);
  } else {
    res.redirect(urlDatabase[req.params.id].longURL);
  }
});

app.get("/urls", (req, res) => {
  let userURLS = helper.urlsForUser(req.session.user_id, urlDatabase);
  
  const templateVars = {
    user_id: userDatabase[req.session.user_id],
    urls: userURLS
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  }
  const templateVars = {
    user_id: userDatabase[req.session.user_id],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});
 
app.get("/urls/:id", (req, res) => {

  if (urlDatabase[req.params.id]) {
    const templateVars = {
      user_id: userDatabase[req.session.user_id],
      URLid: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
    };
  
    // only show page if this URL belongs to current user
    // check if this URL.user_id === req.cookies.user_id
    if (urlDatabase[req.params.id].userID === req.session.user_id) {
      res.render("urls_show", templateVars);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(404);
  }

});

app.get("/hello", (req, res) => {
  const templateVars = {
    user_id: userDatabase[req.session.user_id],
    urls: urlDatabase
  };
  res.render("hello_world", templateVars);
});

app.get('/login', (req, res) => {

  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user_id: userDatabase[req.session.user_id],
      urls: urlDatabase
    };
    res.render("login", templateVars);
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
