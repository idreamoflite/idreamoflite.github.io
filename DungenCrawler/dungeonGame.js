// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

window.requestAnimFrame = (function () 
{
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) 
            {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function AssetManager() 
{
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function (path) 
{
    console.log(path.toString());
    this.downloadQueue.push(path);
};

AssetManager.prototype.isDone = function () 
{
    return (this.downloadQueue.length == this.successCount + this.errorCount);
};

AssetManager.prototype.downloadAll = function (callback) 
{
    if (this.downloadQueue.length === 0) window.setTimeout(callback, 100);
    
    for (var i = 0; i < this.downloadQueue.length; i++) 
    {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        
        img.addEventListener("load", function () 
        {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) callback();
        });
        
        img.addEventListener("error", function () 
        {
            that.errorCount += 1;
            if (that.isDone()) callback();
        });
        
        img.src = path;
        this.cache[path] = img;
    }
};

AssetManager.prototype.getAsset = function(path)
{
    //console.log(path.toString());
    return this.cache[path];
};

function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, 
					frameDuration, frames, loop, reverse) 
{
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameDuration = frameDuration;
    this.frames = frames;
    this.loop = loop;
    this.reverse = reverse;
    
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;  
}

Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) 
{
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    
    if (this.loop) 
    {
        if (this.isDone()) this.elapsedTime = 0;
    } 
    else if (this.isDone()) return;
    
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) 
    {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) 
    {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    
    ctx.drawImage(this.spriteSheet, index * this.frameWidth + offset, 
    				vindex*this.frameHeight + this.startY,  // source from sheet
    				this.frameWidth, this.frameHeight, locX, locY, this.frameWidth * scaleBy,
    				this.frameHeight * scaleBy);
};

Animation.prototype.currentFrame = function () 
{
    return Math.floor(this.elapsedTime / this.frameDuration);
};

Animation.prototype.isDone = function () 
{
    return (this.elapsedTime >= this.totalTime);
};

function Timer() 
{
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () 
{
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
};

function GameEngine() 
{
    this.entities = [];
    this.ctx = null;
    this.map = new Map(3, 30, 20);
    
    //this.click = null;
    //this.mouse = null;
    //this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) 
{
    this.ctx = ctx;
    this.map.init();
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
    //loadCaves(this.ctx, this.map.caves[0]);
    console.log('game initialized');
};

GameEngine.prototype.start = function () 
{
    console.log("starting game");
    var that = this;
    
    (function gameLoop() 
    {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
};

GameEngine.prototype.startInput = function () 
{
    console.log('Starting input');

    var getXandY = function (e) 
    {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) 
        {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    };

    var that = this;

    /*this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
        e.preventDefault();
    }, false);*/

    this.ctx.canvas.addEventListener("keydown", function (e) 
    {
        //if (String.fromCharCode(e.which) === 'J') that.space = true;
        if (String.fromCharCode(e.which) === 'W') that.up = true;
        //if (String.fromCharCode(e.which) === 'W' && 'A') that.leftUp = true;
        //if (String.fromCharCode(e.which) === 'W' && 'D') that.rightUp = true;
        if (String.fromCharCode(e.which) === 'S') that.down = true;
        //if (String.fromCharCode(e.which) === 'S' && 'A') that.leftDown = true;
        //if (String.fromCharCode(e.which) === 'S' && 'D') that.rightDown = true;
        if (String.fromCharCode(e.which) === 'A') that.left = true;
        if (String.fromCharCode(e.which) === 'D') that.right = true;
        else that.standing = true;
        //else if (String.fromCharCode(e.which) === ' ') that.space = true;
        e.preventDefault();
    }, false);

    console.log('Input started');
};

GameEngine.prototype.addEntity = function (entity) 
{
    console.log('added entity');
    this.entities.push(entity);
};

GameEngine.prototype.draw = function (drawCallback) 
{
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    
    //loadCaves(this.ctx, this.map.caves[0]);
    
    for (var i = 0; i < this.entities.length; i++) 
    {
        this.entities[i].draw(this.ctx);
    }
    
    if (drawCallback) drawCallback(this);
    
    this.ctx.restore();
};

GameEngine.prototype.update = function () 
{
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) 
    {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) entity.update();
    }

    for (var i = this.entities.length - 1; i >= 0; --i) 
    {
        if (this.entities[i].removeFromWorld) this.entities.splice(i, 1);
    }
};

GameEngine.prototype.loop = function () 
{
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.space = false;
    this.up = false;
    //this.leftUp = false;
    //this.rightUp = false;
    this.down = false;
    //this.leftDown = false;
    //this.right.down = false;
    this.left = false;
    this.right = false;
    this.standing = false;
    //this.click = null;
    //this.wheel = null;
};

function Entity(game, x, y) 
{
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
};

Entity.prototype.draw = function (ctx) 
{
    if (this.game.showOutlines && this.radius) 
    {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
    }
};

Entity.prototype.rotateAndCache = function (image, angle) 
{
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
};

//////////// GAMEBOARD CODE BELOW ///////////////////////

function BoundingBox(x, y, width, height) 
{
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.left = x;
    this.top = y;
    this.right = this.left + width;
    this.bottom = this.top + height;
}

BoundingBox.prototype.collide = function (oth) 
{
    if (this.right > oth.left && this.left < oth.right && this.top < oth.bottom && this.bottom > oth.top) return true;
    return false;
};

function Platform(game, x, y, width, height) 
{
    this.width = width;
    this.height = height;
    this.boundingbox = new BoundingBox(x, y, width, height);
    Entity.call(this, game, x, y);
}

Platform.prototype = new Entity();
Platform.prototype.constructor = Platform;

Platform.prototype.update = function () 
{
    this.x -= 400 * this.game.clockTick;
    
    if (this.x + this.width < 0) this.x += 3200;
    
    this.boundingbox = new BoundingBox(this.x, this.y, this.width, this.height);
    Entity.prototype.update.call(this);
};

Platform.prototype.draw = function (ctx) 
{
    var grad;
    var offset = 0;
    while (offset < this.width) 
    {
        grad = ctx.createLinearGradient(this.boundingbox.left + offset, 0, this.boundingbox.left + 400 + offset, 0);
        grad.addColorStop(0, 'red');
        grad.addColorStop(1 / 7, 'orange');
        grad.addColorStop(2 / 7, 'yellow');
        grad.addColorStop(3 / 7, 'green');
        grad.addColorStop(4 / 7, 'aqua');
        grad.addColorStop(5 / 7, 'blue');
        grad.addColorStop(6 / 7, 'purple');
        grad.addColorStop(1, 'red');
        ctx.fillStyle = grad;
        ctx.fillRect(this.x + offset, this.y, Math.min(400, this.width - offset), this.height);
        offset += 400;
    }
};

function Link(game, platforms) 
{
    /*this.animation = new Animation(ASSET_MANAGER.getAsset("./img/link.png"), 0, 270, 90, 90, 0.02, 5, true, true);
    this.jumpAnimation = new Animation(ASSET_MANAGER.getAsset("./img/link.png"), 0, 180, 90, 90, 0.02, 5, true, true);
    this.fallAnimation = new Animation(ASSET_MANAGER.getAsset("./img/link.png"), 0, 180, 90, 90, 0.02, 5, true, true);*/
    
    this.downWalkAnimation = new Animation(ASSET_MANAGER.getAsset("./img/link.png"), 0, 270, 90, 90, 0.03, 5, false, true);
    this.upWalkAnimation = new Animation(ASSET_MANAGER.getAsset("./img/link.png"), 0, 180, 90, 90, 0.03, 5, false, true);
    this.leftWalkAnimation = new Animation(ASSET_MANAGER.getAsset("./img/link.png"), 0, 0, 90, 90, 0.03, 5, false, true);
    this.rightWalkAnimation = new Animation(ASSET_MANAGER.getAsset("./img/link.png"), 0, 90, 90, 90, 0.03, 5, false, true);
    this.standingAnimation = new Animation(ASSET_MANAGER.getAsset("./img/link.png"), 0, 270, 90, 90, 0.03, 1, true, true);
    
    this.downWalk = false;
    this.upWalk = false;
    this.leftWalk = false;
    this.rightWalk = false;
    //this.leftUpWalk = false;
    //this.rightUpWalk = false;
    //this.leftDownWalk = false;
    //this.rightDownWalk = false;
    this.standingStill = false;
    this.xMoveAmount = 0;
    this.yMoveAmount = 0;
    
    this.boxes = true;
    
    /*this.jumping = false;
    this.falling = false;
    this.lastY = this.y;
    this.platforms = platforms;
    this.platform = platforms[0];
    this.jumpHeight = 200;*/

    this.boundingbox = new BoundingBox(this.x + 25, this.y, this.standingAnimation.frameWidth - 40, this.standingAnimation.frameHeight - 20);

    Entity.call(this, game, 0, 400);
}

Link.prototype = new Entity();
Link.prototype.constructor = Link;

Link.prototype.update = function () 
{	
	if(this.game.left) this.leftWalk = true;
	if(this.game.right) this.rightWalk = true;
	if(this.game.up) this.upWalk = true;
	if(this.game.down) this.downWalk = true;
	//if(this.game.leftUp) this.leftUpWalk = true;
	//if(this.game.rightUp) this.rightUpWalk = true;
	//if(this.game.leftDown) this.leftDownWalk = true;
	//if(this.game.rightDown) this.rightDownWalk = true;
	if(this.game.standing) this.standingStill = true;
	
	/*if(this.game.left && !this.leftWalk && !this.standingStill) this.leftWalk = true;
	if(this.game.right && !this.rightWalk && !this.standingStill) this.rightWalk = true;
	if(this.game.up && !this.upWalk && !this.standingStill) this.upWalk = true;
	if(this.game.down && !this.downWalk && !this.standingStill) this.downWalk = true;
	if(this.game.standing && !this.standingStill && !this.standingStill) this.standingStill = true;*/
	
    /*if (this.game.space && !this.jumping && !this.falling) 
    {
        this.jumping = true;
        this.base = this.y;
    }
    
    
      
    if (this.jumping) 
    {
        var height = 0;
        var duration = this.jumpAnimation.elapsedTime + this.game.clockTick;
        if (duration > this.jumpAnimation.totalTime / 2) duration = this.jumpAnimation.totalTime - duration;
        duration = duration / this.jumpAnimation.totalTime;

        // quadratic jump
        height = (4 * duration - 4 * duration * duration) * this.jumpHeight;
        this.lastBottom = this.boundingbox.bottom;
        this.y = this.base - height;
        this.boundingbox = new BoundingBox(this.x + 32, this.y - 32, this.jumpAnimation.frameWidth - 20, this.jumpAnimation.frameHeight - 5);

        for (var i = 0; i < this.platforms.length; i++) 
        {
            var pf = this.platforms[i];
            if (this.boundingbox.collide(pf.boundingbox) && this.lastBottom < pf.boundingbox.top) 
            {
                this.jumping = false;
                this.y = pf.boundingbox.top - this.standingAnimation.frameHeight + 10;
                this.platform = pf;
                this.jumpAnimation.elapsedTime = 0;
            }
        }
    }
    
    if (this.falling) 
    {
        this.lastBottom = this.boundingbox.bottom;
        this.y += this.game.clockTick / this.jumpAnimation.totalTime * 4 * this.jumpHeight;
        this.boundingbox = new BoundingBox(this.x + 32, this.y - 32, this.jumpAnimation.frameWidth - 20, this.jumpAnimation.frameHeight - 5);

        for (var i = 0; i < this.platforms.length; i++) 
        {
            var pf = this.platforms[i];
            if (this.boundingbox.collide(pf.boundingbox) && this.lastBottom < pf.boundingbox.top) 
            {
                this.falling = false;
                this.y = pf.boundingbox.top - this.standingAnimation.frameHeight + 10;
                this.platform = pf;
                this.fallAnimation.elapsedTime = 0;
            }
        }

    }
    
    if (!this.jumping && !this.falling && !this.upWalk && !this.downWalk && !this.leftWalk && !this.rightWalk) 
    {
        this.boundingbox = new BoundingBox(this.x+ 25, this.y+10, this.standingAnimation.frameWidth - 40, this.standingAnimation.frameHeight - 20);
        if (this.boundingbox.left > this.platform.boundingbox.right) this.falling = true;
        //this.standingStill = true;
    }
    
    for (var i = 0; i < this.platforms.length; i++) 
    {
        var pf = this.platforms[i];
        
        if (this.boundingbox.collide(pf.boundingbox)) this.dead = true;
    }
    
    if (this.y > this.game.ctx.canvas.height) this.dead = true;*/
    
    Entity.prototype.update.call(this);
};

Link.prototype.draw = function (ctx) 
{
    if (this.dead) return;
    
    /*if (this.jumping) 
    {
        if (this.boxes) 
        {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.x + 32, this.y - 32, this.jumpAnimation.frameWidth, this.jumpAnimation.frameHeight);
            ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.jumpAnimation.drawFrame(this.game.clockTick, ctx, this.x + 32, this.y - 32);
        
        if (this.jumpAnimation.isDone()) 
        {
            this.jumpAnimation.elapsedTime = 0;
            this.jumping = false;
            this.falling = true;
        }
    }*/
    
    /*if(this.standingStill) 
    {
        if (this.boxes) 
        {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.x, this.y, this.standingAnimation.frameWidth, this.standingAnimation.frameHeight);
            ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.standingAnimation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
        this.standingStill = false;
    }*/
    
    /*else if (this.falling) 
    {
        if (this.boxes) 
        {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.x + 32, this.y - 32, this.fallAnimation.frameWidth, this.fallAnimation.frameHeight);
            ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.fallAnimation.drawFrame(this.game.clockTick, ctx, this.x + 32, this.y - 32);
    }*/
    
    else if(this.leftWalk)
    {
        if (this.boxes) 
        {
            //ctx.strokeStyle = "red";
            //ctx.strokeRect(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
            
        	this.boundingbox = new BoundingBox(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
            
            ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.xMoveAmount -= 2;
        this.leftWalkAnimation.drawFrame(this.game.clockTick, ctx, this.x + this.xMoveAmount, this.y + this.yMoveAmount);
        //this.leftWalk = false;
        
        if (this.leftWalkAnimation.isDone()) 
        {
            this.leftWalkAnimation.elapsedTime = 0;
            this.leftWalk = false;
            this.standingStill = true;
        }
    }
    else if(this.rightWalk)
    {
        if (this.boxes) 
        {
            //ctx.strokeStyle = "red";
            //ctx.strokeRect(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
            
        	this.boundingbox = new BoundingBox(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
        	
        	ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        this.xMoveAmount += 2;
        this.rightWalkAnimation.drawFrame(this.game.clockTick, ctx, this.x + this.xMoveAmount, this.y + this.yMoveAmount);
        //this.rightWalk = false;

        if (this.rightWalkAnimation.isDone()) 
        {
            this.rightWalkAnimation.elapsedTime = 0;
            this.rightWalk = false;
            this.standingStill = true;
        }
    }
    else if(this.upWalk)
    {
        if (this.boxes) 
        {
            //ctx.strokeStyle = "red";
           //ctx.strokeRect(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
        	this.boundingbox = new BoundingBox(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
        	
        	ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.yMoveAmount -= 2;
        this.upWalkAnimation.drawFrame(this.game.clockTick, ctx, this.x + this.xMoveAmount, this.y + this.yMoveAmount);
        //this.upWalk = false;
        
        if (this.upWalkAnimation.isDone()) 
        {
            this.upWalkAnimation.elapsedTime = 0;
            this.upWalk = false;
            this.standingStill = true;
        }
    }
 /*   else if(this.leftUpWalk)
    {
        if (this.boxes) 
        {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.x, this.y, this.upWalkAnimation.frameWidth, this.upWalkAnimation.frameHeight);
            ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.yMoveAmount -= 2;
        this.xMoveAmount -= 2;
        this.upWalkAnimation.drawFrame(this.game.clockTick, ctx, this.x + this.xMoveAmount, this.y + this.yMoveAmount);
        //this.upWalk = false;
        
        if (this.upWalkAnimation.isDone()) 
        {
            this.upWalkAnimation.elapsedTime = 0;
            this.leftUpWalk = false;
            this.standingStill = true;
        }
    }
    else if(this.rightUpWalk)
    {
        if (this.boxes) 
        {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.x, this.y, this.upWalkAnimation.frameWidth, this.upWalkAnimation.frameHeight);
            ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.yMoveAmount -= 2;
        this.xMoveAmount += 2;
        this.upWalkAnimation.drawFrame(this.game.clockTick, ctx, this.x + this.xMoveAmount, this.y + this.yMoveAmount);
        //this.upWalk = false;
        
        if (this.upWalkAnimation.isDone()) 
        {
            this.upWalkAnimation.elapsedTime = 0;
            this.rightUpWalk = false;
            this.standingStill = true;
        }
    }*/
    else if(this.downWalk)
    {
        if (this.boxes) 
        {
            //ctx.strokeStyle = "red";
            //ctx.strokeRect(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
        	
        	this.boundingbox = new BoundingBox(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
        	ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.yMoveAmount += 2;
        this.downWalkAnimation.drawFrame(this.game.clockTick, ctx, this.x + this.xMoveAmount, this.y + this.yMoveAmount);
        //this.downWalk = false;
        
        if (this.downWalkAnimation.isDone()) 
        {
            this.downWalkAnimation.elapsedTime = 0;
            this.downWalk = false;
            this.standingStill = true;
        }
    }
    
    /*else if(this)
    {
        if (this.boxes) 
        {
            ctx.strokeStyle = "red";
            ctx.strokeRect(this.x, this.y, this.downWalkAnimation.frameWidth, this.downWalkAnimation.frameHeight);
            ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.yMoveAmount += 2;
        this.downWalkAnimation.drawFrame(this.game.clockTick, ctx, this.x + this.xMoveAmount, this.y + this.yMoveAmount);
        //this.downWalk = false;
        
        if (this.downWalkAnimation.isDone()) 
        {
            this.downWalkAnimation.elapsedTime = 0;
            this.downWalk = false;
            this.standingStill = true;
        }
    }*/
    else
    {
        if (this.boxes) 
        {
            //ctx.strokeStyle = "red";
            
        	//ctx.strokeRect(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
        	this.boundingbox = new BoundingBox(this.x + 25 + this.xMoveAmount, this.y + 45 + this.yMoveAmount, this.standingAnimation.frameWidth / 2 - 5, this.standingAnimation.frameHeight / 2 - 10);
        	ctx.strokeStyle = "green";
            ctx.strokeRect(this.boundingbox.x, this.boundingbox.y, this.boundingbox.width, this.boundingbox.height);
        }
        
        this.standingAnimation.drawFrame(this.game.clockTick, ctx, this.x + this.xMoveAmount, this.y + this.yMoveAmount);
        this.standingStill = false;
    }
    
    
};

function Cave(max_width, max_height) {
	this.width = max_width;
	this.height = max_height;
	this.items = [];
	this.portals = [];
	this.matrix = [];
	this.isTraversable = function() {
		var count = 0;
		for (var col = 0, row = 0; col < this.width; col++) {
			for (row = 0; row < this.height; row++) {
				if (this.matrix[col][row] == " ") {
					count++;
				}
			}
		}
		if (count < Math.floor((this.width * this.height) * 0.4)) {
			return false;
		} else {
			return true;
		}
	};
	this.initMatrix = function() {
		var mapRandH = 0;
		var mapRandW = 0;
		for (var col = 0, row = 0; col < this.width; col++) {
			this.matrix[col] = [];
			for (row = 0; row < this.height; row++) {
				if (col == 0 || row == 0 || col == this.width - 1 || row == this.height - 1) {
					this.matrix[col][row] = "#";
				} else {
					mapRandH = (Math.floor(Math.random() * this.height));
					mapRandW = (Math.floor(Math.random() * this.width));
					if (row == mapRandH || col == mapRandW) {
						this.matrix[col][row] = " ";
					} else {
						if (Math.random() < 0.5) {
							this.matrix[col][row] = " ";
						} else {
							this.matrix[col][row] = "#";
						}
					}
				}
			}
		}
	};
	this.generateMatrix = function() { //generates a cave from the initial matrix
		this.initMatrix();
		var newMatrix = [];
		for (var k = 0; k < 3; k++) {
			newMatrix = [];
			for (var col = 0, row = 0; col < this.width; col++) {
				newMatrix[col] = [];
				for (row = 0; row < this.height; row++) {
					newMatrix[col][row] = this.placeWalls(col, row);
				}		
			}
			this.matrix = newMatrix;
		}
		this.fineTuneMatrix();
		if (!this.isTraversable()) {
			this.generateMatrix();
		}
	};
	this.fineTuneMatrix = function() {
		for (var col = 0, row = 0; col < this.width; col++) {
			for (row = 0; row < this.height; row++) {
				if (this.matrix[col][row] == " ") {
					this.fillCavities(col, row);
				}
			}
		}
	};
	this.fillCavities = function(x, y) {
		if (!this.isOutOfBounds(x, y)) {
			if (this.matrix[x][y] != "#" && this.matrix[x][y] != "-") {
				var cave_size = this.floodFillOrCount(x, y, " ", "-", true);
				if (cave_size < Math.floor((this.height * this.width) * 0.38)) {
					this.floodFillOrCount(x, y, "-", "#", false);
				} else {
					this.floodFillOrCount(x, y, "-", " ", false);	
				}
			}
		}
	};
	this.floodFillOrCount = function(x, y, target, replacement, willCount) {
		if (!this.isOutOfBounds(x, y)) {
			if (this.matrix[x][y] != target) {
				return 0;
			} else {
				this.matrix[x][y] = replacement;
				var count = 1;
				count += this.floodFillOrCount(x - 1, y, target, replacement, willCount);
				count += this.floodFillOrCount(x + 1, y, target, replacement, willCount);
				count += this.floodFillOrCount(x, y - 1, target, replacement, willCount);
				count += this.floodFillOrCount(x, y + 1, target, replacement, willCount);
				return count;
			}
		}
		return 0;
	};
	this.placeWalls = function(col, row) {
		var numWalls = this.countNeighbors(col, row, 1, 1);
		
		if (this.matrix[col][row] == "#") {
			if (numWalls >= 5 ) {
				return "#";
			}
			if (numWalls < 2) {
				return " ";
			}
		} else {
			if (numWalls >= 4) {
				return "#";
			}
		}
		return " ";
	};
	this.countNeighbors = function(x, y, scopeX, scopeY) { //counts the number of 1s in the 3x3 grid centered on matrix[i][j]
		var startX = x - scopeX;
		var startY = y - scopeY;
		var endX = x + scopeX;
		var endY = y + scopeY;
		var wallCounter = 0;
		
		for (var i = startX, j = startY; i <= endX; i++) {
			for (j = startY; j <= endY; j++) {
				if (!(i == x && j == y)) {
					if (this.isWall(i, j)) {
						wallCounter++;
					}
				}
			}
		}
		return wallCounter;
	};
	this.isWall = function(x, y) {
		if (this.isOutOfBounds(x, y)) {
			return true;
		}
		if (this.matrix[x][y] == "#") {
			return true;
		}
		if (this.matrix[x][y] == " ") {
			return false;
		}
		return false;
	};
	this.isOutOfBounds = function(x, y) {
		if (x < 0 || y < 0) {
			return true;
		} else if (x > this.width - 1 || y > this.height - 1) {
			return true;
		}
		return false;
	};
	this.print = function() {
		var newRow = "";
		for (var row = 0, row = 0; row < this.height; row++) {
			newRow = "";
			for (col = 0; col < this.width; col++) {
				newRow += this.matrix[col][row];
			}
			console.log(newRow);
		}
	};
}

function Map(max_num_caves, max_width, max_height) {
	this.caves = [];
	this.init = function() {
		for (var i = 0; i < max_num_caves; i++) {
			var cave = new Cave(max_width, max_height);
			cave.generateMatrix();
			this.caves.push(cave);
		}
	};
}

function loadCaves(context, cave_array) {
	var imgDirt = new Image();
	imgDirt.addEventListener("load", function() {
		imgDirt.hasLoaded = true;
		if (imgDirt.hasLoaded && imgWall.hasLoaded) {
			drawCave(context, cave_array, imgWall, imgDirt);
		}
	});
	var imgWall = new Image();
	imgWall.addEventListener("load", function() {
		imgWall.hasLoaded = true;
		if (imgDirt.hasLoaded && imgWall.hasLoaded) {
			drawCave(context, cave_array, imgWall, imgDirt);
		}
	});
	imgDirt.src = "./img/dirtTileSmall.jpg";
	imgWall.src = "./img/caveTileSmall.jpg";
};

function drawCave(context, cave_array, wall_tile, floor_tile) {
	for (var i = 0, j = 0; i < cave_array.matrix.length; i++) {
		for (j = 0; j < cave_array.matrix[i].length; j++) {
			console.log(i + " " + j);
			if (cave_array.matrix[i][j] === "#") {
				context.drawImage(wall_tile, i * 32, j * 32);
			} else if (cave_array.matrix[i][j] === " ") {
				context.drawImage(floor_tile, i * 32, j * 32);	
			}
		}
	}
};

///////////////////// THE "MAIN" CODE BEGINS HERE ///////////////////////

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/link.png");

ASSET_MANAGER.downloadAll(function () 
{
    console.log("starting up da sheild");
    
    //var map = new Map(1, 30, 25);
	//map.init();	
	
	
    
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');
    var gameEngine = new GameEngine();
    var platforms = [];
    var pf = new Platform(gameEngine, 0, 500, 1800, 100);
    //gameEngine.addEntity(pf);
    platforms.push(pf);
    pf = new Platform(gameEngine, 600, 350, 600, 100);
    //gameEngine.addEntity(pf);
    platforms.push(pf);
    pf = new Platform(gameEngine, 1450, 250, 1800, 100);
    //gameEngine.addEntity(pf);
    platforms.push(pf);
	
    var link = new Link(gameEngine, platforms);
    
    //loadCaves(cxt, map.caves[0]);

    gameEngine.addEntity(link);
 
    gameEngine.init(ctx);
    gameEngine.start();
});