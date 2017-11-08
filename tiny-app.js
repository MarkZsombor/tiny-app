const express = require("express");
const PORT = process.env.PORT || 8080; // default port 8080
const cookieParser = require('cookie-parser')
const app = express();

app.set("view engine", "ejs")

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  var text = [];
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  text = text.join('');

  return text;
  // grabbed from online, works and I understand it though seems uneligant.
}

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
  // console.log(urlDatabase);
  delete urlDatabase[req.params.id];
  // console.log(urlDatabase);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  let longURL = 'http://' + req.body.longURL;
  urlDatabase[req.params.id] = longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect("/urls");
});



app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase, shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});