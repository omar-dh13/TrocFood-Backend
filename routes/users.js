var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const moment = require("moment");
require("moment/locale/fr");

// route signup
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // vérification du format de l'email
  // const patternMail =
  //   /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  // if (!patternMail.test(req.body.email)) {
  //   res.json({ result: false, error: "Invalid email format" });
  //   return;
  // }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        password: hash,
        token: uid2(32),
      });

      newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: "User already exists" });
    }
  });
});

// route signin
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

// POST pour ajouter les infos utilisateur de EditProfile
router.post("/profile", (req, res) => {
  const {
    email,
    userName,
    firstName,
    lastName,
    phone,
    birthday,
    address,
    token,
  } = req.body;

  //vérification des champs
  if (
    !checkBody(req.body, [
      "email",
      "userName",
      "firstName",
      "lastName",
      "phone",
      "address",
      "birthday",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // vérification du format de l'email
  const patternMail =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!patternMail.test(email)) {
    res.json({ result: false, error: "Invalid email format" });
    return;
  }

  //vérification du format du téléphone
  const patternTel = /(0|(\\+33)|(0033))[1-9][0-9]{8}/;
  if (!patternTel.test(phone)) {
    res.json({ result: false, error: "Invalid phone number format" });
    return;
  }

  // update des infos utilisateurs si token trouvé
  User.findOne({ token: token }).then((data) => {
    if (data) {
      data.email !== email ? (data.email = email) : null;
      data.userName = userName;
      data.firstName = firstName;
      data.lastName = lastName;
      data.phone = phone;
      data.birthday = /*new Date(birthday) OU*/ new Date(
        moment.utc(birthday).startOf("day").toISOString()
      );
      data.address = {
        street: address.properties.name,
        postalCode: address.properties.postcode,
        city: address.properties.city,
        country: "France", // TODO : checker si on garde en brut ou si on ajoute un input pour le pays
        location: {
          type: address.geometry.type,
          coordinates: address.geometry.coordinates,
        },
      };

      data.save().then((newDoc) => res.json({ result: true, user: newDoc }));

      // réponse si token non trouvé
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

module.exports = router;
