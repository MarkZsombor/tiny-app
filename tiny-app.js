const express = require("express");
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['save me middleware'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set("view engine", "ejs");

app.use(express.static('assets'));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

/* Datasets */

// urlDatabase has 2 hard coded entries for debugging purposes. Should be removed before the app goes live
const urlDatabase = {
  "b2xVn2": {
    short: "b2xVn2",
    long: "http://www.lighthouselabs.ca",
    userID: "testUser"
  },
  "9sm5xK": {
    short: "9sm5xK",
    long: "http://www.google.com",
    userID: "Bob"
  }
};

// testUser and password is needed for ease of debugging, needs to be removed before the app is goes live.
const testPassword = bcrypt.hashSync("Bob", 15);

const users = {
  "testUser": {
    id: "testUser",
    email: "email@email.com",
    password: testPassword
  }
}

/* Functions */

/*
 * Returns a random 6 character string.
 * Used for new links and user ids
 *
 * @return {string}
 */
function generateRandomString() {
  let text = [];
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++)
    text.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  text = text.join('');

  return text;
}

/*
 * Returns user id matching a given email.
 *
 * @param {string} inputEmail - the email to test
 * @return {string} user id matching email from database, empty string of no match found.
 */
function findUserIdFromEmail(inputEmail) {
  for (let entry in users) {
    if (users[entry].email === inputEmail) {
      return entry;
    }
  }
  return "";
}

/*
 * Checks if a given password matches for the user id
 *
 * @param {string} userID - user id to check password for
 * @param {string} inputPassword - password to be checked
 * @return {boolean} whether the password matches the user id
 */
function validatePassword(userID, inputPassword) {
  return bcrypt.compareSync(inputPassword, users[userID].password);
}

/*
 * Returns an object containing all the short urls created by the user
 *
 * @param {string} id - the user id to check the urlsDatabase for
 * @return {object} all of the objects from the urlDatabase that the user has created
 */
function urlsForUser(id) {
  //take an id, search the urldatabase and returns a new object that only contains urls with the given id.
  let updatedDatabase = {};
  for (let i in urlDatabase) {
    if (id === urlDatabase[i].userID){
      updatedDatabase[i] = {
        short: urlDatabase[i].short,
        long: urlDatabase[i].long,
        userID: urlDatabase[i].userID
      }
    }
  }
  return updatedDatabase;
}

/*
 * Checks if a given short url already exists in the database
 *
 * @param {string} crunchedCode - tiny url to check
 * @return {Boolean} whether the tiny url already exists or not
 */
function doesTinyExist(cruchedCode) {
  for (let i in urlDatabase) {
    if (cruchedCode === urlDatabase[i].short) {
      return true;
    }
  }
  return false;
}


/* Browser Requests */
app.get("/", (req, res) => {
  // check if logged in, redirect to login screen if not
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  // if already logged in redirect to urls page
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }

  let templateVars = {
    urls: urlDatabase,
    user_id: users[req.session.user_id],
      };
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  // if already logged in redirect to urls page
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }

  let templateVars = {
    urls: urlDatabase,
    user_id: users[req.session.user_id],
  };
  res.render("urls_register", templateVars);
});

app.get("/urls", (req, res) => {
  // create a new object, fill with url data for the user from urlDatabase
  if (!req.session.user_id){
    res.status(401);
    res.send('You are not logged in. <a href="/login">Please Login Here</a>');
    return;
  }

  let updatedDatabase = {};
  updatedDatabase = urlsForUser(req.session.user_id);
  let templateVars = {
    urls: updatedDatabase,
    user_id: users[req.session.user_id],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: users[req.session.user_id],
  };
  // if not logged in redirect to login page
  if (!req.session.user_id){
    res.status(401);
    res.send('You are not logged in. <a href="/login">Please Login Here</a>');
    return;
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  // if id doesnt exist show 403 status error
  if (!doesTinyExist(req.params.id)){
    res.status(403);
    res.send('403 ERROR: This Tiny URL does not exist, feel free to make one <a href="/urls/new">Here</a>');
    return;
  }
  // if not logged in redirect to login page
  if (!req.session.user_id){
    res.status(401);
    res.send('You are not logged in. <a href="/login">Please Login Here</a>');
    return;
  }
  // if page does not belong to user show error msg
  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403);
    res.send('403 ERROR: This URL doesnt belong to you. See your <a href="/urls">TinyLinks<a href="/urls/new">Here</a></a>');
    return;
  }
  let templateVars = {
    urls: urlDatabase,
    shortURL: req.params.id,
    user_id: users[req.session.user_id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  // if short url does not exist show 403 status error
  if (!doesTinyExist(req.params.id)){
    res.status(403);
    res.send('403 ERROR: This Tiny URL does not exist, feel free to make on <a href="/urls/new">Here</a>');
    return;
  }
  let longURL = urlDatabase[req.params.id].long;
    if (longURL.slice(0, 4) !== 'http') {
    longURL = "https://" + longURL;
  }
  res.redirect(longURL);
});


app.post("/urls", (req, res) => {
  if (!req.session.user_id){
    res.status(401);
    res.send('You are not logged in. <a href="/login">Please Login Here</a>');
    return;
  }

  let newShortURL = generateRandomString();
  // TODO should add check that generated value is actually unique, unlikely but possible
  let longURL = req.body.longURL;
  if (!longURL) {
    res.status(403);
    res.send('403 ERROR: You did not enter a URL. <a href="/urls/new"> Try again</a>')
  }
  urlDatabase[newShortURL] = {
    short: newShortURL,
    long: longURL,
    userID: req.session.user_id
  }

  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  // if not logged in redirects to login page, if tiny link doesn't belong to user show 403 status error
  if (!req.session.user_id){
    res.status(401);
    res.send('You are not logged in. <a href="/login">Please Login Here</a>');
    return;
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403);
    res.send('403 ERROR: This URL doesnt belong to you. <a href="/urls">See your TinyLinks here</a>');
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  // if user not logged in redirect to login page, if tiny url does not belong to user show 403 status
  if (!req.session.user_id){
    res.status(401);
    res.send('You are not logged in. <a href="/login">Please Login Here</a>');
    return;
  }
  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403);
    res.send('03 ERROR: This URL doesnt belong to you. <a href="/urls/new">See your TinyLinks here</a>');
    return;
  }

  let longURL = req.body.longURL;
  urlDatabase[req.params.id].long = longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/login", (req, res) => {
  let inputEmail = req.body.email;
  let inputPassword = req.body.password;
  let userID = "";
  //check if email exists

  userID = findUserIdFromEmail(inputEmail);

  // if email isnt in database show 403 status
  if (!userID) {
    res.status(403);
    res.send('403 ERROR: Invalid Email. <a href="/login">Try Again</a>');
  } else {
    //check if password is valid, show 403 status if its not
    if(validatePassword(userID, inputPassword)){
      req.session.user_id = userID;
      res.redirect("/urls");
    } else {
      res.status(403);
      res.send('403 ERROR: Invalid password <a href="/login">Try Again</a>');
    }
  }

});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  // if either input is empty, show a 400 status
  if(!req.body.email || !req.body.password) {
    res.status(400);
    res.send('Missing email or password. <a href="/register">Try Again</a>');
    return;
  }
  // if email is already registered, show a 400 status
  for (let entry in users) {
    if (users[entry].email === req.body.email) {
      res.status(400);
      res.send('Email already in use. <a href="/register">Try Again</a>');
      return;
    }
  }

  let userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 15)
  }
  req.session.user_id = userId;
  res.redirect("/urls");
});


// Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

