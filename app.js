var createError = require("http-errors");
var express = require("express");

var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
require("dotenv").config();
var indexRouter = require("./routes/index");
//var authRouter = require("./routes/auth");
//var usersRouter = require("./routes/users");
const RedisStore = require("connect-redis")(session);
const { createClient } = require("redis");

const redisClient = createClient({
  legacyMode: true, // Use legacy mode for compatibility with connect-redis
  url: "redis://localhost:6379", // Replace with your Redis URL if necessary
});
redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect(); // Explicitly connect the Redis client
})();

var app = express();

//require('./boot/auth')();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Set up session middleware
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SECRET_SESSION, 
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      httpOnly: true, 
      maxAge: 60 * 1000, // Session expires in 1 minute
    },
  })
);

// Pass session to templates
app.use((req, res, next) => {
  res.locals.session = req.session; // Makes `session` accessible in EJS templates
  next();
});

// General messages
app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;
  req.session.messages = [];
  next();
});

app.use("/", indexRouter);
//app.use("/users", usersRouter);

//setting showLogout variable to be false
app.use((req, res, next) => {
  res.locals.showLogout = false;
  next();
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;

  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("./pages/error");
});

module.exports = app;
