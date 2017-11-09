const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs")

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "Mark": {
    id: "Mark",
    email: "email@email.com",
    password: "Bob"
  },
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

let username = "";

function generateRandomString() {
  var text = [];
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  text = text.join('');

  return text;
  // grabbed from online, works and I understand it though seems uneligant.
}

function findUserIdFromEmail(inputEmail) {
  for (let entry in users) {
    if (users[entry].email === inputEmail) {
      console.log('Valid Email');
      return entry;
    }
  }
  return "Invalid Email";
}

function validatePassword(userID, inputPassword) {
  return (users[userID].password === inputPassword)
}

// console.log(validatePassword('Mark', 'Bob'));
// console.log(validatePassword('Mark', 'Booob'));


// Browser Requests
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: users[req.cookies["user_id"]],
  };
  res.render("urls_new", templateVars);
});

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, user_id: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase, shortURL: req.params.id, user_id: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, user_id: users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, user_id: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  //need to add check that generated value is actually unique
  let longURL = 'http://' + req.body.longURL;
  // req.body gives an output of {longURL: www.url.com}
  urlDatabase[newShortURL] = longURL;
  res.send(newShortURL);
  //Ugly, just lists the value but functional
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  let longURL = 'http://' + req.body.longURL;
  urlDatabase[req.params.id] = longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/login", (req, res) => {
  let inputEmail = req.body.email;
  let inputPassword = req.body.password;
  let userID = "";
  //check if email exists

  userID = findUserIdFromEmail(inputEmail);

  if (userID === "Invalid Email") {
    res.status(403);
    res.send("Invalid Email");
  } else {
    //check if password is valid
    if(validatePassword(userID, inputPassword)){
      res.cookie('user_id', userID);
      res.redirect("/urls");
    } else {
      res.status(403);
      res.send("Invalid password");
    }
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let errors = false;

  if(!req.body.email || !req.body.password) {
    errors = true;
    res.status(400);
    res.send('Empty input box');
  }

  for (let entry in users) {
    if (users[entry].email === req.body.email) {
      errors = true;
      res.status(400);
      res.send('Email already in use');
    }
  }

  if(!errors) {
    let userId = generateRandomString();
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: req.body.password
    }
    console.log(users[userId]);
    res.cookie('user_id', userId);
    res.redirect("/urls");
    }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

