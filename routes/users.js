var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

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

// POST pour ajouter les infos utilisateur de CreateProfile
router.post("/profile", (req, res) => {
  const {
    email,
    userName,
    firstName,
    lastName,
    phone,
    // birthday,
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
      // "birthday",
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
      // data.birthday = birthday;
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
// GET pour récupérer les informations d'un utilisateur
router.get("/profile", (req, res) => {
  const { token } = req.query;

  if (!token) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ token: token }).then((data) => {
    if (data) {
      res.json({ result: true, user: data });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

// PUT pour update des infos user et modif mdp
router.put("/profile", (req, res) => {
  const { email, userName, firstName, lastName, phone, token, password, newPassword } = req.body;

  //vérification des champs
  if (
    !checkBody(req.body, [
      "email",
      "userName",
      "firstName",
      "lastName",
      "phone",
    ])
  ) {
    res.json({ result: false, error: "Tu as dû oublier de remplir un champ (de maïs)" });
    return;
  }

  // vérification du format de l'email
  const patternMail =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!patternMail.test(email)) {
    res.json({ result: false, error: "A ma connaissance ça ne ressemble pas à un email valide" });
    return;
  }

  //vérification du format du téléphone
  const patternTel = /(0|(\\+33)|(0033))[1-9][0-9]{8}/;
  if (!patternTel.test(phone)) {
    res.json({ result: false, error: "Tu as mal saisis ton numéro de téléphone" });
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

      data.save().then((newDoc) => res.json({ result: true, user: newDoc }));

      // réponse si token non trouvé
    } else {
      res.json({ result: false, error: "Utilisateur non trouvé, essaye encore!" });
    }
  });
//en cas de modification du mot de passe:
  if(newPassword.result) {
    !checkBody(req.body, ["password", "newPassword"]) 
      res.json({ result: false, error: "T'es con ou quoi? tu as oublié de remplir un champ (de blé)" });
      return(
    
    // update du mot de passe si token trouvé
    User.findOne({ token: token }).then((data) => {
      if (data && bcrypt.compareSync(password, data.password)) {
        const hash = bcrypt.hashSync(newPassword, 10);
        data.password = hash;

        data.save().then(() => res.json({ result: true }));
      } else {
        res.json({ result: false, error: "Utilisateur non trouvé ou mot de passe erroné, t'es sûr que tu existes?" });
      }
    }));
  }
});











module.exports = router;
