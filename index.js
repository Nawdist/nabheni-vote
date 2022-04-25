const express = require("express");
const bp = require("body-parser")
const dotenv = require("dotenv").config()
const { MongoClient, ServerApiVersion } = require("mongodb")
const EmailValidator = require("email-validator")


const client = new MongoClient(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })
const app = express();
const PORT = process.env.PORT || 3000

app.use(express.static(__dirname + "/public"))
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html")
})

app.post("/submit", (req, res) => {
    let q = req.query

    res.setHeader("Content-Type", "application/json")

    if (!EmailValidator.validate(q.email)) return res.send({ error: "Adresse e-mail invalide" })
    if (q.img == "undefined") return res.send({ error: "Pas d'image sélectionée" })

    client.connect().then(db => {
        const dbo = db.db()

        dbo.collection("votes").insertOne({ email: q.email, logo: { id: q.img, auteur: q.auteur }, date: Date.now() })
            .then(doc => {
                res.send({ redirect: "/sucess" })

                db.close()

            }).catch(err => console.log(err))
    })
    .catch(err => console.log("error connecting", err))
})

app.get("/sucess", (req, res) => {
    res.send("voted")
})

app.listen(PORT, () => console.log(`Listening on port:${PORT}`))