const express = require('express')
const app = express()
const tele = require("node-telegram-bot-api")
const axios = require("axios")
const token = '7825526143:AAExgf_KTBjCy2dcV5fFCwx7odpyz18B6GM'
const bot = new tele(token, { polling: true })
const path = require('path')
let searchResults = []
let currentIndex = 0
let lastMessageId = null

const fetchJson = async (url, options) => {
try {
options = options || {}
const res = await axios({ method: 'GET', url, headers: { 'User-Agent': 'Mozilla/5.0' }, ...options, timeout: 15000 })
return res.data
} catch (err) {
throw err
}
}

const getBuffer = async (url) => { 
try { 
const res = await axios({ method: "get", url, responseType: 'arraybuffer', timeout: 15000 }) 
if (res.headers['content-length'] && parseInt(res.headers['content-length']) > 50 * 1024 * 1024) throw new Error("File too large")
return Buffer.from(res.data) 
} catch (err) { 
throw err
}
}

const sendTrack = async (msg, track, index) => {
const songLink = track.url
const songTitle = track.name
const songArtist = track.artists
const songCover = track.cover
const caption = `Here is your track:\n\nTitle: ${songTitle}\nArtist: ${songArtist}\nDuration: ${track.duration}`

const prevButton = {
text: "Prev",
callback_data: `prev|${index - 1}`
}
const nextButton = {
text: "Next",
callback_data: `next|${index + 1}`
}

const downloadButton = {
text: "Download MP3",
callback_data: `download|${songLink}`
}

const replyMarkup = {
inline_keyboard: [
[prevButton, nextButton],
[downloadButton]
]
}



// Kirim pesan baru dengan gambar dan tombol
const sentMessage = await bot.sendPhoto(msg.chat.id, songCover, { caption: caption, reply_markup: replyMarkup })
lastMessageId = sentMessage.message_id // Simpan ID pesan terakhir untuk dihapus nanti
}

bot.on('message', async (msg) => {
if (msg.text === "/start") {
const startMessage = `Welcome to the Spotify Search Bot! Here are some things you can do:
1. Search for a song: Type the song name and I will find it for you.
2. Navigate results: Click on "Next" or "Prev" to browse through results.
3. Download MP3: Click on "Download MP3" to get the audio file.

To get started, just type the name of a song! 🎶`
return bot.sendMessage(msg.chat.id, startMessage)
}

if (!msg.text) return
bot.sendMessage(msg.chat.id, "Processing your search...")
try {
const query = encodeURIComponent(msg.text)
const searchUrl = `https://sapisz.vercel.app/api/spotify?query=${query}`
const res = await fetchJson(searchUrl)
if (!res || !res.results || res.results.length === 0) {
bot.sendMessage(msg.chat.id, "No results found for your query.")
return
}

searchResults = res.results
currentIndex = 0

// Kirim track pertama
const track = searchResults[currentIndex]
sendTrack(msg, track, currentIndex)
} catch (err) {
bot.sendMessage(msg.chat.id, "Error: " + (err.response?.data?.message || err.message))
}
})

bot.on('callback_query', async (query) => {
const msg = query.message
const data = query.data.split('|')
const action = data[0]
const param = data[1]

if (action === 'prev' && currentIndex > 0) {
currentIndex -= 1
sendTrack(msg, searchResults[currentIndex], currentIndex)
} else if (action === 'next' && currentIndex < searchResults.length - 1) {
currentIndex += 1
sendTrack(msg, searchResults[currentIndex], currentIndex)
} else if (action === 'download') {
try {
const downloadUrlRes = await fetchJson(`https://sapisz.vercel.app/api/spotifydl?url=${param}`)
if (!downloadUrlRes.status || !downloadUrlRes.url) {
bot.sendMessage(msg.chat.id, "Sorry, the download link is not available.")
return
}
const audioBuffer = await getBuffer(downloadUrlRes.url)
await bot.sendAudio(msg.chat.id, audioBuffer, { caption: "Made With ❤️ by @krniwnstria" })
} catch (err) {
bot.sendMessage(msg.chat.id, "Something went wrong :C")
}
}

bot.answerCallbackQuery(query.id)
})

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.listen(3000, () => console.log(`Server listening on port 3000!`))
