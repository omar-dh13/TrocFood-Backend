require("dotenv").config();
require("./models/connection");

var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var favoritesRouter = require("./routes/favorites");
var donsRouter = require("./routes/dons");
// var logmealRouter = require("./routes/logmeal");

var chatRouter = require("./routes/chat");
var app = express();

const cors = require("cors");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/dons", donsRouter);
app.use("/favorites", favoritesRouter);
// app.use("/logmeal", logmealRouter);
app.use("/chat", chatRouter);

module.exports = app;
