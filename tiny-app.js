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

app.set("view engine", "ejs")

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Datasets

const urlDatabase = {
  "b2xVn2": {
    short: "b2xVn2",
    long: "http://www.lighthouselabs.ca",
    userID: "Mark"
  },
  "9sm5xK": {
    short: "9sm5xK",
    long: "http://www.google.com",
    userID: "Bob"
  }
};


const markPassword = bcrypt.hashSync("Bob", 15);

const users = {
  "Mark": {
    id: "Mark",
    email: "email@email.com",
    password: markPassword
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

// Functions

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
      return entry;
    }
  }
  return false;
}

function validatePassword(userID, inputPassword) {
  return bcrypt.compareSync(inputPassword, users[userID].password);
}

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

function findEmail(id) {
  if (id === undefined) {
    return "";
  } else if(users[id]) {
      return users[id].email;
  } else {
    return "";

  }
}

// console.log(findEmail("Mark"));
// console.log(findEmail(req.session.user_id));
// console.log(findEmail("Dog"));


function doesTinyExist(cruchedCode) {
  for (let i in urlDatabase) {
    if (cruchedCode === urlDatabase[i].short) {
      return true;
    }
  }
  return false;
}


// Browser Requests
app.get("/u/:id", (req, res) => {
  if (!doesTinyExist(req.params.id)){
    res.status(403);
    res.send("This Tiny URL does not exist");
    return;
  }

  let longURL = urlDatabase[req.params.id].long;
  res.redirect(longURL);

});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: users[req.session.user_id],
    // email: users[req.session.user_id].email
  };
  if (req.session.user_id){
    res.render("urls_new", templateVars);
    return;
  }

  res.redirect("/login");

});

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }

  res.redirect("/urls");

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let updatedDatabase = {};
  updatedDatabase = urlsForUser(req.session.user_id);
  let templateVars = {
    urls: updatedDatabase,
    user_id: users[req.session.user_id],
    // email: users[req.session.user_id].email
     };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!doesTinyExist(req.params.id)){
    res.status(403);
    res.send("This Tiny URL does not exist");
  } else {
    let templateVars = {
      urls: urlDatabase,
      shortURL: req.params.id,
      user_id: users[req.session.user_id],
      // email: users[req.session.user_id].email
    };
    if (!req.session.user_id) {
      res.redirect("/login");
    } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
        res.status(403);
        res.send("This URL doesnt belong to you");
    } else {
      res.render("urls_show", templateVars);
    }
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }

  let templateVars = {
    urls: urlDatabase,
    user_id: users[req.session.user_id],
    // email: users[req.session.user_id].email
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }

  let templateVars = {
    urls: urlDatabase,
    user_id: users[req.session.user_id],
    // email: users[req.session.user_id].email
  };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  //need to add check that generated value is actually unique
  let longURL = req.body.longURL;
  // req.body gives an output of {longURL: www.url.com}
  urlDatabase[newShortURL] = {
    short: newShortURL,
    long: longURL,
    userID: req.session.user_id
  }
  // console.log(urlDatabase[newShortURL]);
  res.send(newShortURL);
  //Ugly, just lists the value but functional
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403);
    res.send("This URL doesnt belong to you");
    return;
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");

});

app.post("/urls/:id", (req, res) => {
  let longURL = req.body.longURL;
  urlDatabase[req.params.id] = longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/login", (req, res) => {
  let inputEmail = req.body.email;
  let inputPassword = req.body.password;
  let userID = "";
  //check if email exists

  userID = findUserIdFromEmail(inputEmail);

  if (!userID) {
    res.status(403);
    res.send("Invalid Email");
  } else {
    //check if password is valid
    if(validatePassword(userID, inputPassword)){
      req.session.user_id = userID;
      res.redirect("/urls");
    } else {
      res.status(403);
      res.send("Invalid password");
    }
  }

});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  //Need to go back over this and see if there is a better way to solve it using helper functions

  if(!req.body.email || !req.body.password) {
    res.status(400);
    res.send('Empty input box');
    return;
  }

  for (let entry in users) {
    if (users[entry].email === req.body.email) {
      res.status(400);
      res.send('Email already in use');
      return;
    }
  }

  let userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 15)
  }
  req.session.user_id = userID;
  res.redirect("/urls");
});


// Listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

