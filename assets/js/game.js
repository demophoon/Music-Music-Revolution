$(document).ready(function() {
    console.log("Loading...");
    init();
    changeSettings();
    loadGame();
    $(".collapsibleContainer").collapsiblePanel();
    showSplashScreen();
    // hideSplashScreen();
    // showFilePrompt();
    loadThemeMusic();
});

function initProgress(evt) {
    $('#initProgress').attr("value",(evt.loaded/evt.total)*95);
}

var mainMenuBuffer = null;
var mmsrc = null;
var mmgain = null;

var demoModeEnabled = false;
var userDifficulty = c;

var hitSize = 40;

var demoModeTimer = null;

function resetDemoMode() {
    if (demoModeEnabled == true && playing == true) {
        keyHit({'which':27});
        resetGame()
        demoModeEnabled = false;
        c = userDifficulty;
        maxbpm = 400;
        maxWait = 0.2;
    }
    clearTimeout(demoModeTimer);
    if (playing == false) {
        demoModeTimer = setTimeout(function() { demoMode(); },90000);
    }
}

function demoMode() {
    clearTimeout(demoModeTimer);
    demoModeEnabled = true;
    userDifficulty = c;
    c = 1.09;
    maxbpm = 1200;
    maxWait = 0.15;
    downloadSong('./music/menu/supermode.mp3');
}

function loadThemeMusic() {
    var req = new XMLHttpRequest();
    req.open('GET', './music/menu/preamble.ogg', true);
    req.responseType = 'arraybuffer';
    req.onprogress = initProgress;
    
    req.onload = function() {
        console.log('Download Complete');
        
        audioContext.decodeAudioData(req.response, function(buffer){
            console.log('Audio Decoded');
            $('#initProgress').attr("value",100);
            mmsrc = audioContext.createBufferSource();
            mmgain = audioContext.createGainNode();
            mmgain.gain.value = .9;
            mainMenuBuffer = buffer;
            startMainMenuMusic();
            setTimeout(function() { 
                hideSplashScreen();
                showFilePrompt();
            }, 2000);
        }, function() {
            alert('An error has occured.');
        });
    }
    req.send();
}

function resetGame() {
    finalscore = 0;
    rating = "";
    combo = 0;
    multiplier = 1;
    hits = new Array();
    totalPoints = 0;
    currentPoints = 0;
    maxCombo = 0;
    endOfSong = false;
    endOfGame = false;
    playing = false;
    startTime = audioContext.currentTime;
}

function changeTip() {
    $('#tips').html(tips[~~(Math.random()*tips.length)]);
}

function showSplashScreen() {
    console.log('Splash Screen Show');
    $('#splashScreen').show();
    $('#splashScreen').stop(true,false).animate({opacity:1},1500);
}
function hideSplashScreen() {
    console.log('Splash Screen Hide');
    $('#splashScreen').stop(true,false).animate({opacity:0},1500,function () {
        $('#splashScreen').hide();
    });
}

function showFilePrompt() {
    resetDemoMode();
    resetGame()
    console.log('Main Menu Show');
    console.log('Fade In Menu Music');
    fadeInMenuMusic();
    $('#filePrompt').show();
    $('#filePrompt').stop(true,false).animate({opacity:1},1500);
}
function hideFilePrompt() {
    console.log('Main Menu Hide');
    $('#filePrompt').stop(true,false).animate({opacity:0},1500,function () {
        $('#filePrompt').hide();
    });
}

function showLoadingScreen() {
    console.log('Loading Screen Show');
    $('#loadingScreen').show();
    $('#loadingScreen').stop(true,false).animate({opacity:1},750);
}
function hideLoadingScreen() {
    console.log('Loading Screen Hide');
    $('#loadingScreen').stop(true,false).animate({opacity:0},750,function () {
        $('#loadingScreen').hide();
    });
}

function showGame() {
    console.log('Game Show');
    fadeOutMenuMusic();
    $('#canvas').show();
    $('#canvas').stop(true,false).animate({opacity:1},500);
}
function hideGame() {
    console.log('Game Hide');
    $('#canvas').stop(true,false).animate({opacity:0},500,function () {
        $('#canvas').hide();
    });
}

function fadeOutMenuMusic() {
    if (mmgain.gain.value > 0) {
        mmgain.gain.value -= .05;
        setTimeout(function() { fadeOutMenuMusic(); }, 10);
    } else {
        mmgain.gain.value = 0;
        console.log('Fade Out Menu Music');
    }
}

function fadeInMenuMusic() {
    if (mmgain.gain.value < .9) {
        mmgain.gain.value += .01;
        setTimeout(function() { fadeInMenuMusic(); }, 10);
    } else {
        mmgain.gain.value = .9;
        console.log('Fade In Menu Music');
    }
}

function startMainMenuMusic() {
    mmsrc.buffer = mainMenuBuffer;
    mmsrc.loop = true;
    mmsrc.connect(mmgain);
    mmgain.connect(audioContext.destination);
    mmsrc.noteOn(audioContext.currentTime);
}

var ctx = null;
var width = 0;
var height = 0;
var frametime = (new Date)*1 - 1;
var lastframetime = (new Date)*1 - 1;

var finalscore = 0;
var rating = "";
var combo = 0;
var multiplier = 1;
var multiplierMultiplier = 1;

var hits = new Array();

var totalPoints = 0;
var currentPoints = 0;
var maxCombo = 0;

var yplace = 0;

var endOfSong = false;
var endOfGame = false;
var playing = false;

var colors = ['#42c8f4','#2eae66','#f33f3f','#ffffff','#987643'];

var bg = new Image();
bg.src = './assets/img/gamebg.jpg';

function loadGame() {
    var canvasContext = document.getElementById('canvas');
    width = canvasContext.width;
    height = canvasContext.height;
    yplace = height - .5 - (2*hitSize);
    ctx = canvasContext.getContext('2d');
    gameLoop();
}

function gameLoop() {
    frametime = (new Date)*1 - 1;
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#393939';
    ctx.fillRect(0,0,width,height);
    ctx.drawImage(bg,0,0,width,height);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
    ctx.textBaseline = "middle";
    ctx.font = "9pt Arial";
    ctx.fillStyle = "#f1f1f1";
    ctx.fillText("Music Music Revolution",15,height-47);
    ctx.fillText(versionString,15,height-31);
    ctx.fillText("Created By Britt Gresham",15,height-15);
    
    ctx.fillText("Score: " + finalscore,15,24);
    ctx.fillText("Hit Rating: " + rating,15,40);
    
    ctx.textAlign = 'right';
    ctx.fillText("[ESC] to return to Menu",width-15,24);
    
    draw();
    
    if (Math.abs(lastHit - audioContext.currentTime) < .5) {
        ctx.font = "italic 50px Calibri";
        ctx.textBaseline = "top";
        ctx.textAlign = 'center';
        ctx.fillStyle = "#f1f1f1";
        ctx.globalAlpha = 1 - (Math.abs(lastHit - audioContext.currentTime)/.5);
        ctx.fillText(rating,width/2,75);
        if (multiplier * multiplierMultiplier > 1) {
            ctx.fillText("X" + (multiplier * multiplierMultiplier),width/2,125);
        }
        ctx.globalAlpha = 1;
    }
    
    if (combo > maxCombo) {
        maxCombo = combo;
    }
    
    if (combo >= 5) {
        if (combo > 150) {
            multiplier = 32;
        } else if (combo > 100) {
            multiplier = 16;
        } else if (combo > 50) {
            multiplier = 8;
        } else if (combo > 25) {
            multiplier = 4;
        } else if (combo > 10) {
            multiplier = 2;
        } else {
            multiplier = 1;
        }
        ctx.textAlign = 'right';
        ctx.textBaseline = "bottom";
        ctx.font = "italic bold 40px Calibri";
        if (multiplier * multiplierMultiplier > 4) {
            ctx.fillStyle = colors[~~(Math.random()*colors.length)];
        } else {
            ctx.fillStyle = '#f1f1f1';
        }
        if (multiplier > 1)
            ctx.fillText("X" + (multiplier * multiplierMultiplier),width-15,height-107);
        ctx.fillText("COMBO: " + combo,width-15,height-67);
    }
    if (demoModeEnabled == true) {
        ctx.textBaseline = "middle";
        ctx.textAlign = 'center';
        ctx.fillStyle = "#f1f1f1";
        ctx.font = "italic 36px Calibri";
        ctx.globalAlpha = Math.abs(Math.sin(audioContext.currentTime));
        ctx.fillText("DEMO PLAY",width/2,3*height/4);
        ctx.globalAlpha = 1;
    }
    if (endOfSong)
        endSong();
    setTimeout(function() { gameLoop() }, (1000/30) - ((new Date)*1-1-frametime));
}

var waves = new Uint8Array(1024);
var curfft = new Float32Array(1024);

function drawWaveform() {
    wavewidth = width/waves.length;
    postanalyser.getByteTimeDomainData(waves);
    postanalyser.getFloatFrequencyData(curfft);
    ctx.fillStyle = '#ffffff';
    var wavesize = (400/(curfft[0]+400))*10;
    for (var x=0; x<waves.length; x+=1) {
        ctx.fillRect(wavewidth*x-(wavesize/2),(waves[x]-128)+(height/2)-(wavesize/2),wavesize,wavesize);
    }
}

function draw() {
    
    if (playing)
        drawWaveform();
    
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#000000';
    ctx.fillRect(225,0,(width-225)-225+hitSize,height);
    ctx.globalAlpha = 1;
    
    $('#score').html(finalscore);
    ctx.strokeStyle = '#dfe448';
    
    ctx.globalCompositeOperation = 'source-over';
    
    pump = 0;
    
    
    ctx.strokeRect(300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
    ctx.strokeRect((width/2)-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
    ctx.strokeRect(width-300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
    for (var x=0; x<hits.length; x+=1) {
        ctx.fillStyle = (hits[x]['color'] == 'rand') ? colors[~~(Math.random()*colors.length)] : hits[x]['color'];
        switch (hits[x]['type']) {
            default:
            case 1:
                hits[x]['x'] += 0;
            break;
            case 2:
                hits[x]['x'] -= 0;
            break;
            case 0:
                hits[x]['x'] += 0;
            break;
        }
        hits[x]['y'] = ((audioContext.currentTime - hits[x]['hittime'])*((yplace+hitSize/hitSpeed)/delay.delayTime.value)) * hitSpeed;
        if (hits[x]['x'] > width || hits[x]['y'] > height) {
            hits.splice(x,1);
            finalscore -= 50;
            currentPoints -= 50;
            rating = 'AWFUL!';
            combo = 0;
            multiplier = 1;
        } else {
            //if (Math.abs(hits[x]['y']-300) < 5)
                ctx.fillRect(hits[x]['x'],hits[x]['y'],hitSize,hitSize);
        }
    }
}

function spawnHit(type) {
    cur = hits.length;
    totalPoints += 50;
    lastSpawn = audioContext.currentTime;
    switch (type) {
        default:
        case 0:
            hits[cur] = {'x':300.5,'y':0,
                'type':type,'hittime':lastSpawn,
                'color':'#42c8f4'};
        break;
        case 1:
            hits[cur] = {'x':width/2+.5,'y':0,
                'type':type,'hittime':lastSpawn,
                'color':'#2eae66'};
        break;
        case 2:
            hits[cur] = {'x':width-300.5,'y':0,
                'type':type,'hittime':lastSpawn,
                'color':'#f33f3f'};
        break;
    }
    if (~~(Math.random()*16) == 8) {
        hits[cur]['color'] = 'rand';
    }
    if (demoModeEnabled == true) {
        t = {0:37,1:38,2:39}
        if (~~(Math.random()*64) != 32) {
            setTimeout(function(){ keyHit({'which':t[type]}); },950+(Math.random()*50));
        } else {
            setTimeout(function(){ keyHit({'which':t[type]}); },925+(Math.random()*125));
        }
    }
}

var seal = new Image();
seal.src = './assets/img/seal.png';

function endSong() {
    var centerw = width/2;
    ctx.save();
    ctx.translate( centerw, 150 );
    ctx.rotate( audioContext.currentTime/2 );
    ctx.translate( -centerw, -150 );
    ctx.drawImage( seal, centerw-100, 50 );
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = "middle";
    ctx.font = "bold 72px Calibri";
    ctx.fillStyle = '#000';
    if (currentPoints/totalPoints >= .97) {
        grade = 'A+';
    } else if (currentPoints/totalPoints < .97 && currentPoints/totalPoints >= .93) {
        grade = 'A'
    } else if (currentPoints/totalPoints < .93 && currentPoints/totalPoints >= .90) {
        grade = 'A-'
    } else if (currentPoints/totalPoints >= .87) {
        grade = 'B+';
    } else if (currentPoints/totalPoints < .87 && currentPoints/totalPoints >= .83) {
        grade = 'B'
    } else if (currentPoints/totalPoints < .83 && currentPoints/totalPoints >= .80) {
        grade = 'B-'
    } else if (currentPoints/totalPoints >= .77) {
        grade = 'C+';
    } else if (currentPoints/totalPoints < .77 && currentPoints/totalPoints >= .73) {
        grade = 'C'
    } else if (currentPoints/totalPoints < .73 && currentPoints/totalPoints >= .70) {
        grade = 'C-'
    } else if (currentPoints/totalPoints >= .67) {
        grade = 'D+';
    } else if (currentPoints/totalPoints < .67 && currentPoints/totalPoints >= .63) {
        grade = 'D'
    } else if (currentPoints/totalPoints < .63 && currentPoints/totalPoints >= .60) {
        grade = 'D-'
    } else {
        grade = 'F'
    }
    ctx.fillText(grade,centerw,150);
    ctx.font = "bold 30px Calibri";
    
    ctx.fillStyle = "#f1f1f1";
    ctx.fillText('Final Score: ' + finalscore,centerw,300);
    ctx.fillText('MAX COMBO: ' + maxCombo,centerw,350);
}


var keys = {};
var lastHit = 0;
var LEFT        = 37;
var CENTER      = 38;
var RIGHT       = 39;
var RETURN      = 27;
var VOLUMEDOWN  = 189;
var VOLUMEUP    = 187;

$(document).keydown(keyHit);

function keyHit(e) {
    if (e.which == RETURN && endOfGame == false) {
        endOfGame = true;
        endOfSong = true;
        fadeOutGameMusic();
        hideGame();
        showFilePrompt();
    }
    types = {37:0,38:1,39:2}
    typesarr = [37,38,39]
    
    if ($.inArray(e.which,typesarr) != -1) {
        keys[e.which] = true;
    }
    
    
    for (var key in keys) {        
        if (!keys[key]) {
            continue;
        }
        
        keys[key] = true;
        ctx.fillStyle = '#dfe448';
        ctx.strokeStyle = '#ffffff';
        pump = hitSize + 25;
        switch (types[key]) {
            case 0:
                ctx.fillRect(300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                ctx.strokeRect(300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
            break;
            case 1:
                ctx.fillRect(width/2+.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                ctx.strokeRect(width/2+.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
            break;
            case 2:
                ctx.fillRect(width-300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
                ctx.strokeRect(width-300.5-(pump/2),yplace-(pump/2), hitSize+pump, hitSize+pump);
            break;
        }
        
        keys[key] = false;
        closest = {'distance':0,'index':-1,'type':-1};
        for (var x=0; x<hits.length; x+=1) {
            if (closest['distance'] < hits[x]['y']) {
                special = hits[x]['color'] == 'rand' ? true : false;
                closest = {'distance':hits[x]['y'],'index':x,'type':hits[x]['type'],'special':special};
            }
        }
        
        kprototypevar = [];
        for (k in types) {
            kprototypevar.push(k);
        }
        
        pts = 0;
        combo += 1;
        
        if (~~Math.abs(closest['distance'] - yplace) <= 1) {
            rating = 'FLAWLESS!';
            pts = 100;
            if (closest['special']) {
                rating = 'X2 MULTIPLIER BONUS';
                multiplierMultiplier *= 2;
            }
        } else if (~~Math.abs(closest['distance'] - yplace) <= 15) {
            rating = 'PERFECT!';
            pts = 50;
            if (closest['special']) {
                rating = '+500 BONUS!';
                pts += 500;
            }
        } else if (~~Math.abs(closest['distance'] - yplace) <= 35) {
            rating = 'GOOD!';
            pts = 25;
            if (closest['special']) {
                rating = '+100 BONUS!';
                pts += 100;
            }
        } else if (~~Math.abs(closest['distance'] - yplace) <= 60) {
            rating = 'OK!';
            pts = 10;
            combo = 0;
            multiplier = 1;
            multiplierMultiplier = 1;
        } else if (~~Math.abs(closest['distance'] - yplace) <= 75) {
            rating = 'BAD!';
            pts = 0;
            combo = 0;
            multiplier = 1;
            multiplierMultiplier = 1;
        } else if (~~Math.abs(closest['distance'] - yplace) > 75) {
            rating = 'AWFUL!';
            pts = -50;
            combo = 0;
            multiplier = 1;
            multiplierMultiplier = 1;
        }
        
        lastHit = audioContext.currentTime;
        
        if (types[key] == closest['type'] && $.inArray(key,kprototypevar) != -1) {
            finalscore += pts * multiplier * multiplierMultiplier;
            currentPoints += pts;
            hits.splice(closest['index'],1);
        }
    }
}
