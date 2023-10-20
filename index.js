const express = require("express");
const fs = require("fs");
const helmet = require("helmet");
const https = require("https");
const path = require("path");
const passport = require("passport");
const { Strategy } = require("passport-google-oauth20");
const { profile } = require("console");
const cookiesession = require("cookie-session");
const jwt = require("jsonwebtoken");
const app = express();

require("dotenv").config();
const strategy = {
  callbackURL: "/auth/google/callback",
};
const callback = async (accesstoken, refreshtoken, profile, cb) => {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=` + accesstoken
  );
  const data = await res.json();
  console.log(profile);
  cb(null, profile);
};
passport.use(
  new Strategy(
    {
      callbackURL: "/auth/google/callback",
      clientID: process.env.CLIENTID,
      clientSecret: process.env.CLIENTSECRET,
    },
    callback
  )
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  done(null, id);
});
app.use(helmet());
app.use(
  cookiesession({
    name: "sessioncookie",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    keys: [process.env.SESSIONKEY1, process.env.SESSIONKEY2],
  })
);
app.use(passport.initialize());
const test = (req, res, next) => {
  const logged = req.isAuthenticated() && req.user;
  if (logged) {
    console.log(req.user);
    next();
  } else {
    return res.status(401).json("FAILURE!");
  }
};
app.use(passport.session());
console.log(process.env.CLIENTID);
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] }),
  (req, res) => {}
);
app.get("/success", (req, res) => {
  res.json("called");
});
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/failure",
    successRedirect: "/sec",
  }),
  (req, res) => {
    console.log("called");
  }
);
app.get("/failuer", (req, res) => {
  res.json("Failure");
});
app.get("/auth/logout", (req, res) => {
  req.logout();
  return res.redirect("/");
});
app.get("/sec", test, (req, res) => {
  return res.json("secret data");
});
app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, ".", "public", "index.html"));
});
https
  .createServer(
    {
      cert: fs.readFileSync("cert.pem"),
      key: fs.readFileSync("key.pem"),
    },
    app
  )
  .listen(5000, () => {
    console.log("running");
  });
