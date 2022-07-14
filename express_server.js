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
  
  // check if email exists
  // if the email is already an account, throw 400
  if (helper.getUserByEmail(req.body.email, userDatabase) !== null) {
    res.sendStatus(400);
  } else {
    // if the email body or password are empty, clear cookies and throw 400.
    if (req.body.email === '' || req.body.password === '') {
      req.session = null;
      res.sendStatus(400);
    } else {
      // if the details are good, create the account.
      // make a random ID
      let randomID = String(helper.generateRandomString());
      // create a new object using named our random ID, made the defaults.
      userDatabase[String(randomID)] =
      {
        'user_id': randomID,
        'email': req.body.email,
        'password': bcrypt.hashSync(req.body.password, 10)
      };
      req.session.user_id = randomID;
      res.redirect("/urls");
    }
  }
});

app.post("/urls/:id/", (req, res) => {
  // is there someone signed in?
  // if not, tell them to login
  if (req.session.user_id === undefined) {
    res.status(403).send('Login to edit URLs.\n');
    // otherwise...
  } else {
    // update the URL settings.
    urlDatabase[req.params.id].longURL = req.body.longURL;
    urlDatabase[req.params.id].userID = req.session.user_id;
    res.redirect("/urls");
  }
});

app.post("/urls", (req, res) => {
  // is there someone signed in?
  // if not, tell them to login
  if (req.session.user_id === undefined) {
    res.status(400).send('Login to shorten URLs.\n');
    // otherwise...
  } else {
    // get all of our keys.
    let currentIDs = Object.keys(urlDatabase);
    // create a new random shortURL
    let shortURL = helper.generateRandomString();
    // check to see if that newly generated name has somehow been created before
    while (currentIDs.includes(shortURL)) {
      // if we get getting duplicates, keep trying until we get one that isnt taken!
      // happy path: a shortURL that hasnt been used before.
      shortURL = helper.generateRandomString();
    }
    // initialize our URL object with our randomly generated name
    urlDatabase[shortURL] = {};
    // add all the pieces of info we want to track about each object
    // the longURL for it.
    urlDatabase[shortURL].longURL = req.body.longURL;
    // which user it belongs to.
    urlDatabase[shortURL].userID = req.session.user_id;
    // the date it was created.
    urlDatabase[shortURL].dateCreated = new Date().toLocaleString();
    // how many total clicks
    urlDatabase[shortURL].visits = 0;
    // array of unique IPs that have connected. We will use .length on this later to show many many total uniques.
    urlDatabase[shortURL].uniqueVisitors = [];
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
  // check if someone is signed in.
  // if they are, send to URLs.
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
    // other send to login
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  // get this users URLs.
  let userURLS = helper.urlsForUser(req.session.user_id, urlDatabase);
  // display the URL index
  const templateVars = {
    user: userDatabase[req.session.user_id],
    urls: userURLS
  };
  // the index page will render differently depending on if someone is signed in or not.
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // check if there is someone signed in
  // if there isnt, send them to login
  if (req.session.user_id === undefined) {
    res.redirect("/login");
    // if there is someone signed in, render the new URL page with proper template
  } else {
    const templateVars = {
      user: userDatabase[req.session.user_id],
      urls: urlDatabase
    };
    res.render("urls_new", templateVars);
  }

});

app.get("/urls/:id", (req, res) => {

  // does this exist?
  if (urlDatabase[req.params.id]) {
    // it does, so set our template data
    const templateVars = {
      user: userDatabase[req.session.user_id],
      URLid: req.params.id,
      urlDatabase: urlDatabase
    };
  
    // only show page if this URL belongs to current user
    // check if this URL.user_id === req.cookies.user_id
    if (urlDatabase[req.params.id].userID === req.session.user_id) {
      res.render("urls_show", templateVars);
    } else {
      // access denied.
      res.sendStatus(403);
    }

    // this id doesnt exist, so throw 404
  } else {
    res.sendStatus(404);
  }
});

app.get("/u/:id", (req, res) => {
  // if that url doesnt exist, throw a 404
  if (urlDatabase[req.params.id] === undefined) {
    res.sendStatus(404);
    // otherwise,
  } else {
    // count the link visit
    urlDatabase[req.params.id].visits++;
    // check to see if that visit was from a new IP
    if (!urlDatabase[req.params.id].uniqueVisitors.includes(req.connection.remoteAddress)) {
      // if the current array of unique IPs doesnt contain this one, this must be new! add it to the list.
      urlDatabase[req.params.id].uniqueVisitors.push(req.connection.remoteAddress);
    }
    // redirect them to the long URL
    res.redirect(urlDatabase[req.params.id].longURL);
  }
});

app.get('/register', (req, res) => {
  // if someone is signed in, redirect to URLs
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
    // otherwise, give them the register page
  } else {
    const templateVars = {
      user: userDatabase[req.session.user_id],
    };
    res.render("register", templateVars);
  }
});

app.get('/login', (req, res) => {

  // if someone is signed in
  if (req.session.user_id !== undefined) {
    res.redirect("/urls");
    // if they arent signed in.
  } else {
    const templateVars = {
      user: userDatabase[req.session.user_id],
      urls: urlDatabase
    };
    // send them to login page with relevant data
    res.render("login", templateVars);
  }
});

app.get('/logout', (req, res) => {
  // clear cookies and go to URLs
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
