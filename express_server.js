const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

function generateRandomString() {
  let out = Math.random().toString(36).slice(2);
  return out.substring(0,6);
}

// our databases. empty to start with.
const urlDatabase = {
};

const userDatabase = {
};

const findUser = function(email) {
  let val = Object.values(userDatabase);
  for (let i = 0; i < val.length; i++) {
    if (val[i].email === email) {
      // if we find the user, return that user object.
      return userDatabase[val[i].user_id];
    }
  }
  // else return null;
  return null;
};

const urlsForUser = function(id) {
  let keys = Object.keys(urlDatabase);
  let outObj = {};

  for (const key of keys) {
    if (urlDatabase[key].userID === id) {
      outObj[key] = urlDatabase[key];
    }
  }
  return outObj;

};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//
// POST
//
app.post("/urls/:id/delete", (req, res) => {

  // check if urlDatabase[req.params.id].userID === req.cookies.user_id
  if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.status(403).send('Must be logged in to delete.\n');
  }
});

app.post("/register", (req, res) => {
  
  // check if email exists, if it do, send error. else make it
  if (findUser(req.body.email) !== null) {
    res.sendStatus(400);
  } else {
    if (req.body.email === '' || req.body.password === '') {
      res.clearCookie('user_id');
      res.sendStatus(400);
    } else {
      let randomID = String(generateRandomString());
      userDatabase[String(randomID)] = {'user_id': randomID, 'email': req.body.email, 'password': req.body.password};
      res.cookie('user_id', randomID);
      res.redirect("/urls");
    }
  }
});

app.post("/urls/:id/", (req, res) => {

  urlDatabase[req.params.id].longURL = req.body.longURL;
  urlDatabase[req.params.id].userID = req.cookies.user_id;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {


  if (req.cookies.user_id === undefined) {
    res.status(400).send('Login to shorten URLs.\n');
  } else {
    let currentIDs = Object.keys(urlDatabase);
    let shortURL = generateRandomString();
    while (currentIDs.includes(shortURL)) {
      shortURL = generateRandomString();
    }
    urlDatabase[shortURL] = {};
    urlDatabase[shortURL].longURL = req.body.longURL;
    urlDatabase[shortURL].userID = req.cookies.user_id;
    res.redirect(`/urls/${shortURL}`);
  }

});

app.post("/login", (req, res) => {

  //check if account exists and the password is correct, log them in
  // else make send them status 403.
  let checkUser = findUser(req.body.email);
  if (checkUser !== null) {
    if (checkUser.email === req.body.email && checkUser.password === req.body.password) {
      res.cookie('user_id', checkUser.user_id);
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
  if (req.cookies.user_id !== undefined) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user_id: userDatabase[req.cookies['user_id']],
    };
    res.render("register", templateVars);
  }

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  
  if (urlDatabase[longURL] === undefined) {
    res.sendStatus(404);
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/urls", (req, res) => {
  let userURLS = urlsForUser(req.cookies.user_id);
  
  const templateVars = {
    user_id: userDatabase[req.cookies['user_id']],
    urls: userURLS
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.redirect("/login");
  }
  const templateVars = {
    user_id: userDatabase[req.cookies['user_id']],
    urls: urlDatabase
  };
  res.render("urls_new", templateVars);
});
 
app.get("/urls/:id", (req, res) => {

  if (urlDatabase[req.params.id]) {
    const templateVars = {
      user_id: userDatabase[req.cookies['user_id']],
      URLid: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
    };
  
    // only show page if this URL belongs to current user
    // check if this URL.user_id === req.cookies.user_id
    if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
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
    user_id: userDatabase[req.cookies['user_id']],
    urls: urlDatabase
  };
  res.render("hello_world", templateVars);
});

app.get('/login', (req, res) => {

  if (req.cookies.user_id !== undefined) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user_id: userDatabase[req.cookies['user_id']],
      urls: urlDatabase
    };
    res.render("login", templateVars);
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
