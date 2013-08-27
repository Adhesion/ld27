/*
 * player.js
 *
 * Defines the player.
 *
 * @author Adhesion
 */
window.tick = 0.016666666;

var Player = me.ObjectEntity.extend(
{
    init: function( x, y, settings )
    {
        settings.image        = settings.image        || 'player';
        settings.spritewidth  = settings.spritewidth  || 96;
        settings.spriteheight = settings.spriteheight || 120;
        this.parent( x, y, settings );

        this.origVelocity = new me.Vector2d( 7.0, 11.0 );
        this.setVelocity( this.origVelocity.x, this.origVelocity.y );
        this.defaultMax = this.maxVel.clone();
        this.origGravity = 0.3;
        this.gravity = this.origGravity;
        this.setFriction( 0.85, 0.1 );
        this.updateColRect( 11, 70, 9, 106 );

        this.hp = 3;

        /*this.wallStuckGravity = 0.1;
        this.wallStuck = false;
        this.wallStuckCounter = 0;*/

        this.stunCooldown = 0;
        this.stunCooldownMax = 30;

        this.enemyStunned = false;

        this.font = new me.BitmapFont("16x16_font_blue", 16);
        this.font.set( "center" );
		
		this.hitCooldown = 0; 
		this.hitCooldownMax = 60;
	
        this.pushTimer = 0;
        this.pushTimerMax = 50;

        // this is mostly broken/unused i think
        this.jetpackCooldownMax = 60;
        this.jetpackCooldown = 0;
        this.jetpacked = false; // have we jetpacked this frame?

        this.boosted = false; // have we boosted this jump?

        this.collidable = true;

        this.inSpace = false;
        this.spaceTimeMax = 10.0;
        this.spaceTimeDisplay = -1.0;

        this.haveDoubleJump = true;

        this.curWalkLeft = false;

        this.centerOffsetX = 72;
        this.centerOffsetY = 72;

        this.followPos = new me.Vector2d( this.pos.x + this.centerOffsetX,
            this.pos.y + this.centerOffsetY );
        this.renderable.addAnimation("Idle", [ 0 ], 100 );
        this.renderable.addAnimation("ShootStun", [ 1, 1, 2, 1 ], 10 );
        this.renderable.addAnimation("Stunned", [ 3 ], 10 );
        this.renderable.addAnimation("Walk", [ 4, 5, 6, 7 ], 10 );
        this.renderable.addAnimation("JumpUp", [ 8 ], 10 );
        this.renderable.addAnimation("JumpDown", [ 9 ], 10 );
        this.renderable.addAnimation("Floating", [ 10, ], 10 );
        this.renderable.addAnimation("FloatingUp", [ 11 ], 10 );
        this.renderable.addAnimation("FloatingDown", [ 12 ], 10 );
        this.renderable.addAnimation("SpaceStunned", [ 13 ], 10 );
        this.renderable.addAnimation("SpaceShootStun", [ 14, 15 ], 30 );

        this.renderable.setCurrentAnimation( "Idle" );

        me.game.viewport.follow( this.followPos, me.game.viewport.AXIS.BOTH );
        me.game.viewport.setDeadzone( me.game.viewport.width / 10, 1 );

        me.input.bindKey( me.input.KEY.UP, "up" );
        me.input.bindKey( me.input.KEY.DOWN, "down" );
        me.input.bindKey( me.input.KEY.LEFT, "left" );
        me.input.bindKey( me.input.KEY.RIGHT, "right" );
        me.input.bindKey( me.input.KEY.X, "jump", true );
		
		//removed jetpack in normal mode, jump jets in space. 
        //me.input.bindKey( me.input.KEY.C, "jetpack", true );
        me.input.bindKey( me.input.KEY.C, "stun", true );

        me.game.player = this;
    },

    hit: function( dmg )
    {
		if( this.hitCooldown <=0 ){ 
			hitCooldown = this.hitCooldownMax; 
			this.hp -= dmg;
			me.audio.play( "hit" );
			this.renderable.flicker( this.hitCooldownMax );
			
			this.renderable.setCurrentAnimation(
				this.inSpace ? "SpaceStunned" : "Stunned"
			);
			
			if( this.hp <= 0 )
				this.die();
		}
    },

    die: function()
    {
        me.audio.play( "death" );
        var duration = 1000;
        this.spaceTimeDisplay = -1.0;
        this.renderable.flicker( duration );
        var fade = '#000000';
        me.game.viewport.fadeIn( fade, duration, function() {
            me.state.current().startLevel( me.levelDirector.getCurrentLevelId() );
        });
    },

    update: function()
    {
        if( this.hp > 0 && this.pushTimer <= 0 ) {
            this.checkInput();
        }

        if( this.pushTimer > 0 )
        {
            this.pushTimer--;
        }

		if( this.isPushed && this.pushTimer <= 0){
			console.log("player:: PUSH DONE"); 
			this.isPushed = false;
			this.setVelocity( this.origVelocity.x, this.origVelocity.y );
			this.renderable.setCurrentAnimation(
				this.inSpace ? "Floating" : "Idle"
			);
		}
		
        this.jetpacked = false;

        //if ( this.wallStuckCounter > 0 ) --this.wallStuckCounter;
        var lastFalling = this.falling;

        // check collision against environment
        var envRes;
        if( envRes = this.updateMovement() ) {
            // hit ground
            if( envRes.y > 0 && ! this.inSpace )
            {
                // this is outside the fall check in case we boost purely on land
                this.boosted = false;
                if ( lastFalling && !this.falling )
                {
                    // land
                    this.doubleJumped = false;
                    this.renderable.setCurrentAnimation( "Idle" );
                    me.audio.play( "step" );
                }
            }
        }

        if( this.falling && ! lastFalling && ! this.inSpace && ! this.isPushed )
        {
            this.renderable.setCurrentAnimation("JumpDown");
        }

        // check collision against other objects
        var collisions = me.game.collide( this, true );
        if( collisions.length > 0 )
        {
            collisions.forEach( this.handleCollision, this );
        }
        else if( this.inSpace )
        {
            this.renderable.setCurrentAnimation( this.isPushed ? "Stunned" : "Idle" );
            this.setMaxVelocity( this.defaultMax.x, this.defaultMax.y );
			this.setVelocity( this.origVelocity.x, this.origVelocity.y );
			
            this.inSpace = false;
            this.gravity = this.origGravity;
            this.setFriction( 0.85, 0.1 );
            this.spaceTimeDisplay = -1.0;
        }

        if( this.hp > 0 )
            this.updateSpaceTime();

        if( this.stunCooldown > 0 ) this.stunCooldown--;
        if( this.stunCooldown == 0 ) this.enemyStunned = false;
        if( this.jetpackCooldown > 0 ) this.jetpackCooldown--;
        if( this.hitCooldown > 0 ) this.hitCooldown--;

        // update cam follow position
        this.followPos.x = this.pos.x + this.centerOffsetX;
        this.followPos.y = this.pos.y + this.centerOffsetY;

        // hack to get current frame
        if ( this.renderable.isCurrentAnimation( "Walk" ) )
        {
            if ( this.renderable.current.idx == 0 || this.renderable.current.idx == 2 )
            {
                this.stepped = false;
            }
            else if ( ( this.renderable.current.idx == 1 || this.renderable.current.idx == 3 ) && !this.stepped )
            {
                me.audio.play( "step" );
                this.stepped = true;
            }
        }

        this.parent( this );
        return true;
    },

    updateSpaceTime: function()
    {
        if( this.inSpace )
        {
            this.spaceTimer --;
            this.spaceTimeDisplay = this.spaceTimer * window.tick;
            this.spaceTimeDisplay = this.spaceTimeDisplay.toFixed( 1 );

            if( this.spaceTimeDisplay <= 0 ) {
                this.spaceTimeDisplay = 0;
                if( this.hp > 0 )
                {
                    this.spaceTimer = 600;
                    this.hit(1);
                }
            }
        }

        me.game.HUD.setItemValue( "spaceTimer", this.spaceTimeDisplay );
    },

    handleCollision: function( colRes )
    {
        if( !this.inSpace && colRes.obj.type == "space" )
        {
            // release him... into SPACE
            this.renderable.setCurrentAnimation( "Floating" );
            this.gravity = 0;
            this.setFriction( 0.001, 0.001);
            this.setMaxVelocity( 8, 8 );
            this.inSpace = true;
            this.spaceTimer = 600;
        }
        if( colRes.obj.type == "los" )
        {
            // player got seen by some SHIT
            // !
            colRes.obj.seen();
        }
        if( colRes.obj.type == "laser" )
        {
            //console.log( "player laser hit" );
            // DEAD, YOU ARE - DEAD
            this.hit( 2 );
            //this.collidable = false;
           // this.renderable.flicker( 100.0, (function() { this.collidable = true; }).bind(this) );
        }
        if( colRes.obj.type == "missile" )
        {
            // DEAD, YOU ARE - DEAD
            colRes.obj.kill();
            this.hit( 2 );
        }
        if( colRes.obj.door ) {
            // stop if we hit a door
            this.vel.x = colRes.x ? 0 : this.vel.x;
            this.vel.y = colRes.y ? 0 : this.vel.y;
            this.pos.x -= colRes.x;
            this.pos.y -= colRes.y;
        }
        if( colRes.obj.type == "trash" )
        {
            if( this.hp < 3 ) this.hp++;
            me.game.remove( colRes.obj );
            me.audio.play( "pickup" );
            me.game.trashCount++;
        }
		
		if( colRes.obj.type == "pod" )
        {
            me.game.goodEnding = true;
			me.state.change( me.state.GAMEOVER );
		}
    },

    checkInput: function()
    {
        var self = this;
        
		/* removed jetpack when not in space. 
		if ( me.input.isKeyPressed( "jetpack" ) )
        {
            this.fireJetpack();
        }
		*/
		if ( this.inSpace && me.input.isKeyPressed( "jump" ) )
        {
           this.fireJetpack();
        }
        else if( !this.inSpace )
        {
            if ( me.input.isKeyPressed( "jump" ) )
            {
                if ( !this.jumping && !this.falling )
                {
                    this.renderable.setCurrentAnimation("JumpUp");
                    this.doJump();
                    me.audio.play( "jump" );
                }
                // double jump
                else if ( this.haveDoubleJump && !this.doubleJumped )
                {
                    this.renderable.setCurrentAnimation("JumpUp");
                    this.forceJump();
                    this.doubleJumped = true;
                    //spawnParticle( this.pos.x, this.pos.y, "doublejump", 144,
                    //    [ 0, 1, 2, 3, 4, 5 ], 3, this.z + 1 );
                    me.audio.play( "jump" );
                }
            }

            if ( me.input.isKeyPressed( "left" ) )
            {
                this.doWalk( true );
                if ( !this.jumping && !this.falling && !this.jetpacked ) {
                    this.renderable.setCurrentAnimation( "Walk", function() {
                        self.renderable.setCurrentAnimation("Idle" );
                    });
                }
                this.curWalkLeft = true;
            }
            else if ( me.input.isKeyPressed( "right" ) )
            {
                this.doWalk( false );
                if ( !this.jumping && !this.falling && !this.jetpacked ) {
                    this.renderable.setCurrentAnimation( "Walk", function() {
                        self.renderable.setCurrentAnimation("Idle" );
                    });
                }
                this.curWalkLeft = false;
            }
        }
        // i'm floating in a most peculiar way
        else
        {
            var floatSpeed = 0.2;
            var change = false;
            if( me.input.isKeyPressed( "up" ) )
            {
                change = true;
                this.vel.y -= floatSpeed * me.timer.tick;
            }
            if( me.input.isKeyPressed( "down" ) )
            {
                change = true;
                this.vel.y += floatSpeed * me.timer.tick;
            }
            if( me.input.isKeyPressed( "left" ) )
            {
                change = true;
                this.vel.x -= floatSpeed * me.timer.tick;
                this.flipX( (this.curWalkLeft = true ));
            }
            if( me.input.isKeyPressed( "right" ) )
            {
                change = true;
                this.vel.x += floatSpeed * me.timer.tick;
                this.flipX( (this.curWalkLeft = false ));
            }

            if( change ) {
                var l = this.vel.length(),
                    rx = this.vel.x/l,
                    ry = this.vel.y/l;
                if( Math.abs(ry) > Math.abs(rx) ) {
                    this.renderable.setCurrentAnimation(
                        ry < 0 ? "FloatingUp" : "FloatingDown"
                   );
                }
                else {
                    this.renderable.setCurrentAnimation( "Floating" );
                }
            }
        }


        if ( me.input.isKeyPressed( "stun" ) )
        {
            if( this.stunCooldown == 0 )
            {
                this.stun();
                this.stunCooldown = this.stunCooldownMax;
            }
        }

        /*if ( this.wallStuck )
        {
            // TODO why do i need to do this? (iskeypressed fails second time)
            var jumpkey = me.input.isKeyPressed( "jump" );
            if ( jumpkey || me.input.isKeyPressed( "down") )
            {
                this.gravity = this.origGravity;
                this.wallStuck = false;
                this.wallStuckCounter = 15;
                //this.vel.y = -20.0;

                if ( jumpkey )
                {
                    this.flipX( this.wallStuckDir > 0 );
                    this.forceJump();
                    me.audio.play( "jump" );
                    this.vel.x = this.wallStuckDir * -10.0;
                }
            }
            return;
        }*/
    },

    fireJetpack: function()
    {
        var available = this.jetpackCooldown == 0;
        if( !this.inSpace )
        {
            available = available && !this.boosted;
        }
        if ( available )
        {
            this.boosted = true;

            this.jetpackCooldown = this.jetpackCooldownMax;
            this.jetpacked = true;
            var nvx, nvy;
            if( me.input.isKeyPressed( "up" ) ) {
                nvy = -1;
            }
            else if( me.input.isKeyPressed( "down" ) ) {
                nvy = 1;
            }
            if( me.input.isKeyPressed( "right" ) ) {
                nvx = 1;
            }
            else if( me.input.isKeyPressed( "left" ) ) {
                nvx = -1;
            }



            if( !( nvx || nvy ) ) {
                nvx = 0;
                nvy = -1;
            }
            var x = this.pos.x + 45,
                y = this.pos.y + 80,
                vx = -this.vel.x / 10;
                vy = -this.vel.y / 10;

            this.vel.x = nvx * 10;
            this.vel.y = nvy * 10;

            if( !this.inSpace ) {
                this.renderable.setCurrentAnimation("JumpUp");
            }

            for( var p = 0; p < 10; p++ ) {
                var curStun = new PlayerParticle( x, y, {
                    spritewidth: 48,
                    image:   "jump",
                    collide: false,
                    flip:    this.curWalkLeft,
                    frames:  [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ],
                    speed:   4,
                    type:    "smoke"
                });

                curStun.vel.y = vy + Math.sin(p*Math.PI/5);
                curStun.vel.x = vx + Math.cos(p*Math.PI/5);
                me.game.add( curStun, 10 );
            }

            me.game.sort();

            me.audio.play( "jetpack" );
        }
        return available;
    },

    stun: function()
    {
        var self = this;
        if( self.stunning || self.renderable.isCurrentAnimation( self.inSpace ? "SpaceShootStun" : "ShootStun" ) ) {
            return;
        }
        self.stunning = true;


        self.renderable.setCurrentAnimation(
            self.inSpace ? "SpaceShootStun" : "ShootStun",
            function() {
                self.renderable.setCurrentAnimation(
                    self.inSpace ? "Floating" : "Idle"
                );
            }
        );

        var posX = this.pos.x + (this.curWalkLeft ? -1 : 1 ) * 85,
            posY = this.pos.y + 53;
        var zap = new PlayerParticle(
            posX,
            posY,
            {
                image: "zap",
                spritewidth: 96,
                spriteheight: 48,
                frames: [ 0, 1, 2, 3, 4 ],
                speed: 4,
                type: "stun",
                collide: false,
                flip: this.curWalkLeft,
                callback: function() {
                    self.stunning = false;
                }
            }
        );
        zap.vel = this.vel;
        me.game.add( zap, 10 );
        me.game.sort();
        me.audio.play( "stun" );
    },

    pushed: function( vel )
    {
        if(this.hitCooldown <= 0){
			this.hit( 1 );
			this.setVelocity( this.origVelocity.x * 7.0, this.origVelocity.y * 7.0 );
			this.vel.x += 7.0 * vel.x;
			// flicker & set vel back to orig vel on end
			var self = this;
			self.renderable.setCurrentAnimation(
				self.inSpace ? "SpaceStunned" : "Stunned"
			);
			console.log("player:: PUSHING"); 
			
			// apparently waiting for flicker to finish sucks? 
			// wait for pushTimer = 0 in update then reset 'ispushed'
			self.isPushed = true;
			self.pushTimer = this.pushTimerMax;
		}
    },

    draw: function( context )
    {
        this.parent( context );
        if( this.enemyStunned )
        {
            var stunTimerDisplay = this.stunCooldown / 60.0;
            stunTimerDisplay = stunTimerDisplay.toFixed( 1 );
            this.font.draw(
                context,
                "" + stunTimerDisplay,
                this.pos.x + 40,
                this.pos.y - 16
            );
        }
    }

    /*updateStunPos: function()
    {

    }*/
});

var PlayerParticle = me.ObjectEntity.extend(
{
    init: function( x, y, settings )
    {
        this.parent( x, y, {
            image: settings.image,
            spritewidth: settings.spritewidth,
            spriteheight: settings.spriteheight || settings.spritewidth,
        });
        var frames = settings.frames,
            speed = settings.speed,
            type = settings.type,
            collide = settings.collide,
            flip = settings.flip,
            noAnimation = settings.noAnimation;

        this.gravity = 0;

        this.renderable.animationspeed = speed;

        this.alwaysUpdate = true;

        if( !noAnimation )
        {
            this.renderable.addAnimation( "play", frames );
            var self = this;
            var cb = settings.noRemove ? undefined : function() {
                me.game.remove( self, true );
                if( settings.callback ) {
                    settings.callback();
                }
                return false;
            };
            this.renderable.setCurrentAnimation( "play", cb );
        }

        this.type = type;
        this.collide = collide;

        if( flip )
            this.flipX( flip );
    },

    update: function()
    {
        this.updateMovement();

        if ( this.collide )
        {
            me.game.collide( this );
        }

        this.parent();
        return true;
    }
});
