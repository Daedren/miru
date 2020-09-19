const controls = document.getElementsByClassName('ctrl'),
    video = document.querySelector('#video'),
    player = document.querySelector('#player'),
    volume = document.querySelector('#vol'),
    progress = document.querySelector('#prog'),
    peers = document.querySelector('#peers'),
    downSpeed = document.querySelector('#down'),
    upSpeed = document.querySelector('#up'),
    playPause = document.querySelector('#ptoggle'),
    btnpp = document.querySelector('#bpp'),
    btnm = document.querySelector("#bmute"),
    btnfull = document.querySelector('#bfull'),
    btnpip = document.querySelector('#bpip'),
    elapsed = document.querySelector("#elapsed"),
    remaining = document.querySelector("#remaining"),
    buffering = document.querySelector("#buffering"),
    thumbnail = document.querySelector("#dThumb")


// event listeners
volume.addEventListener("input", function () {
    updateVolume()
});
progress.addEventListener("input", dragBar);
progress.addEventListener("mouseup", dragBarEnd);
progress.addEventListener("click", dragBarEnd);
progress.addEventListener("mousedown", dragBarStart);
video.addEventListener("playing", resetBuffer);
video.addEventListener("loadeddata", initThumbnail);
video.addEventListener("loadedmetadata", updateDisplay);
video.addEventListener("ended", bnext);
video.addEventListener("waiting", isBuffering);
video.addEventListener("timeupdate", updateDisplay);
video.addEventListener("timeupdate", updatePositionState);
playPause.addEventListener("click", bpp);
playPause.addEventListener("dblclick", bfull);


for (let i = 0; i < controls.length; i++) {
    controls[i].addEventListener("click", function () {
        let func = this.id;
        window[func]()
    })
}

// progress bar and display

function updateDisplay() {
    let progressPercent = (video.currentTime / video.duration * 100)
    let bufferPercent = video.buffered.length == 0 ? 0 : video.buffered.end(video.buffered.length - 1) / video.duration * 100
    progress.style.setProperty("--buffer", bufferPercent + "%");
    updateBar(progressPercent || progress.value / 10);
    createThumbnail(video);
}

function dragBar() {
    video.pause()
    updateBar(progress.value / 10)
}

function dragBarEnd() {
    video.currentTime = currentTime || 0
    playVideo()
}

async function dragBarStart() {
    await video.pause()
    updateBar(progress.value / 10)
}

let currentTime;
function updateBar(progressPercent) {
    currentTime = video.duration * progressPercent / 100
    progress.style.setProperty("--progress", progressPercent + "%");
    elapsed.innerHTML = toTS(currentTime);
    remaining.innerHTML = toTS(video.duration - currentTime);
    progress.value = progressPercent * 10
    let bg = thumbnails.length == 0 ? "" : thumbnails[Math.floor(currentTime / 5) || 0]
    progress.style.setProperty("--background", "url(" + (bg || "") + ")")
    progress.style.setProperty("--left", progressPercent + "%")
    progress.setAttribute("data-ts", toTS(currentTime))
}

// dynamic thumbnails 
let thumbnails = []
let ratio
let canvas = document.createElement("canvas")
let context = canvas.getContext('2d')
let w = 150, h

function initThumbnail() {
    if (settings.player5) {
        thumbnails = []
        ratio = video.videoWidth / video.videoHeight;
        h = parseInt(w / ratio)
        canvas.width = w;
        canvas.height = h;
        progress.style.setProperty("--height", h + "px");
    }
}

function createThumbnail(vid) {
    if (settings.player5) {
        let index = Math.floor(vid.currentTime / 5)
        if (!thumbnails[index] && h) {
            context.fillRect(0, 0, w, h);
            context.drawImage(vid, 0, 0, w, h);
            thumbnails[index] = canvas.toDataURL("image/jpeg")
        }
    }
}

function finishThumbnails(file) {
    if (settings.player5) {
        let thumbVid = document.createElement("video")
        file.getBlobURL((err, url) => {
            thumbVid.src = url
        })
        thumbVid.addEventListener('loadeddata', function (e) {
            loadTime();
        }, false)

        thumbVid.addEventListener('seeked', function () {
            createThumbnail(thumbVid);
            loadTime();
        }, false)

        function loadTime() {
            if (thumbVid.ended == false) {
                thumbVid.currentTime = thumbVid.currentTime + 5;
            } else {
                thumbVid.remove()
            }
        }
    }
}


// bufering spinner

let buffer;
function resetBuffer() {
    if (!!buffer) {
        clearTimeout(buffer)
        buffer = undefined
        buffering.classList.add('hidden')
    }
}

function isBuffering() {
    buffer = setTimeout(displayBuffer, 150)
}

function displayBuffer() {
    buffering.classList.remove('hidden')
    resetTimer()
}

// immerse timeout
let immerseTime;

document.onmousemove = resetTimer;
document.onkeypress = resetTimer;
function immersePlayer() {
    player.classList.add('immersed')
}

function resetTimer() {
    clearTimeout(immerseTime);
    player.classList.remove('immersed')
    immerseTime = setTimeout(immersePlayer, parseInt(settings.player2) * 1000)
}

let islooped;

function toTS(sec) {
    if (Number.isNaN(sec)) {
        return "--:--";
    }

    let hours = Math.floor(sec / 3600)
    let minutes = Math.floor((sec - (hours * 3600)) / 60)
    let seconds = Math.floor(sec - (hours * 3600) - (minutes * 60));

    if (minutes < 10) {
        minutes = `0${minutes}`;
    }

    if (seconds < 10) {
        seconds = `0${seconds}`;
    }

    if (hours > 0) {
        return `${hours}:${minutes}:${seconds}`;
    } else {
        return `${minutes}:${seconds}`;
    }
}

// play/pause button
async function playVideo() {
    try {
        await video.play();
        btnpp.innerHTML = "pause";
    } catch (err) {
        btnpp.innerHTML = "play_arrow";
    }
}

function bpp() {
    if (video.paused) {
        playVideo();
    } else {
        btnpp.innerHTML = "play_arrow";
        video.pause();
    }
}

function bnext() {
    if (settings.player6) {
        nyaaSearch(nowPlaying[0], parseInt(nowPlaying[1]) + 1)
    }
}

// volume shit

let oldlevel;

function bmute() {
    if (video.volume == 0) {
        updateVolume(oldlevel)
    } else {
        oldlevel = video.volume * 100
        updateVolume(0)
    }
}

let level

function updateVolume(a) {
    if (a == null) {
        level = volume.value;
    } else {
        level = a;
        volume.value = a;
    }
    document.documentElement.style.setProperty("--volume-level", level + "%");
    btnm.innerHTML = (level == 0) ? "volume_off" : "volume_up";
    video.volume = level / 100
}
updateVolume(parseInt(settings.player1))


// PiP

async function bpip() {
    if (video !== document.pictureInPictureElement) {
        await video.requestPictureInPicture();
    } else {
        await document.exitPictureInPicture();
    }
}

if (settings.player7) {
    video.setAttribute("autoPictureInPicture", "");
} else {
    video.setAttribute("disablePictureInPicture", "");
    btnpip.setAttribute("disabled", "");
}

//miniplayer
if (!settings.player4) {
    document.documentElement.style.setProperty("--miniplayer-display", "none");
}
// theathe mode

function btheatre() {
    halfmoon.toggleSidebar();
}

// fullscreen

function bfull() {
    if (!document.fullscreenElement) {
        player.requestFullscreen();
        btnfull.innerHTML = "fullscreen_exit"
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
        btnfull.innerHTML = "fullscreen"

    }
}

function seek(a) {
    video.currentTime += a;
    updateDisplay()
}

// subtitles, generates content every single time its opened because fuck knows when the parser will find new shit

let off
function bcap() {
    let frag = document.createDocumentFragment()
    off = document.createElement("a")
    off.classList.add("dropdown-item", "pointer", "text-white")
    off.innerHTML = "OFF"
    off.onclick = function () {
        selectLang("OFF")
    }
    frag.appendChild(off)

    for (let i = 0; i < video.textTracks.length; i++) {
        let template = document.createElement("a")
        template.classList.add("dropdown-item", "pointer")
        template.innerHTML = video.textTracks[i].language
        if (video.textTracks[i].mode == "showing") {
            template.classList.add("text-white")
            off.classList.add("text-muted")
            off.classList.remove("text-white")
        } else {
            template.classList.add("text-muted")
        }
        template.onclick = function () {
            selectLang(video.textTracks[i].language)
        }
        frag.appendChild(template)
    }

    document.querySelector("#subMenu").textContent = '';
    document.querySelector("#subMenu").appendChild(frag)
}
function selectLang(lang) {
    for (let i = 0; i < video.textTracks.length; i++) {
        if (video.textTracks[i].language == lang) {
            video.textTracks[i].mode = 'showing';
        }
        else {
            video.textTracks[i].mode = 'hidden';
        }
    }
    bcap()
}

document.documentElement.style.setProperty("--sub-font", settings.subtitle1);
// keybinds

document.onkeydown = function (a) {
    if (document.location.href.endsWith("#player")) {
        switch (a.key) {
            case " ":
                bpp();
                break;
            case "n":
                bnext();
                break;
            case "m":
                bmute();
                break;
            case "p":
                bpip();
                break;
            case "t":
                btheatre();
                break;
            case "c":
                bcap();
                break;
            case "f":
                bfull();
                break;
            case "s":
                seek(85);
                break;
            case "ArrowLeft":
                seek(-parseInt(settings.player3));
                break;
            case "ArrowRight":
                seek(parseInt(settings.player3));
                break;
        }
    }
}

// media session
function selPlaying(sel) {
    nowPlaying = sel
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: nowPlaying[0].title.english || nowPlaying[0].title.romaji,
            artist: "Episode " + nowPlaying[1],
            album: "Miru",
            artwork: [
                {
                    src: nowPlaying[0].coverImage.medium,
                    sizes: '128x128',
                    type: 'image/png'
                }
            ]
        });
    }
}

function updatePositionState() {
    if ('setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
            duration: video.duration || 0,
            playbackRate: video.playbackRate || 0,
            position: video.currentTime || 0
        });
    }
}

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', bpp);
    navigator.mediaSession.setActionHandler('pause', bpp);
    navigator.mediaSession.setActionHandler('seekbackward', function () {
        seek(-2);
    });
    navigator.mediaSession.setActionHandler('seekforward', function () {
        seek(2);
    });
    navigator.mediaSession.setActionHandler('nexttrack', bnext);
}