var canvasWidth = 320;
var canvasHeight = 480;

var gutter = 16;
var gameWidth = canvasWidth - gutter * 2;
var gameHeight = canvasHeight - gutter - 48;
var gameX = 16;
var gameY = 48;

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

var keyLeft, keyRight, keyUp, keyDown, keySpace, keyEsc = false;
var balls = [];
var blocks = [];
var scoreNumber = [];
var explosions = [];
var spikes = [];
var player;
var particles = [];
var messages = [];

var stdBallSize = 6;
var lvloffset = Math.random() * 5;

var game;
var backgroundSpr = new Image();
var bgSpr = new Image();
var bombSpr = new Image();
var extraBall = new Image();
var x5Spr = new Image();
var spikeSpr = new Image();

var actx,
audioData, srcNode;  // global so we can access them from handlers

bgSpr.src = 'images\\bg0.png';
bgSpr.onload = function(){
    console.log("image_loaded");
}

bombSpr.src = 'images\\bomb.png';
bombSpr.onload = function(){
    console.log("image_loaded");
}

x5Spr.src = 'images\\x5.png';
x5Spr.onload = function(){
    console.log("image_loaded");
}

spikeSpr.src = 'images\\spikeBall.png';
spikeSpr.onload = function(){
    console.log("image_loaded");
}

const track1 = new createSound('audio\\track1.mp3', 0.03, true);

const uiScrollSnd = new createSound('audio\\uiscroll.wav', 0.6)

const uiSelectSnd = new createSound('audio\\uiselect.wav', 0.7);

const bombSnd = new createSound('audio\\bomb.wav', 1);

const breakSnd = new createSound('audio\\break.wav', 0.5);

const breakNormalSnd = new createSound('audio\\breakNormal.wav', 0.7);

const gameoverSnd = new createSound('audio\\gameover.wav', 0.5);

const newLifeSnd = new createSound('audio\\newlife.wav');

const bounceSnd = new createSound('audio\\bounce.wav', 0.4);


function keyDownHandler(event){
    if(event.keyCode == 37 && !keyLeft){//    <-
        keyLeft = true;
    }
    if(event.keyCode == 39 && !keyRight){//   ->
        keyRight = true;
    }
    if(event.keyCode == 38 && !keyUp){
        keyUp = true;
    }
    if(event.keyCode == 40 && !keyDown){
        keyDown = true;
    }
    if(event.keyCode == 32){
        keySpace = true;
    }
    if(event.keyCode == 27 && !keyEsc){//    <-
        keyEsc = true;
    }
}
function keyUpHandler(event){
    if(event.keyCode==37 && keyLeft){//    <-
        keyLeft = false;
    }
    if(event.keyCode == 39 && keyRight){//   ->
        keyRight = false;
    }
    if(event.keyCode == 38 && keyUp){
        keyUp = false;
    }
    if(event.keyCode == 40 && keyDown){
        keyDown = false;
    }
    if(event.keyCode == 32){
        keySpace = false;
    }
    if(event.keyCode == 27 && keyEsc){//    esc
        keyEsc = false;
    }
}

var gameCanvas={
    canvas: document.createElement("canvas"),
    start: function(){
        this.canvas.width=canvasWidth;
        this.canvas.height=canvasHeight;
        this.context=this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas,document.body.childNodes[0]);
        
    }
}

function startGame(){

    gameCanvas.start();
    
    game = new createGame();
}

function createSound(src, volume=1, loop=false){
    this.cooldown = 0;
    if(loop){
        this.src = src;
        this.volume = volume;
        this.play = function(){
            if(Date.now() - this.cooldown < 100){
                return;
            }
            playSongLooped(this.src, this.volume);
            this.cooldown = Date.now();
        }
        
    }else{
        this.snd = document.createElement("audio");
        this.snd.src = src;
        this.volume = volume;
        this.loop = loop;
        this.snd.setAttribute("preload", "auto");
        this.play = function(){
            if(Date.now() - this.cooldown < 100){
                return;
            }
            if(!game.sfx){
                return;
            }
            let newSnd = this.snd.cloneNode();
            newSnd.volume = this.volume;
            newSnd.play();
            this.cooldown = Date.now();
        }
    }
}

function pauseMusic(){
    srcNode.stop();
}

function unpauseMusic(){
    abuffer = audioData;  // create a reference for control buttons
    srcNode = actx.createBufferSource();  // create audio source
    srcNode.buffer = abuffer;             // use decoded buffer
    srcNode.connect(actx.destination);    // create output
    srcNode.loop = true;                  // takes care of perfect looping
    srcNode.start();                      // play...
}

function playSongLooped(src, volume=1){
    actx = new (AudioContext || webkitAudioContext)(),
    audioData, srcNode;  // global so we can access them from handlers


    // Load some audio (CORS need to be allowed or we won't be able to decode the data)
    fetch(src, {mode: "cors"}).then(function(resp) {return resp.arrayBuffer()}).then(decode);

    // Decode the audio file, then start the show
    function decode(buffer) {
        actx.decodeAudioData(buffer, playLoop);
    }

    // Sets up a new source node as needed as stopping will render current invalid
    function playLoop(abuffer) {
        if (!audioData) audioData = abuffer;  // create a reference for control buttons
        srcNode = actx.createBufferSource();  // create audio source
        srcNode.buffer = abuffer;             // use decoded buffer
        srcNode.connect(actx.destination);    // create output
        srcNode.loop = true;                  // takes care of perfect looping
        srcNode.start();                      // play...
    }
}

function createExplosion(x, y, size){
    this.x = x;
    this.y = y;
    this.size = size;
    this.state = 0;
    var pCount = 8;
    for(var i = 0; i < pCount; i += 1){
        var angle = 2 * Math.PI * i / pCount;
        var dX = Math.cos(angle) * size * 0.5;
        var dY = Math.sin(angle) * size * 0.5;
        particles.push(new createParticle(x, y, dX, dY, 10, 5));
    }

    this.update = function(){
        if(this.state == 0){
            var colliding = [];
            for(var i = 0; i < blocks.length; i++){
                var block = blocks[i];
                var delta_x = Math.abs(block.x + block.width / 2 - this.x);
                var delta_y = Math.abs(block.y + block.height / 2 - this.y);
                
                if(Math.sqrt(delta_x ** 2 + delta_y ** 2) <= this.size){
                    colliding.push(i);
                }
            }
            destroyBlocks(colliding, true);
        }
        ++this.state;
    }
    
}

function createScoreNumber(x, y, num, color){
    this.color = color;
    this.state = 0;
    this.x = x;
    this.y = y;
    this.num = num;
    this.alpha = 1;
    this.max_state = 60;
    this.y_delta = 20;
    this.update = function(){
        var ctx = gameCanvas.context;
        ctx.globalAlpha = this.alpha;
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.font = "bold 20px Cute Font";
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.strokeText("+" + String(this.num), this.x, Math.max(gameY + 12, this.y));
        //ctx.fillText("+" + String(this.num), this.x + 1, this.y + 1);
        ctx.fillStyle = color;
        ctx.fillText("+" + String(this.num), this.x, Math.max(gameY + 12, this.y));
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        this.alpha = 1 - this.state / this.max_state;
        this.y -= this.y_delta / this.max_state;
        if(++this.state > this.max_state){
            return false;
        }else{
            return true;
        }
    }
}

function createSpike(x, y, type){
    this.x = x;
    this.y = y;
    this.type = type;
    this.move = function(){
        this.y += 2;
    }
    this.draw = function(){
        var ctx = gameCanvas.context;
        if(this.y < gameY + gameHeight){
            var c = Math.min(30, gameY + gameHeight - this.y);
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'red';
            ctx.drawImage(spikeSpr, 0, 0, 30, c, this.x, this.y, 30, c);
            ctx.shadowBlur = 0;
        }
        
    }
}

function createCube(x, y, z, r, xvel, yvel, zvel, rvel, size){
    this.x = x;
    this.y = y;
    this.z = z;
    this.r = r;
    this.xvel = xvel;
    this.yvel = yvel;
    this.zvel = zvel;
    this.rvel = rvel;
    this.size = size;
    this.p = [];

    this.move = function(){
        this.r += this.rvel;
        if(this.r > Math.PI * 2){
            this.r -= Math.PI * 2;
        }
        this.x += this.xvel;
        this.y += this.yvel;
        this.z += this.zvel;
        this.p = [];

        for(var i = 0; i < 4; i++){
            this.p.push(
                {
                    x:this.x + Math.cos(this.r + i * Math.PI * 0.5) * this.size / 2,
                    y:this.y - this.size / 2,
                    z:this.z + Math.sin(this.r + i * Math.PI * 0.5) * this.size / 2
                }
            )
        }

        for(var i = 0; i < 4; i++){
            this.p.push(
                {
                    x:this.x + Math.cos(this.r + i * Math.PI * 0.5) * this.size / 2,
                    y:this.y + this.size / 2,
                    z:this.z + Math.sin(this.r + i * Math.PI * 0.5) * this.size / 2
                }
            )
        }
    }

    this.draw = function(fovx, fovy, viewx, viewy){
        var point = this.p[0];
        var ctx = gameCanvas.context;

        
        var a = 1 - Math.abs((Math.min(600, Math.max(0, this.z - 200))) - 300) / 300;
        p = 1 - this.z / 800;
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(0 0 0 / ${100 * a}%)`;
        ctx.fillStyle = `rgba(${255 - 255 * p} ${255 * p} 0 / ${100 * a}%)`;
        

        //  Top
        var minzpoint = 0;
        for(var i = 1; i < 4; i++){
            point = this.p[i];
            if(point.z < this.p[minzpoint].z){
                minzpoint = i;
            }
        }
        if(Math.cos(Math.atan2(this.p[minzpoint].z, this.p[minzpoint].y - viewy / 2)) > Math.cos(Math.atan2(this.p[(minzpoint + 2) % 4].z, this.p[(minzpoint + 2) % 4].y - viewy / 2))){
            point = this.p[0];
            ctx.beginPath();

            ctx.moveTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);

            for(var i = 1; i < 4; i++){
                point = this.p[i];
                ctx.lineTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                    Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);
            }

            point = this.p[0];
            ctx.lineTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);

            ctx.stroke();
            ctx.closePath();
            ctx.fill();
        }

        //Bottom
        var minzpoint = 0;
        for(var i = 1; i < 4; i++){
            point = this.p[i + 4];
            if(point.z < this.p[minzpoint + 4].z){
                minzpoint = i;
            }
        }
        if(Math.cos(Math.atan2(this.p[minzpoint + 4].z, this.p[minzpoint + 4].y - viewy / 2)) < Math.cos(Math.atan2(this.p[(minzpoint + 2) % 4 + 4].z, this.p[(minzpoint + 2) % 4 + 4].y - viewy / 2))){
            point = this.p[4];
            ctx.beginPath();

            ctx.moveTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);

            for(var i = 1; i < 4; i++){
                point = this.p[i + 4];
                ctx.lineTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2,  
                    Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);
            }

            point = this.p[4];
            ctx.lineTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2,  
                Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);

            ctx.stroke();
            ctx.closePath();
            ctx.fill();
        }

        for(var i = 0; i < 4; i++){
            if(Math.cos(Math.atan2(this.p[i].z, this.p[i].x - viewx / 2)) < Math.cos(Math.atan2(this.p[(i + 1) % 4].z, this.p[(i + 1) % 4].x - viewx / 2))){
                point = this.p[i];
                ctx.beginPath();
    
                ctx.moveTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                    Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);
    
                point = this.p[(i + 1) % 4];
                ctx.lineTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                    Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);
                
                point = this.p[(i + 1) % 4 + 4];
                ctx.lineTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                    Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);
    
                point = this.p[i + 4];
                ctx.lineTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                    Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);
    
                point = this.p[i];
                ctx.lineTo(Math.cos(Math.atan2(point.z, point.x - viewx / 2)) * Math.PI / fovx * viewx + viewx / 2, 
                    Math.cos(Math.atan2(point.z, point.y - viewy / 2)) * Math.PI / fovy * viewy + viewy / 2);
    
                ctx.stroke();
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.beginPath();
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur    = 0;
    }
}

function createBackground(type){
    if(type == 1){
        this.fovx = Math.PI / 2;
        this.fovy = this.fovx * canvasHeight / canvasWidth;
        this.viewx = canvasWidth;
        this.viewy = canvasHeight;
        this.cubes = [];
        this.state = 0;
        this.color = 0;

        var count = 5;
        for(var i = 0; i < count; i++){
            this.cubes.push(new createCube(Math.random() * gameWidth * 0.6 + gameWidth * 0.2, Math.random() * gameHeight * 0.6 + gameHeight * 0.2, 800 * i / count, 0, 0, 0, -2, Math.random() * Math.PI * 2 * 0.008 - 0.004, 40));
        }

        this.move = function(){
            for(var i = 0; i < this.cubes.length; i++){
                var cube = this.cubes[i];
                cube.move();
                if(cube.z < 50){
                    this.cubes.splice(i, 1);
                    i--;
                    this.cubes.push(new createCube(Math.random() * gameWidth * 0.6 + gameWidth * 0.2, Math.random() * gameHeight * 0.6 + gameHeight * 0.2, 800, 0, 0, 0, -2, Math.random() * Math.PI * 2 * 0.008 - 0.004, 40));
                }
            }
            
            this.color = (this.color + 0.5) % 360;
        }

        this.draw = function(){
            const grd = gameCanvas.context.createRadialGradient(gameX + gameWidth / 2, gameY + gameHeight / 2, 0, gameX + gameWidth / 2, gameY + gameHeight / 2, gameWidth);
        
            grd.addColorStop(1, "black");
            grd.addColorStop(0, `hsl(${this.color} 50 20)`);
            gameCanvas.context.fillStyle = grd;

            gameCanvas.context.fillRect(0, 0, canvasWidth, canvasHeight);

            for(var i = this.cubes.length - 1; i >= 0; i--){
                var cube = this.cubes[i];
                cube.draw(this.fovx, this.fovy, this.viewx, this.viewy);
            }
        }
    }else if(type == 0){
        this.zoom = 0;
        this.r = 0;
        this.size = 120;
        this.color = 0;
        this.draw = function(){
            var ctx = gameCanvas.context;

            ctx.shadowColor = 'black';
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 6;
            
            var X, Y;
            for(var i = Math.ceil(canvasHeight / this.size); i >= 0; i--){
                ctx.beginPath();
                X = canvasWidth / 2 + Math.cos(this.r) * (this.size * i + this.zoom);
                Y = canvasHeight / 2 + Math.sin(this.r) * (this.size * i + this.zoom);

                ctx.moveTo(X, Y);

                for(var j = 0; j <= 6; j++){
                    X = canvasWidth / 2 + Math.cos(this.r + Math.PI * 2 * j / 6) * (this.size * i + this.zoom);
                    Y = canvasHeight / 2 + Math.sin(this.r + Math.PI * 2 * j / 6) * (this.size * i + this.zoom);

                    ctx.lineTo(X, Y);
                }

                var c = (((this.size * i + this.zoom) / 1000)) * 255 * 1.5;
                
                ctx.fillStyle = `rgb(${c * (1 - (Math.abs(Math.abs(this.color - 0.5) * 2 - 0.1)))} ${c * (1 - (Math.abs(Math.abs(this.color - 0.5) * 2 - 0.66)))} ${c * (1 - (Math.abs(Math.abs(this.color - 0.5) * 2 - 1)))})`;
                ctx.fill();
                ctx.closePath();
                
            }
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
        }
        this.move = function(){
            this.r = (this.r + (Math.PI * 2 / 480)) % (Math.PI * 2);
            this.zoom = (this.zoom + 1.1) % this.size;
            this.color = (this.color + 0.001) % 1;
        }
    }
}

function createGame(){
    this.state = 0;
    this.score = 0;
    this.level = 0;
    this.substate = 0;
    this.selected = 0;
    this.startGame = true;
    this.hiscore = localStorage.getItem('blockrush-hiscore');
    this.lives = 1;
    this.nextScore = 100;
    this.bg = new createBackground(0);
    this.theme = 0;
    this.music = 0;
    this.sfx = true;
    this.update = function(){
        switch(this.state){
            case 0:
                this.drawTitle();
                break;

            case 1://Gameplay
                if(blocks.length == 0){
                    this.level++;
                    messages.push(new createMessage("Level " + String(this.level), "green", 120));
                    this.newLevel();
                }
                this.updateGame();
                break;
            
            case 2://Game over
                this.updateGameOver();
                break;

            case 3://Paused
                this.updatePaused();
                break;
                
        }
    }
    this.drawOutline = function(){
        
        var ctx = gameCanvas.context;
        var thickness = 1;
        ctx.lineWidth = thickness + 1;
        var whiteness = 200;
        ctx.strokeStyle = `rgba(${whiteness} ${whiteness} ${whiteness}/ 70%)`;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur    = 3;
        ctx.shadowColor   = 'rgba(255 255 255 / 40%)';

        ctx.beginPath();

        ctx.moveTo(thickness, thickness);
        ctx.lineTo(canvasWidth - thickness, thickness);
        ctx.lineTo(canvasWidth - thickness, canvasHeight - thickness);
        ctx.lineTo(thickness, canvasHeight - thickness);
        ctx.lineTo(thickness, thickness);

        ctx.stroke();

        ctx.moveTo(-thickness + gutter, -thickness + gutter);
        ctx.lineTo(canvasWidth + thickness - gutter, -thickness + gutter);
        ctx.lineTo(canvasWidth + thickness - gutter, canvasHeight + thickness - gutter);
        ctx.lineTo(-thickness + gutter, canvasHeight + thickness - gutter);
        ctx.lineTo(-thickness + gutter, -thickness + gutter);

        ctx.stroke();

        ctx.moveTo(-thickness + gutter, thickness + gutter  + 32);
        ctx.lineTo(canvasWidth - thickness - gutter + 1, thickness + gutter + 32);

        ctx.stroke();
        ctx.closePath();

        ctx.shadowBlur  = 0;
        ctx.lineWidth   = 0;
        
    }
    this.drawBg = function(variation, move = true){
        
        if(variation == 0){
            if(move){
                this.bg.move();
            }
            
            this.bg.draw();
        }else if(variation == 1){

            if(move){
                this.bg.move();
            }
            
            this.bg.draw();
        }
    }
    this.drawTitle = function(){
        this.drawBg(0);
        var ctx = gameCanvas.context;

        ctx.shadowColor = 'black';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 12;

        ctx.font = "80px Cute Font";
        ctx.save();
        ctx.scale(1, 1.2);
        ctx.textAlign = "center";
        ctx.fillStyle = "grey";
        ctx.fillText("Block Rush", canvasWidth / 2 + 2, canvasHeight / 3 + 2);
        ctx.fillStyle = "white";
        ctx.fillText("Block Rush", canvasWidth / 2, canvasHeight / 3);
        ctx.restore();
         
        ctx.textAlign = "center";
        ctx.font = "32px Cute Font";

        ctx.fillStyle = "grey";
        ctx.fillText("START", canvasWidth / 2 + 1, canvasHeight / 2 + 1);
        ctx.fillStyle = "white";
        ctx.fillText("START", canvasWidth / 2, canvasHeight / 2);

        ctx.font = "24px Cute Font";

        ctx.fillStyle = "grey";
        ctx.fillText(`THEME: TYPE ${this.theme + 1}`, canvasWidth / 2 + 1, canvasHeight / 2 + 32 + 1);
        ctx.fillStyle = "white";
        ctx.fillText(`THEME: TYPE ${this.theme + 1}`, canvasWidth / 2, canvasHeight / 2 + 32);

        if(this.music == -1){
            ctx.fillStyle = "grey";
            ctx.fillText(`MUSIC: OFF`, canvasWidth / 2 + 1, canvasHeight / 2 + 64 + 1);
            ctx.fillStyle = "white";
            ctx.fillText(`MUSIC: OFF`, canvasWidth / 2, canvasHeight / 2 + 64);
        }else{
            ctx.fillStyle = "grey";
            ctx.fillText(`MUSIC: ON`, canvasWidth / 2 + 1, canvasHeight / 2 + 64 + 1);
            ctx.fillStyle = "white";
            ctx.fillText(`MUSIC: ON`, canvasWidth / 2, canvasHeight / 2 + 64);
        }
        

        var s;
        if(this.sfx){
            s = 'ON';
        }else{
            s = 'OFF';
        }
        ctx.fillStyle = "grey";
        ctx.fillText(`SFX: ${s}`, canvasWidth / 2 + 1, canvasHeight / 2 + 96 + 1);
        ctx.fillStyle = "white";
        ctx.fillText(`SFX: ${s}`, canvasWidth / 2, canvasHeight / 2 + 96);
        

        if(this.selected == 0){
            ctx.strokeStyle='white';
            ctx.strokeRect(canvasWidth / 2 - 34, canvasHeight / 2 - 18, 68, 22);
            
            if(keyDown){
                this.selected = 1;
                keyDown = false;
                uiScrollSnd.play();
            }else if(keySpace){//Start a new game
                this.state = 1;
                this.level = 1;
                this.lives = 1;
                this.nextScore = 100;
                messages.push(new createMessage("Level " + String(this.level), "green", 120));
                this.newLevel();

                switch(this.music){
                    case 0:
                        track1.play();
                        break;
                    case 1:
                        break;
                    default:
                        uiSelectSnd.play();
                        break;
                }
            }
        }

        if(this.selected == 1){
            ctx.strokeStyle='white';
            ctx.strokeRect(canvasWidth / 2 - 60, canvasHeight / 2 + 18, 120, 18);

            if(keyUp){
                this.selected = 0;
                keyUp = false;
                uiScrollSnd.play();
            }else if(keyDown){
                this.selected = 2;
                keyDown = false;
                uiScrollSnd.play();
            }else if(keySpace){//Theme toggle
                if(++this.theme > 1){
                    this.theme = 0;
                }
                this.bg = new createBackground(this.theme);
                keySpace = false;
                uiSelectSnd.play();
            }
        }

        if(this.selected == 2){
            ctx.strokeStyle='white';
            if(this.music == -1){
                ctx.strokeRect(canvasWidth / 2 - 48, canvasHeight / 2 + 18 + 32, 96, 18);
            }else{
                ctx.strokeRect(canvasWidth / 2 - 42, canvasHeight / 2 + 18 + 32, 84, 18);
            }
            

            if(keyUp){
                this.selected = 1;
                keyUp = false;
                uiScrollSnd.play();
            }else if(keyDown){
                this.selected = 3;
                keyDown = false;
                uiScrollSnd.play();
            }else if(keySpace){//Music toggle
                if(++this.music > 0){
                    this.music = -1;
                }
                keySpace = false;
                uiSelectSnd.play();
            }
        }

        if(this.selected == 3){
            ctx.strokeStyle='white';
            if(this.sfx){
                ctx.strokeRect(canvasWidth / 2 - 35, canvasHeight / 2 + 82, 70, 18);
            }else{
                ctx.strokeRect(canvasWidth / 2 - 37, canvasHeight / 2 + 82, 74, 18);
            }
            

            if(keyUp){
                this.selected = 2;
                keyUp = false;
                uiScrollSnd.play();
            }else if(keySpace){//SFX toggle
                this.sfx = !this.sfx;
                keySpace = false;
                uiSelectSnd.play();
            }
        }
        
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;
    }
    this.newLevel = function(){
        //this.level += 1;
        if(player == undefined){
            player = new createPlayer(canvasWidth / 2 - 20, 35, 12);
        }
        var h = generateLevel(this.level, Math.random());
        this.substate = h;
        for(var i = 0; i < blocks.length; i++){
            blocks[i].y -= h;
        }
    }
    this.updateGame = function(){
        
        this.drawBg(0);
        this.drawGui();

        player.move();
        player.draw();

        for(var i = 0; i < balls.length; i++){
            destroyBlocks(balls[i].move());
            balls[i].draw();
            if(balls[i].y > gameY + gameHeight){
                balls.splice(i, 1);
                i -= 1;
                gameoverSnd.play();
            }
        }

        for(var i = 0; i < balls.length; i++){
            if(Math.abs(balls[i].y_vel) <= 0.001){
                balls[i].y_vel = 1;
            }else if(Math.abs(balls[i].x_vel) > Math.abs(balls[i].y_vel) * 4){
                balls[i].x_vel *= 0.98;
                balls[i].y_vel *= 1.02;
            }
        }
    
        for(var i = 0; i < blocks.length; i++){
            blocks[i].draw();
        }

        for(var i = 0; i < explosions.length; i++){
            explosions[i].update();
        }

        var toDestroy = [];
        for(var i = 0; i < particles.length; i++){
            if(particles[i].update() == 1){
                toDestroy.push(i);
                continue;
            }
            particles[i].draw();
        }

        for(var i = toDestroy.length - 1; i >= 0; i--){
            particles.splice(i, 1);
        }

        for(var i = 0; i < spikes.length; i++){
            spikes[i].move();
            spikes[i].draw();
            if(spikes[i].y > gameY + gameHeight){
                spikes.splice(i, 1);
                --i;
            }
        }

        for(var i = 0; i < scoreNumber.length; i++){
            if(!scoreNumber[i].update()){
                scoreNumber.splice(i, 1);
                --i;
            }
        }

        if(messages.length > 0){
            if(!messages[0].update()){
                messages.splice(0, 1);
            }
        }


        if(this.substate > 0){
            this.substate -= 1.5;
            for(var i = 0; i < blocks.length; i++){
                blocks[i].y += 1.5;
            }
            
        }else if(this.substate <= 0){
            this.substate = -1;
        }

        if(this.lives > 0){
            if(balls.length == 0){
                player.drawBall();
                if(this.substate <= 0 && keySpace){
                    this.lives--;
                    var spd = 4;
                    var angle = Math.random() * Math.PI / 4 + Math.PI * 3 / 8;
                    var x_vel = Math.cos(angle) * spd;
                    var y_vel = Math.sin(angle) * spd;
                    balls = [new createBall(player.x + player.width / 2, player.y - 6, x_vel, y_vel, stdBallSize)];
                }
                for(var i = 0; i < spikes.length; i++){
                    var spike = spikes[i];
                    if(Math.abs(player.x + player.width / 2 - (spike.x + 15)) <= player.width / 2 + 11 && spike.y > player.y - 22 && spike.y < player.y + player.height){
                        this.lives--;
                        balls = [];
                        spikes.splice(i--, 1);
                    }
                }
            }
        }else{
            if(balls.length == 0){//Game Over
                this.state = 2;
                this.substate = 0;
                this.selected = 0;
                
                if(this.score > this.hiscore){
                    this.hiscore = this.score;
                    localStorage.setItem('blockrush-hiscore', this.hiscore);
                    
                }
                pauseMusic();
            }
            for(var i = 0; i < spikes.length; i++){
                var spike = spikes[i];
                if(Math.abs(player.x + player.width / 2 - (spike.x + 15)) <= player.width / 2 + 11 && spike.y > player.y - 22 && spike.y < player.y + player.height){
                    balls = [];
                    spikes.splice(i--, 1);
                    this.state = 2;
                    this.substate = 0;
                    this.selected = 0;
                    pauseMusic();
                }
            }
            
        }

        if(keyEsc){//Pause
            this.state = 3;
            keyEsc = false;
            pauseMusic();
        }

        this.drawOutline();
    }
    this.drawGui = function(){
        var hiscore = this.score;
        if(this.hiscore != null && this.hiscore > this.score){
            hiscore = this.hiscore;
        }

        var ctx = gameCanvas.context;
        ctx.beginPath();
        ctx.fillStyle='black';
        ctx.rect(gameX, 16, gameWidth, gameY - 16);
        ctx.fill();
        ctx.font = "24px Cute Font";
        ctx.textAlign = "left";
        ctx.fillStyle = "grey";
        ctx.fillText("HISCORE: " + String(hiscore), gameX + 3 + 110, 30 + 1);
        ctx.fillText("SCORE: " + String(this.score), gameX + 3, 30 + 1);
        ctx.fillText("LEVEL: " + String(this.level), gameX + 3, 44 + 1);
        ctx.fillStyle = "white";
        ctx.fillText("HISCORE: " + String(hiscore), gameX + 2 + 110, 30);
        ctx.fillText("SCORE: " + String(this.score), gameX + 2, 30);
        ctx.fillText("LEVEL: " + String(this.level), gameX + 2, 44);

        
        this.drawLives();
    }
    this.updateGameOver = function(){

        this.drawBg(0, false);
        this.drawGui();

        player.draw();
    
        for(var i = 0; i < blocks.length; i++){
            blocks[i].draw();
        }

        var ctx = gameCanvas.context;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.fillStyle='black';
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 8;

        ctx.font = "64px Cute Font";
        ctx.textAlign = "center";
        ctx.fillStyle = "grey";
        ctx.fillText("GAME OVER", canvasWidth / 2 + 2, canvasHeight / 3 + 2);
        ctx.fillStyle = "white";
        ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 3);

        ctx.font = "32px Cute Font";

        ctx.fillStyle = "grey";
        ctx.fillText("RETRY", canvasWidth / 2 + 1, canvasHeight / 2 + 1);
        ctx.fillStyle = "white";
        ctx.fillText("RETRY", canvasWidth / 2, canvasHeight / 2);

        ctx.fillStyle = "grey";
        ctx.fillText("QUIT", canvasWidth / 2 + 1, canvasHeight / 2 + 32 + 1);
        ctx.fillStyle = "white";
        ctx.fillText("QUIT", canvasWidth / 2, canvasHeight / 2 + 32);

        if(this.selected == 0){
            ctx.strokeStyle='white';
            ctx.strokeRect(canvasWidth / 2 - 34, canvasHeight / 2 - 18, 68, 22);
            
            if(keyDown){
                this.selected = 1;
                uiScrollSnd.play();
            }else if(keySpace){//Retry
                player = new createPlayer(canvasWidth / 2 - 20, 40, 12);
                this.startGame = true;
                this.level = 1;
                generateLevel(this.level - 1, Math.random());
                this.substate = 120;
                this.state = 1;
                this.score = 0;
                this.lives = 1;
                for(var i = 0; i < blocks.length; i++){
                    blocks[i].y -= 120;
                }
                uiSelectSnd.play();
                unpauseMusic();
            }
        }

        if(this.selected == 1){
            ctx.strokeStyle='white';
            ctx.strokeRect(canvasWidth / 2 - 24, canvasHeight / 2 + 14, 48, 22);

            if(keyUp){
                this.selected = 0;
                uiScrollSnd.play();
            }else if(keySpace){//Quit
                balls = [];
                blocks = [];
                player = undefined;
                this.state = 0;
                this.selected = 0;
                keySpace = false;
                this.score = 0;
                this.level = 1;
                uiSelectSnd.play();
            }
        }
        ctx.shadowBlur = 0;
        this.drawOutline();
    }
    this.updatePaused = function(){

        this.drawBg(0, false);
        this.drawGui();

        player.draw();
    
        for(var i = 0; i < blocks.length; i++){
            blocks[i].draw();
        }

        var ctx = gameCanvas.context;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.fillStyle='black';
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.shadowColor = 'black';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 6;

        ctx.font = "64px Cute Font";
        ctx.textAlign = "center";
        ctx.fillStyle = "grey";
        ctx.fillText("PAUSED", canvasWidth / 2 + 2, canvasHeight / 3 + 2);
        ctx.fillStyle = "white";
        ctx.fillText("PAUSED", canvasWidth / 2, canvasHeight / 3);
        ctx.shadowBlur = 0;

        if(keyEsc){//unpause
            this.state = 1;
            keyEsc = false;
            unpauseMusic();
        }
        this.drawOutline();
    }
    this.drawLives = function(){
        var ctx = gameCanvas.context;
        var outline = 2;

        ctx.beginPath();
        ctx.fillStyle = 'grey';
        ctx.arc(gameX + 250, 25, stdBallSize, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(gameX + 250, 25, stdBallSize - outline, 0, Math.PI * 2, false);
        ctx.fill();

        ctx.fillStyle = "grey";
        ctx.fillText("x" + String(this.lives), gameX + 3 + 258, 30 + 1);
        ctx.fillStyle = "white";
        ctx.fillText("x" + String(this.lives), gameX + 2 + 258, 30);
    }
}

function createBlock(x, y, width, height, hits, type, color){
    ctx = gameCanvas.context; //Set Context
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hits = hits;
    this.type = type;
    this.color = color;
    
    this.draw = function(){
        var cuttoff = Math.max(0, gameY - this.y + 1);

        if(cuttoff >= this.height){
            return;
        }
        var outline = 1;

        ctx = gameCanvas.context; //Set Context
        let grd = ctx.createLinearGradient(this.x + this.width / 2, this.y, this.x + this.width / 2, this.y + this.height);
        if(this.color == 0){
            grd.addColorStop(0, "#FF8282FF");
            grd.addColorStop(1, "red");
            ctx.shadowColor = "red";
        }else if(this.color == 1){
            grd.addColorStop(0, "#faf678");
            grd.addColorStop(1, "#b0aa00");
            ctx.shadowColor = "#b0aa00";
        }else if(this.color == 2){
            grd.addColorStop(0, "#8FFF87FF");
            grd.addColorStop(1, "green");
            ctx.shadowColor = "green";
        }else if(this.color == 3){
            grd.addColorStop(0, "#BFF8FFFF");
            grd.addColorStop(1, "#21CCC1FF");
            ctx.shadowColor = "#21CCC1FF";
        }else if(this.color == 4){
            grd.addColorStop(0, "#8CB2FFFF");
            grd.addColorStop(1, "blue");
            ctx.shadowColor = "blue";
        }else if(this.color == 5){
            grd.addColorStop(0, "#B982FFFF");
            grd.addColorStop(1, "purple");
            ctx.shadowColor = "purple";
        }else if(this.color == 6){
            grd.addColorStop(0, "#DD7DFFFF");
            grd.addColorStop(1, "magenta");
            ctx.shadowColor = "magenta";
        }else if(this.color == 7){
            grd.addColorStop(0, "#FF7AF1FF");
            grd.addColorStop(1, "pink");
            ctx.shadowColor = "pink";
        }else if(this.color == 8){
            grd.addColorStop(0, "#404040");
            grd.addColorStop(1, "#1f1f1f");
            ctx.shadowColor = "#1f1f1f";
        }
        
        ctx.beginPath();
        ctx.fillStyle='black';
        ctx.rect(this.x, this.y + cuttoff, this.width, this.height - cuttoff);
        ctx.fill();

        ctx.beginPath();

        // Create gradient
        
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur    = 6;
        
        ctx.fillStyle = grd;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.rect(this.x + outline, this.y + outline  + cuttoff, this.width - outline * 2, this.height - cuttoff - outline * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'white';

        if(type == 3){
            ctx.drawImage(bombSpr, 1, cuttoff + 1, this.width - 2, this.height - 2, this.x + 1, this.y + 1 + cuttoff, this.width - 2, this.height - 2);
        }else if(type == 2){
            ctx.drawImage(x5Spr, 1, cuttoff + 1, this.width - 2, this.height - 2, this.x + 1, this.y + 1 + cuttoff, this.width - 2, this.height - 2);
        }else if(type == 4){
            ctx.drawImage(spikeSpr, 1, cuttoff + 1, this.width - 2, this.height - 2, this.x + 1, this.y + 1 + cuttoff, this.width - 2, this.height - 2);
        }
        
    }
}

function createBall(x_start, y_start, x_vel, y_vel, radius){
    this.x = x_start;
    this.y = y_start;
    this.afterimageX = [5];
    this.afterimageY = [5];
    this.x_vel = x_vel;
    this.y_vel = y_vel;
    this.radius = radius;
    this.cooldown = 0;
    this.acceleration = 0.00005;

    for(var i = 0; i < 5; i += 1){
        this.afterimageX[i] = this.x;
        this.afterimageY[i] = this.y;
    }

    this.draw = function(){
        //  Afterimages
        
        for(var i = 1; i < 5; i += 1){
            this.afterimageX[i - 1] = this.afterimageX[i];
            this.afterimageY[i - 1] = this.afterimageY[i];
        }
        this.afterimageX[4] = this.x;
        this.afterimageY[4] = this.y;

        if(this.y >= gameY + gameHeight - this.radius){
            return;
        }
        var outline = 2;
        ctx=gameCanvas.context; //Set Context

        for(var i = 0; i < 5; i += 1){
            ctx.globalAlpha = i * 0.05;
            ctx.beginPath();
            ctx.fillStyle='grey';
            ctx.arc(this.afterimageX[i], this.afterimageY[i], this.radius, 0, Math.PI * 2, false);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx=gameCanvas.context; //Set Context
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur    = 12;
        ctx.shadowColor   = 'rgba(255 255 255 / 25%)';

        const gradient = ctx.createRadialGradient(110, 90, 30, 100, 100, 70);

        // Add three color stops
        gradient.addColorStop(0, "white");
        gradient.addColorStop(0.9, "grey");
        ctx.beginPath();
        ctx.fillStyle='black';
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle='white';
        ctx.arc(this.x, this.y, this.radius - outline, 0, Math.PI * 2, false);
        ctx.fill();
        ctx=gameCanvas.context; //Set Context
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'rgba(255 255 255 / 50%)';
    }

    this.move = function(){ //Returns a list of block indexes
        var vectorM, vectorA;

        while(Math.sqrt(this.x_vel ** 2 + this.y_vel ** 2) < 4){
            var ratio = Math.max(0.1, ratio = this.x_vel / this.y_vel);
            this.x_vel += 0.1 * ratio * Math.sign(this.x_vel);
            this.y_vel += 0.1 / ratio * Math.sign(this.y_vel);
        }

        while(Math.sqrt(this.x_vel ** 2 + this.y_vel ** 2) > 12){
            var ratio = Math.max(0.1, ratio = this.x_vel / this.y_vel);
            this.x_vel -= 0.1 * ratio * Math.sign(this.x_vel);
            this.y_vel -= 0.1 / ratio * Math.sign(this.y_vel);
        }

        vectorM = Math.sqrt(this.x_vel ** 2 + this.y_vel ** 2) + this.acceleration;
        vectorA = Math.atan2(this.y_vel, this.x_vel);

        this.x_vel = Math.cos(vectorA) * vectorM;
        this.y_vel = Math.sin(vectorA) * vectorM;

        while(vectorM > 0){
            //  Translate
            this.x += Math.cos(vectorA);
            this.y += Math.sin(vectorA);
            vectorM -= 1;
            
            //  Get list of overlapping blocks
            var colliding = [];
            for(var i = 0; i < blocks.length; i++){
                var block = blocks[i];
                if(this.y < block.y + block.height + this.radius && this.y > block.y - this.radius && this.x > block.x - this.radius && this.x < block.x + block.width + this.radius){
                    colliding = colliding.concat([i]);
                }
            }

            //  Calculate bounce off blocks
            if(colliding.length == 1){
                var topdiff = Math.abs(this.y - blocks[colliding[0]].y);
                var bottomdiff = Math.abs(this.y - (blocks[colliding[0]].y + blocks[colliding[0]].height));
                var leftdiff = Math.abs(this.x - blocks[colliding[0]].x);
                var rightdiff = Math.abs(this.x - (blocks[colliding[0]].x + blocks[colliding[0]].width));
                if(topdiff < this.radius && (leftdiff >= this.radius || leftdiff < topdiff) && (rightdiff >= this.radius || rightdiff < topdiff)){//  Top collision
                    this.y -= Math.sin(vectorA);
                    this.y_vel = -Math.abs(this.y_vel);
                }
                if(bottomdiff < this.radius && (leftdiff >= this.radius || leftdiff < topdiff) && (rightdiff >= this.radius || rightdiff < topdiff)){//  Bottom collision
                    this.y -= Math.sin(vectorA);
                    this.y_vel = Math.abs(this.y_vel);
                }
                if(leftdiff < this.radius && (topdiff >= this.radius || topdiff < leftdiff) && (bottomdiff >= this.radius || bottomdiff < leftdiff)){//   Left collision
                    this.x -= Math.cos(vectorA);
                    this.x_vel = -Math.abs(this.x_vel);
                }
                if(rightdiff < this.radius && (topdiff >= this.radius || topdiff < rightdiff) && (bottomdiff >= this.radius || bottomdiff < rightdiff)){//   Right collision
                    this.x -= Math.cos(vectorA);
                    this.x_vel = Math.abs(this.x_vel);
                }
            }else if(colliding.length == 2){
                if(blocks[colliding[0]].x == blocks[colliding[1]].x){
                    this.x -= Math.cos(vectorA);
                    this.x_vel *= -1;
                }else if(blocks[colliding[0]].y == blocks[colliding[1]].y){
                    this.y -= Math.sin(vectorA);
                    this.y_vel *= -1;
                }else{
                    this.x -= Math.cos(vectorA);
                    this.y -= Math.sin(vectorA);
                    this.x_vel *= -1;
                    this.y_vel *= -1;
                }
            }else if(colliding.length == 3){
                this.x -= Math.cos(vectorA);
                this.y -= Math.sin(vectorA);
                this.x_vel *= -1;
                this.y_vel *= -1;
            }

            if(colliding.length > 0){
                break;
            }

        }

        //  Colliding game border
        if(this.x < gameX + this.radius){
            this.x = gameX + this.radius;
            this.x_vel = Math.abs(this.x_vel);
            bounceSnd.play();
        }
        if(this.x > gameX + gameWidth - this.radius){
            this.x = gameX + gameWidth - this.radius;
            this.x_vel = -Math.abs(this.x_vel);
            bounceSnd.play();
        }
        if(this.y < gameY + this.radius){
            this.y = gameY + this.radius;
            this.y_vel = Math.abs(this.y_vel);
            bounceSnd.play();
        }

        //  Colliding player
        if(this.y > player.y - this.radius && this.y < player.y + player.height){
            if(this.x > player.x - this.radius && this.x < player.x + player.width + this.radius){
                this.y_vel = -Math.abs(this.y_vel);
                var modifier = (this.x - (player.x + player.width / 2)) / player.width / 2 * 5;
                vectorA = Math.atan2(this.y_vel, this.x_vel);
                vectorA += Math.PI / 8 * modifier;
                vectorM = Math.sqrt(this.x_vel ** 2 + this.y_vel ** 2);
                this.x_vel = Math.cos(vectorA) * vectorM;
                this.y_vel = Math.sin(vectorA) * vectorM;
                
                this.y = player.y - this.radius;
                bounceSnd.play();
            }
        }
        return colliding;
    }

}

function createBlockParticle(x, y, x_vel, y_vel, color, size){
    this.x = x;
    this.y = y;
    this.x_vel = x_vel;
    this.y_vel = y_vel;
    this.color = color;
    this.size = size;
    this.health = 20;
    this.startingHealth = this.health;

    this.draw = function(){
        if(this.y < gameY){
            return;
        }
        if(this.y > gameY + gameHeight - this.size){
            return;
        }
        var ctx = gameCanvas.context;
        
        const grd = ctx.createLinearGradient(this.x - this.size, this.y - this.size, this.x + this.size, this.y + this.size);
        if(this.color == 0){
            grd.addColorStop(0, "#FF8282FF");
            grd.addColorStop(1, "red");
            ctx.shadowColor = "red";
        }else if(this.color == 1){
            grd.addColorStop(0, "#faf678");
            grd.addColorStop(1, "#b0aa00");
            ctx.shadowColor = "#b0aa00";
        }else if(this.color == 2){
            grd.addColorStop(0, "#8FFF87FF");
            grd.addColorStop(1, "green");
            ctx.shadowColor = "green";
        }else if(this.color == 3){
            grd.addColorStop(0, "#BFF8FFFF");
            grd.addColorStop(1, "#21CCC1FF");
            ctx.shadowColor = "#21CCC1FF";
        }else if(this.color == 4){
            grd.addColorStop(0, "#8CB2FFFF");
            grd.addColorStop(1, "blue");
            ctx.shadowColor = "blue";
        }else if(this.color == 5){
            grd.addColorStop(0, "#B982FFFF");
            grd.addColorStop(1, "purple");
            ctx.shadowColor = "purple";
        }else if(this.color == 6){
            grd.addColorStop(0, "#DD7DFFFF");
            grd.addColorStop(1, "magenta");
            ctx.shadowColor = "magenta";
        }else if(this.color == 7){
            grd.addColorStop(0, "#FF7AF1FF");
            grd.addColorStop(1, "pink");
            ctx.shadowColor = "pink";
        }else if(this.color == 8){
            grd.addColorStop(0, "#404040");
            grd.addColorStop(1, "#1f1f1f");
            ctx.shadowColor = "#1f1f1f";
        }
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.shadowBlur    = 4;
        ctx.shadowColor   = 'rgba(255 255 255 / 50%)';
        
        ctx.fill();
        ctx.beginPath();
        ctx.globalAlpha = this.health / this.startingHealth;
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'white';
    }

    this.update = function(){
        this.x += this.x_vel;
        this.y += this.y_vel;

        if(--this.health <= 0){
            return 1;
        }else{
            return 0;
        }
    }
}

function createPlayer(x_start, width, height){
    this.x = x_start;
    this.y = gameY + gameHeight - height - 16;
    this.width = width;
    this.height = height;
    this.speed = 4.5;
    this.draw = function(){
        var outline = 2;
        ctx=gameCanvas.context; //Set Context
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur    = 4;
        ctx.shadowColor   = 'rgba(255 255 255 / 50%)';
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.roundRect(this.x + outline, this.y + outline, this.width - outline * 2, this.height - outline * 2, 10);
        ctx.fill();
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'white';
    }
    this.drawBall = function(){
        var outline = 2;
        var radius = stdBallSize;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur    = 6;
        ctx.shadowColor   = 'rgba(255 255 255 / 50%)';
        ctx=gameCanvas.context; //Set Context

        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.arc(this.x + this.width / 2, this.y - radius, radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(this.x + this.width / 2, this.y - radius, radius - outline, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur    = 0;
        ctx.shadowColor   = 'white';
    }
    this.move = function(){

        //  Translations
        if(keyLeft){
            this.x -= this.speed;
        }
        if(keyRight){
            this.x += this.speed;
        }

        //  Collisions
        if(this.x < gameX){
            this.x = gameX;
        }
        else if(this.x > gameX + gameWidth - this.width){
            this.x = gameX + gameWidth - this.width;
        }
    }
}

function createParticle(startX, startY, distanceX, distanceY, time, size){
    this.startX = startX;
    this.startY = startY;
    this.distanceX = distanceX;
    this.distanceY = distanceY;
    this.time = time;
    this.size = size;

    this.x = startX;
    this.y = startY;
    this.progress = 0;

    this.update = function(){
        this.x = this.startX + this.distanceX * this.progress;
        this.y = this.startY + this.distanceY * this.progress;
        this.progress += 1 / this.time;

        if(this.progress > 1){
            return 1;
        }else{
            return 0;
        }
    }

    this.draw = function(){
        if(this.y < gameY){
            return;
        }
        if(this.y > gameY + gameHeight - this.size){
            return;
        }
        var ctx = gameCanvas.context;
        ctx.beginPath();
        ctx.fillStyle = 'yellow';
        ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.fill();
        ctx.beginPath();
        ctx.globalAlpha = this.progress;
        ctx.fillStyle = 'red';
        ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function generateLevel(level, variation){//level(any) variation(0-1)
    blocks = [];
    spikes = [];
    level = Math.floor((level + lvloffset) % 6);
    switch(level){
        case 0:
            for(var i = 40; i < 280; i += 20){
                if(i >= 140 && i < 180){
                    continue;
                }
                blocks.push(new createBlock(i, 120, 20, 10, 1, 0, 0));
            }
            for(var i = 50; i < 270; i += 20){
                if(i >= 130 && i < 190){
                    continue;
                }
                blocks.push(new createBlock(i, 130, 20, 10, 1, 0, 1));
            }
            for(var i = 40; i < 280; i += 20){
                if(i >= 100 && i < 220){
                    continue;
                }
                blocks.push(new createBlock(i, 140, 20, 10, 1, 0, 2));
            }
            for(var i = 50; i < 270; i += 20){
                if(i >= 90 && i < 230){
                    continue;
                }
                blocks.push(new createBlock(i, 150, 20, 10, 1, 0, 3));
            }
            for(var i = 40; i < 280; i += 20){
                if(i >= 100 && i < 220){
                    continue;
                }
                blocks.push(new createBlock(i, 160, 20, 10, 1, 0, 4));
            }
        
            for(var i = 100; i < 220; i += 20){
                if(i >= 140 && i < 180){
                    continue;
                }
                blocks.push(new createBlock(i, 200, 20, 10, 1, 0, 5));
            }
            for(var i = 90; i < 230; i += 20){
                if(i >= 130 && i < 190){
                    continue;
                }
                blocks.push(new createBlock(i, 210, 20, 10, 1, 0, 6));
            }
            for(var i = 100; i < 220; i += 20){
                if(i >= 140 && i < 180){
                    continue;
                }
                blocks.push(new createBlock(i, 220, 20, 10, 1, 0, 7));
            }
        
            //Special Blocks
            var s0, s1, s2;
            variation = Math.floor(variation * 3);

            switch(variation){
                case 0:
                    s0 = 2;
                    s1 = 3;
                    s2 = 3;
                    break;
                case 1:
                    s0 = 2;
                    s1 = 4;
                    s2 = 4;
                    break;
                case 2:
                    s0 = 3;
                    s1 = 2;
                    s2 = 2;
                    break;
            }

            blocks.push(new createBlock(145, 140, 30, 30, 1, s0, 0));
            blocks.push(new createBlock(240, 200, 30, 30, 1, s1, 0));
            blocks.push(new createBlock(50, 200, 30, 30, 1, s2, 0));
            return 230;
        case 1:
            for(var i = 60; i < 260; i += 20){
                if(i >= 80 && i < 240){
                    continue;
                }
                blocks.push(new createBlock(i, 130, 20, 10, 1, 0, 1));
                blocks.push(new createBlock(i, 140, 20, 10, 1, 0, 2));
                blocks.push(new createBlock(i, 150, 20, 10, 1, 0, 3));

                blocks.push(new createBlock(i, 240, 20, 10, 1, 0, 1));
                blocks.push(new createBlock(i, 250, 20, 10, 1, 0, 2));
                blocks.push(new createBlock(i, 260, 20, 10, 1, 0, 3));
            }
            for(var i = 110; i < 210; i += 20){
                blocks.push(new createBlock(i, 130, 20, 10, 1, 0, 1));
                blocks.push(new createBlock(i, 140, 20, 10, 1, 0, 2));
                blocks.push(new createBlock(i, 150, 20, 10, 1, 0, 3));

                blocks.push(new createBlock(i, 240, 20, 10, 1, 0, 1));
                blocks.push(new createBlock(i, 250, 20, 10, 1, 0, 2));
                blocks.push(new createBlock(i, 260, 20, 10, 1, 0, 3));
            }
            for(var i = 60; i < 260; i += 20){
                blocks.push(new createBlock(i, 120, 20, 10, 1, 0, 0));
                blocks.push(new createBlock(i, 160, 20, 10, 1, 0, 4));

                blocks.push(new createBlock(i, 230, 20, 10, 1, 0, 0));
                blocks.push(new createBlock(i, 270, 20, 10, 1, 0, 4));
            }
        
            //Special Blocks
            var s0, s1, s2, s3;
            variation = Math.floor(variation * 4);

            switch(variation){
                case 0:
                    s0 = 2;
                    s1 = 2;
                    s2 = 3;
                    s3 = 3;
                    break;
                case 1:
                    s0 = 2;
                    s1 = 3;
                    s2 = 2;
                    s3 = 3;
                    break;
                case 2:
                    s0 = 4;
                    s1 = 4;
                    s2 = 2;
                    s3 = 2;
                    break;
                case 3:
                    s0 = 4;
                    s1 = 2;
                    s2 = 4;
                    s3 = 2;
                    break;
            }

            blocks.push(new createBlock(80, 130, 30, 30, 1, s0, 8));
            blocks.push(new createBlock(210, 130, 30, 30, 1, s1, 8));

            blocks.push(new createBlock(80, 240, 30, 30, 1, s2, 8));
            blocks.push(new createBlock(210, 240, 30, 30, 1, s3, 8));
            return 250;
        case 2:
            for(var i = 60; i < 260; i += 20){
                if(i >= 140 && i < 180){
                    continue;
                }
                blocks.push(new createBlock(i, 120, 20, 10, 1, 0, 0));
            }
            for(var i = 50; i < 270; i += 20){
                if(i >= 150 && i < 170){
                    continue;
                }
                blocks.push(new createBlock(i, 130, 20, 10, 1, 0, 0));
            }
            for(var i = 50; i < 70; i += 20){
                blocks.push(new createBlock(i, 140, 20, 10, 1, 0, 0));
                blocks.push(new createBlock(i, 150, 20, 10, 1, 0, 0));
                blocks.push(new createBlock(i, 160, 20, 10, 1, 0, 0));
            }
            for(var i = 100; i < 220; i += 20){
                blocks.push(new createBlock(i, 140, 20, 10, 1, 0, 0));
                blocks.push(new createBlock(i, 150, 20, 10, 1, 0, 0));
                blocks.push(new createBlock(i, 160, 20, 10, 1, 0, 0));
            }
            for(var i = 250; i < 270; i += 20){
                blocks.push(new createBlock(i, 140, 20, 10, 1, 0, 0));
                blocks.push(new createBlock(i, 150, 20, 10, 1, 0, 0));
                blocks.push(new createBlock(i, 160, 20, 10, 1, 0, 0));
            }
            for(var i = 50; i < 270; i += 20){
                blocks.push(new createBlock(i, 170, 20, 10, 1, 0, 0));
            }
            for(var i = 60; i < 260; i += 20){
                blocks.push(new createBlock(i, 180, 20, 10, 1, 0, 0));
            }
            for(var i = 70; i < 250; i += 20){
                blocks.push(new createBlock(i, 190, 20, 10, 1, 0, 0));
            }
            for(var i = 80; i < 240; i += 20){
                blocks.push(new createBlock(i, 200, 20, 10, 1, 0, 0));
            }
            for(var i = 90; i < 230; i += 20){
                blocks.push(new createBlock(i, 210, 20, 10, 1, 0, 0));
            }
            for(var i = 100; i < 220; i += 20){
                blocks.push(new createBlock(i, 220, 20, 10, 1, 0, 0));
            }
            for(var i = 110; i < 210; i += 20){
                blocks.push(new createBlock(i, 230, 20, 10, 1, 0, 0));
            }
            for(var i = 120; i < 200; i += 20){
                blocks.push(new createBlock(i, 240, 20, 10, 1, 0, 0));
            }
            for(var i = 130; i < 190; i += 20){
                blocks.push(new createBlock(i, 250, 20, 10, 1, 0, 0));
            }
            for(var i = 140; i < 180; i += 20){
                blocks.push(new createBlock(i, 260, 20, 10, 1, 0, 0));
            }
            for(var i = 150; i < 170; i += 20){
                blocks.push(new createBlock(i, 270, 20, 10, 1, 0, 0));
            }

            for(var i = 0; i < blocks.length; i++){
                switch(i % 2){
                    case 0:
                        blocks[i].color = 0;
                        break;
                    case 1:
                        blocks[i].color = 6;
                        break;
                }
            }

            //Special Blocks
            var s0, s1, s2, s3;
            variation = Math.floor(variation * 4);

            switch(variation){
                case 0:
                    s0 = 2;
                    s1 = 2;
                    s2 = 3;
                    s3 = 3;
                    break;
                case 1:
                    s0 = 2;
                    s1 = 3;
                    s2 = 2;
                    s3 = 3;
                    break;
                case 2:
                    s0 = 4;
                    s1 = 4;
                    s2 = 2;
                    s3 = 2;
                    break;
                case 3:
                    s0 = 3;
                    s1 = 2;
                    s2 = 3;
                    s3 = 2;
                    break;
            }

            blocks.push(new createBlock(70, 140, 30, 30, 1, s0, 5));
            blocks.push(new createBlock(220, 140, 30, 30, 1, s2, 5));

            blocks.push(new createBlock(50, 240, 30, 30, 1, s1, 5));
            blocks.push(new createBlock(240, 240, 30, 30, 1, s3, 5));
            return 280;
        case 3:
            for(var i = 40; i < 100; i += 20){
                blocks.push(new createBlock(i, 120, 20, 10, 1, 0, 0));
            }
            for(var i = 220; i < 280; i += 20){
                blocks.push(new createBlock(i, 120, 20, 10, 1, 0, 0));
            }
            for(var i = 50; i < 110; i += 20){
                blocks.push(new createBlock(i, 130, 20, 10, 1, 0, 0));
            }
            for(var i = 210; i < 270; i += 20){
                blocks.push(new createBlock(i, 130, 20, 10, 1, 0, 0));
            }
            for(var i = 60; i < 120; i += 20){
                blocks.push(new createBlock(i, 140, 20, 10, 1, 0, 0));
            }
            for(var i = 200; i < 260; i += 20){
                blocks.push(new createBlock(i, 140, 20, 10, 1, 0, 0));
            }
            for(var i = 70; i < 130; i += 20){
                blocks.push(new createBlock(i, 150, 20, 10, 1, 0, 0));
            }
            for(var i = 190; i < 250; i += 20){
                blocks.push(new createBlock(i, 150, 20, 10, 1, 0, 0));
            }
            for(var i = 80; i < 140; i += 20){
                blocks.push(new createBlock(i, 160, 20, 10, 1, 0, 0));
            }
            for(var i = 180; i < 240; i += 20){
                blocks.push(new createBlock(i, 160, 20, 10, 1, 0, 0));
            }
            for(var i = 90; i < 150; i += 20){
                blocks.push(new createBlock(i, 170, 20, 10, 1, 0, 0));
            }
            for(var i = 170; i < 230; i += 20){
                blocks.push(new createBlock(i, 170, 20, 10, 1, 0, 0));
            }
            for(var i = 80; i < 140; i += 20){
                blocks.push(new createBlock(i, 180, 20, 10, 1, 0, 0));
            }
            for(var i = 180; i < 240; i += 20){
                blocks.push(new createBlock(i, 180, 20, 10, 1, 0, 0));
            }
            for(var i = 70; i < 130; i += 20){
                blocks.push(new createBlock(i, 190, 20, 10, 1, 0, 0));
            }
            for(var i = 190; i < 250; i += 20){
                blocks.push(new createBlock(i, 190, 20, 10, 1, 0, 0));
            }
            for(var i = 60; i < 120; i += 20){
                blocks.push(new createBlock(i, 200, 20, 10, 1, 0, 0));
            }
            for(var i = 200; i < 260; i += 20){
                blocks.push(new createBlock(i, 200, 20, 10, 1, 0, 0));
            }
            for(var i = 50; i < 110; i += 20){
                blocks.push(new createBlock(i, 210, 20, 10, 1, 0, 0));
            }
            for(var i = 210; i < 270; i += 20){
                blocks.push(new createBlock(i, 210, 20, 10, 1, 0, 0));
            }
            for(var i = 40; i < 100; i += 20){
                blocks.push(new createBlock(i, 220, 20, 10, 1, 0, 0));
            }
            for(var i = 220; i < 280; i += 20){
                blocks.push(new createBlock(i, 220, 20, 10, 1, 0, 0));
            }

            //Special Blocks
            var s0, s1, s2, s3;
            variation = Math.floor(variation * 6);

            switch(variation){
                case 0:
                    s0 = 2;
                    s1 = 2;
                    s2 = 3;
                    s3 = 3;
                    break;
                case 1:
                    s0 = 2;
                    s1 = 3;
                    s2 = 2;
                    s3 = 3;
                    break;
                case 2:
                    s0 = 4;
                    s1 = 4;
                    s2 = 2;
                    s3 = 2;
                    break;
                case 3:
                    s0 = 3;
                    s1 = 2;
                    s2 = 3;
                    s3 = 2;
                    break;
                case 4:
                    s0 = 4;
                    s1 = 2;
                    s2 = 4;
                    s3 = 2;
                    break;
                case 5:
                    s0 = 3;
                    s1 = 4;
                    s2 = 3;
                    s3 = 4;
                    break;
            }
            for(var i = 0; i < blocks.length; i++){
                blocks[i].color = Math.floor(i / 6) % 3 + 2;
            }
            blocks.push(new createBlock(145, 120, 30, 30, 1, s0, 0));
            blocks.push(new createBlock(145, 190, 30, 30, 1, s2, 0));

            blocks.push(new createBlock(40, 160, 30, 30, 1, s1, 0));
            blocks.push(new createBlock(250, 160, 30, 30, 1, s3, 0));

            
            return 260;
        case 4:
            for(var j = 0; j < 6; j++){
                for(var i = 40; i < 100; i += 20){
                    blocks.push(new createBlock(i, 140 + j * 20, 20, 10, 1, 0, j));
                }
                for(var i = 220; i < 280; i += 20){
                    blocks.push(new createBlock(i, 140 + j * 20, 20, 10, 1, 0, j));
                }
                for(var i = 140; i < 180; i += 20){
                    blocks.push(new createBlock(i, 140 + j * 20, 20, 10, 1, 0, j));
                }
                
            }

            blocks.push(new createBlock(60, 100, 30, 30, 1, 2, 0));
            blocks.push(new createBlock(145, 100, 30, 30, 1, 4, 0));
            blocks.push(new createBlock(230, 100, 30, 30, 1, 2, 0));
            return 270;
        case 5:
            for(var i = 0; i < 4; i++){
                for(var j = 0; j < 5; j++){
                    var cen = 90 + i % 2 * 120;
                    var sx = cen - j * 10;
                    var ex = cen + j * 10;
                    for(var cx = sx; cx <= ex; cx += 20){
                        blocks.push(new createBlock(cx, 80 + j * 10 + Math.floor(i / 2) * 100, 20, 10, 1, 0, j));
                    }
                }
            }

            //Special Blocks
            var s = new Array(3);
            variation = Math.floor(variation * 27);

            s[0] = Math.floor(variation / 9);
            s[1] = Math.floor(Math.floor(variation / 3) / 3);
            s[2] = variation % 3;

            for(var i = 0; i < 3; i++){
                blocks.push(new createBlock(45 + i * 100, 140, 30, 30, 1, s[i] + 2, 0));
            }
            
            return 240;
    }
    
}

function destroyBlocks(blockIDList, fast=false){
    //Sound
    for(var i = blockIDList.length - 1; i >= 0; i--){
        var block = blocks[blockIDList[i]];
        if(block.hits <= 1){
            if(block.type == 0){
                breakNormalSnd.play();
            }else if(block.type == 1){
            }
            else if(block.type == 2){
                breakSnd.play();
            }else if(block.type == 3){
                bombSnd.play();
            }else if(block.type == 4){
                breakSnd.play();
            }
            break;
        }
    }

    //Logic
    for(var i = blockIDList.length - 1; i >= 0; i--){
        var block = blocks[blockIDList[i]];
        block.hits -= 1;
        if(block.type == 0){
            game.score += 1;
            scoreNumber.push(new createScoreNumber(block.x + block.width / 2, block.y, 1, 'white'));
            breakNormalSnd.play();
        }else if(block.type == 1){
            game.score += 5;
            scoreNumber.push(new createScoreNumber(block.x + block.width / 2, block.y, 5, 'yellow'));
        }
        else if(block.type == 2){
            game.score += 1;
            scoreNumber.push(new createScoreNumber(block.x + block.width / 2, block.y, 1, 'white'));
            var spd = 3;
            for(var j = 0; j < 4; j++){
                var angle = Math.random() * Math.PI * 2;
                var x_delta = Math.cos(angle) * spd;
                var y_delta = Math.sin(angle) * spd;
                balls.push(new createBall(block.x + block.width / 2, block.y + block.height / 2, x_delta, y_delta, stdBallSize));
                
            }
        }else if(block.type == 4){
            game.score += 1;
            scoreNumber.push(new createScoreNumber(block.x + block.width / 2, block.y, 1, 'white'));
            spikes.push(new createSpike(block.x, block.y, 0));
            
        }
        if(block.hits <= 0){
            if(block.type == 3){
                explosions.push(new createExplosion(block.x + block.width / 2, block.y + block.height / 2, 80));
                
            }
            if(!fast){
                //Create particles
                var random = Math.floor(Math.random() * 5) + 10;
                for(var j = 0; j < random; j++){
                    var xx = block.x + block.width / 2;
                    var yy = block.y + block.height / 2;
                    var aa = Math.random() * Math.PI * 2;
                    var mm = Math.random() + 1;
                    var x_vel = Math.cos(aa) * mm;
                    var y_vel = Math.sin(aa) * mm;
                    var color = block.color;
                    particles.push(new createBlockParticle(xx, yy, x_vel, y_vel, color, 2))
                }
            }

            blocks.splice(blockIDList[i], 1);
        }
    }
    if(game.score >= game.nextScore){
        game.lives++;
        game.nextScore *= 2;
        messages.push(new createMessage("Extra Life!", "green", 120));
        newLifeSnd.play();
    }
}

function createMessage(message, color, time){
    this.message = message;
    this.color = color;
    this.time = time;
    this.update = function(){//return true if message is finished
        if(this.time % 40 >= 10){
            var ctx = gameCanvas.context;

            ctx.shadowColor = 'black';
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 6;

            ctx.font = "64px Cute Font";
            ctx.textAlign = "center";
            
            ctx.fillStyle = 'grey';
            ctx.fillText(message, canvasWidth / 2 + 2, canvasHeight / 3 + 2);
            ctx.fillStyle = "white";
            ctx.fillText(message, canvasWidth / 2, canvasHeight / 3);
            ctx.shadowBlur = 0;
        }
        if(--this.time < 0){
            return false;
        }
        return true;
    }
}

function updateCanvas(){
    game.update();
}


window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

startGame();

var interval=setInterval(updateCanvas, 17);