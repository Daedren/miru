// import WebTorrent from 'webtorrent'
import { set } from '@/lib/Settings.svelte'
import { files } from '@/lib/Player/MediaHandler.svelte'
import { page } from '@/App.svelte'
import 'browser-event-target-emitter'

class TorrentWorker extends Worker {
  constructor (opts) {
    super(opts)
    this.onmessage = this.handleMessage.bind(this)
  }

  handleMessage ({ data }) {
    this.emit(data.type, data.data)
  }

  send (type, data) {
    this.postMessage({ type, data })
  }
}

export const client = new TorrentWorker(new URL('./torrentworker.js', import.meta.url))

client.send('settings', { ...set })

client.on('files', ({ detail }) => {
  files.set(detail)
})

export async function add (torrentID, hide) {
  if (torrentID) {
    files.set([])
    if (!hide) page.set('player')
    if (typeof torrentID === 'string' && !torrentID.startsWith('magnet:')) {
      // IMPORTANT, this is because node's get bypasses proxies, wut????
      const res = await fetch(torrentID)
      torrentID = Array.from(new Uint8Array(await res.arrayBuffer()))
    }
    client.send('torrent', torrentID)
  }
}

client.on('torrent', ({ detail }) => {
  localStorage.setItem('torrent', JSON.stringify(detail))
})

// load last used torrent
queueMicrotask(() => {
  setTimeout(() => {
    if (localStorage.getItem('torrent')) {
      if (!files.length) client.send('torrent', JSON.parse(localStorage.getItem('torrent')))
    }
  }, 1000)
})
