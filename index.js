const express = require('express')
const app = express()
const tele = require("node-telegram-bot-api")
const axios = require("axios")

const token = "7223830783:AAFkhuQfbgXOCiz8a5mO_KRoXOtxzcYYePw"
const Siesta = new tele(token, { polling: true })

const getBuffer = async (url, options) => { 
try { 
options = options || {}
const res = await axios({ method: "get", url, headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 }, ...options, responseType: 'arraybuffer' }) 
return Buffer.from(res.data) 
} catch (err) { 
throw err
}
}

const fetchJson = async (url, options) => {
try {
options = options || {}
const res = await axios({
method: 'GET',
url: url,
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
},
...options
})
return res.data
} catch (err) {
throw err
}
}

Siesta.on('message', async(msg) => {
if (msg.text.startsWith("https://")) {
if (msg.text.includes("tiktok")) {
Siesta.sendMessage(msg.chat.id, "Please Wait...")
try {
let res = await fetchJson("https://api.tiklydown.eu.org/api/download?url=" + msg.text)
const buffer = await getBuffer(res.video.noWatermark)
await Siesta.sendVideo(msg.chat.id, buffer, { caption: "Siesta Downloader" })
} catch (error) {
Siesta.sendMessage(msg.chat.id, "Error downloading or sending video.")
}
} else if (msg.text.includes("spotify")) {
Siesta.sendMessage(msg.chat.id, "Please Wait...")
try {
let res = await fetchJson("https://api.satzzdev.xyz/api/spotifydl?url=" + msg.text)
const buffers = await getBuffer(res.download)
await Siesta.sendAudio(msg.chat.id, buffers, { caption: "Siesta Downloader" })
} catch (error) {
Siesta.sendMessage(msg.chat.id, "Error downloading or sending video.")
}
} else if (msg.text.includes("youtube")) {
Siesta.sendMessage(msg.chat.id, "Please Wait...")
try {
let res = await fetchJson("https://api.satzzdev.xyz/api/ytmp3?url=" + msg.text)
const buffs = await getBuffer(res.download.url)
await Siesta.sendAudio(msg.chat.id, buffs, { caption: "Siesta Downloader" })
} catch (error) {
Siesta.sendMessage(msg.chat.id, "Error downloading or sending video.")
}
}
}
})

app.get('/', (req, res) => res.send("hello world"))

app.listen(3000, () => console.log(`Example app listening on port 3000!`))
