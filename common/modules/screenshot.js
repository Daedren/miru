import { settings } from '@/modules/settings.js'
import IPC from '@/modules/ipc.js'
import { toast } from 'svelte-sonner'
import { ScreenshotLocation } from '@/modules/util.js'

var shotsPerFilename = {}

IPC.on('save-file-reply', result => {
  console.log(result)
  if (result.err) {
    toast.error('Screenshot', {
      description: `Could not save screenshot - ${result.err}`
    })
  } else {
    toast.success('Screenshot', {
      description: 'Saved screenshot to filesystem.'
    })
  }
})

export async function takeScreenshot(video, subs, filename) {
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
  switch (settings.value.screenshotLocation) {
    case ScreenshotLocation.Clipboard:
      await saveToClipboard(blob)
      break
    case ScreenshotLocation.Filesystem:
      const location = settings.value.screenshotFilesystemPath
      await saveToFilesystem(blob, filename, location)
      break
  }
  canvas.remove()
}

async function saveToFilesystem(blob, filename, location) {
  const arr = await blob.arrayBuffer()
  const formattedFilename = generateFilename(settings.value.screenshotFilesystemTemplate, filename)
  window.IPC.emit('save-file', { data: arr, name: formattedFilename, folder: location })
}

async function saveToClipboard(blob) {
  if ('clipboard' in navigator) {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ])
    toast.error('Screenshot', {
      description: 'Saved screenshot to clipboard.'
    })
  } else {
    toast.error('Screenshot', {
      description: 'Could not save to clipboard.'
    })
  }
}

function numberForFilename(filename) {
  shotsPerFilename[filename] = shotsPerFilename[filename] + 1 || 1
  return String(shotsPerFilename[filename]).padStart(4, '0')
}

function generateFilename(format, filename) {
  const currentDate = new Date();
  console.log(format)
  
  // Define placeholders and their corresponding values
  const placeholders = {
      '%Y': currentDate.getFullYear(),
      '%m': ('0' + (currentDate.getMonth() + 1)).slice(-2),
      '%d': ('0' + currentDate.getDate()).slice(-2),
      '%H': ('0' + currentDate.getHours()).slice(-2),
      '%M': ('0' + currentDate.getMinutes()).slice(-2),
      '%S': ('0' + currentDate.getSeconds()).slice(-2),
      '%F': filename,
      '%n': numberForFilename(filename)
  };
  
  // Replace placeholders with actual values
  let result = format;
  for (const placeholder in placeholders) {
      const regex = new RegExp(placeholder, 'g');
      result = result.replace(regex, placeholders[placeholder]);
  }

  console.log(result)
  
  return result;
}
