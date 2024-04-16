import { ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

var shotsPerFilename = {}

export default class FileHandling {
    constructor() {
        ipcMain.on('save-file', (event, data) => {
            const buffer = Buffer.from(data.data)
            saveFile(buffer, event, data)
        })
    }
}

function saveFile(buffer, event, data) {
    const filenameToSave = `${data.name}.png`
    const filePath = path.join(data.folder, filenameToSave)
    const filePathParent = path.dirname(filePath)

    fs.promises.mkdir(filePathParent, { recursive: true })
    .then(() => fs.promises.writeFile(filePath, buffer, { flag: "wx" }))
    .catch(err => {
        event.reply('save-file-reply', { filename: filePath, error: err })
    })
}