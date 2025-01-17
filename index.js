const express = require('express')
const app = express()
const tele = require("node-telegram-bot-api")
const axios = require("axios")

const token = process.env.BOT_TOKEN
const Siesta = new tele(token, { polling: true })

const getBuffer = async (url, options) => { 
try { 
options = options || {}
const res = await axios({ method: "get", url, headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 }, ...options, responseType: 'arraybuffer', timeout: 15000 }) 
if (res.headers['content-length'] && parseInt(res.headers['content-length']) > 50 * 1024 * 1024) throw new Error("File too large")
return Buffer.from(res.data) 
} catch (err) { 
throw err
}
}

const fetchJson = async (url, options) => {
try {
options = options || {}
const res = await axios({ method: 'GET', url, headers: { 'User-Agent': 'Mozilla/5.0' }, ...options, timeout: 15000 })
return res.data
} catch (err) {
throw err
}
}

function isUrl(str) {
const urlRegex = /^(https?:\/\/)?((www\.)?[\w-]+\.[\w-]+)(\/[\w-./?%&=]*)?$/i
return urlRegex.test(str)
}

Siesta.on('message', async(msg) => {
if (!msg.text || !isUrl(msg.text)) return
Siesta.sendMessage(msg.chat.id, "Please Wait...")
try {
if (msg.text.includes("tiktok.com")) {
const res = await fetchJson("https://api.tiklydown.eu.org/api/download?url=" + msg.text)
if (!res.video || !res.video.noWatermark) throw new Error("Invalid response")
const buffer = await getBuffer(res.video.noWatermark)
await Siesta.sendVideo(msg.chat.id, buffer, { caption: "Siesta Downloader" })
} else if (msg.text.includes("spotify")) {
const res = await fetchJson("https://api.satzzdev.xyz/api/spotifydl?url=" + msg.text)
if (!res.download) throw new Error("Invalid response")
const buffer = await getBuffer(res.download)
await Siesta.sendAudio(msg.chat.id, buffer, { caption: "Siesta Downloader" })
} else if (msg.text.includes("youtube")) {
const res = await fetchJson("https://api.satzzdev.xyz/api/ytmp3?url=" + msg.text)
if (!res.download || !res.download.url) throw new Error("Invalid response")
const buffer = await getBuffer(res.download.url)
await Siesta.sendAudio(msg.chat.id, buffer, { caption: "Siesta Downloader" })
} else {
throw new Error("Unsupported URL")
}
} catch (err) {
console.error(err.message)
Siesta.sendMessage(msg.chat.id, "Error: " + (err.response?.data?.message || err.message))
}
})

app.get('/', (req, res) => res.send("hello world"))

app.listen(3000, () => console.log(`Example app listening on port 3000!`))
