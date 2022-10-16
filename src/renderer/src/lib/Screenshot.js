import { set } from './Settings.svelte'
import { addToast } from '@/lib/Toasts.svelte'
export const ScreenshotLocation = {
  Clipboard: 'clipboard',
  Filesystem: 'filesystem'
}
export const ScreenshotLocations = [ScreenshotLocation.Clipboard, ScreenshotLocation.Filesystem]
export const ScreenshotLocationDefault = ScreenshotLocation.Clipboard


console.log("Wewgggewe running ScreenshotJS!")

window.IPC.on('save-file-reply', result => {
  console.log(result)
  if (result.err) {
    addToast({
      text: `Could not save screenshot - ${result.err}`,
      title: 'Screenshot',
      type: 'danger'
    })
  } else {
    addToast({
      text: 'Saved screenshot to filesystem.',
      title: 'Screenshot',
      type: 'success'
    })
  }
})

export async function takeScreenshot(video, subs, filename) {
  const settings = set
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  context.drawImage(video, 0, 0)
  if (subs?.renderer) {
    subs.renderer.resize(video.videoWidth, video.videoHeight)
    await new Promise(resolve => setTimeout(resolve, 1000)) // this is hacky, but TLDR wait for canvas to update and re-render, in practice this will take at MOST 100ms, but just to be safe
    context.drawImage(subs.renderer._canvas, 0, 0, canvas.width, canvas.height)
    subs.renderer.resize(0, 0, 0, 0) // undo resize
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve))
  switch (settings.screenshotLocation) {
    case ScreenshotLocation.Clipboard:
      await saveToClipboard(blob)
      break
    case ScreenshotLocation.Filesystem:
      const location = settings.screenshotFilesystemPath
      await saveToFilesystem(blob, filename, location)
      break
  }
  canvas.remove()
}

async function saveToFilesystem(blob, filename, location) {
  const arr = await blob.arrayBuffer()
  window.IPC.emit('save-file', { data: arr, name: filename, folder: location })
}

async function saveToClipboard(blob) {
  if ('clipboard' in navigator) {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ])
    addToast({
      text: 'Saved screenshot to clipboard.',
      title: 'Screenshot',
      type: 'success'
    })
  } else {
    addToast({
      text: 'Could not save to clipboard.',
      title: 'Screenshot',
      type: 'danger'
    })
  }
}