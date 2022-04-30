const express = require("express");
const bp = require("body-parser")
const dotenv = require("dotenv").config()
const { MongoClient, ServerApiVersion, ConnectionClosedEvent } = require("mongodb")
const NodeCache = require("node-cache")
const cache = new NodeCache()

const client = new MongoClient(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })
const app = express();
const PORT = process.env.PORT || 3000

app.use(express.static(__dirname + "/public"))
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))


let checkip = (req, res, next) => {
    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress 
    console.log(ip)
    if(cache.get(ip)) res.status(403).redirect("/voted")
    else next()
}

app.get("/", checkip, (req, res) => {
    res.sendFile(__dirname + "/public/home.html")
})

app.post("/submit", (req, res) => {
    let q = req.query

    res.setHeader("Content-Type", "application/json")

    if (q.img == "undefined") return res.send({ error: "Pas d'image sélectionée" })

    client.connect().then(db => {
        const dbo = db.db()

        dbo.collection("votes").insertOne({logo: { id: q.img, auteur: q.auteur }, date: Date.now() })
            .then(doc => {
                let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
                res.cookie("voted", q.img, { maxAge: 1000 * 60 * 60 * 24 * 7 })
                cache.set(ip, q.img, 0)
                res.send({ redirect: "/voted" })
                db.close()

            }).catch(err => console.log(err))
    })
        .catch(err => console.log("error connecting", err))
})

app.get("/voted", (req, res) => {
    console.log("yes")
    res.sendFile(__dirname + "/public/voted.html")
})

function checkCookie(req, res, next) {
    console.log("h")
    console.log(req?.headers)
    next()
}

app.listen(PORT, () => console.log(`Listening on port:${PORT}`))