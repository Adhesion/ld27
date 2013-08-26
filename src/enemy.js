/*
 * enemy.js
 *
 * Defines various enemy types
 *
 * @author Adhesion
 */

var Enemy = me.ObjectEntity.extend({
    init: function( x, y, settings )
    {
        settings.image        = settings.image        || 'robut';
        settings.spritewidth  = settings.spritewidth  || 144;
        settings.spriteheight = settings.spriteheight || 144;

        this.parent( x, y, settings );

        this.origVelocity = new me.Vector2d( 1.0, 4.0 );
        this.madVelocity = new me.Vector2d( 3.0, 4.0 );
        this.setVelocity( this.origVelocity.x, this.origVelocity.y );
        this.setFriction( 0.2, 0.2 );
		
		console.log("BADDIE: " + settings.losHeight); 
		
        var losSettings = {spriteHeight:settings.losHeight, spriteWidth:settings.losWidth};
        this.sight = new LineOfSight( this.pos.x, this.pos.y, losSettings, this );
        me.game.add( this.sight, 10 ); // TODO fix this Z boolsheet (i think this.z is undefined before it gets added/sorted itself afterwards?)
        me.game.sort();

        this.AIstate = "idle";
        this.stunTimer = 0;
        this.stunTimerMax = 600;

        this.walkCounter = 0;
        this.walkCounterMax = 100;
        this.walkRight = true;

        this.madCounter = 0;
        this.madCounterMax = 600;
		
		this.waitCooldown = 0; 
		this.waitCooldownMax = 120; 
		
        this.chargeCounter = 0;
        this.chargeMax = 150;
        this.charging = true;
		
		this.losOffsetRight = 100; 
		this.losOffsetLeft = -100; 
		
        this.type = "enemy";
    },

    makeMad: function()
    {
        // only play sound if not mad already
        if( this.AIstate == "idle" )
        {
            me.audio.play( "robotopen" );
        }

        if( this.AIstate != "stunned" )
        {
            if( this.AIstate != "mad" )
            {
                var self = this;
                this.renderable.setCurrentAnimation("Mad", function() {
                    self.renderable.setCurrentAnimation("Charge");
                });
            }

            this.AIstate = "mad";
            this.madCounter = this.madCounterMax;
            this.setVelocity( this.madVelocity.x, this.madVelocity.y );
        }
    },

    makeIdle: function()
    {
        var self = this;
        if( self.renderable.isCurrentAnimation("Mad")
            || self.renderable.isCurrentAnimation("Charge")
            || self.renderable.isCurrentAnimation("Shoot")
        ) {
            console.log("Calming????");
            this.renderable.setCurrentAnimation("Calm", function() {
                console.log("walking!");
                self.renderable.setCurrentAnimation("Walk");
            });
        }
        else {
            self.renderable.setCurrentAnimation("Walk");
        }
        this.setVelocity( this.origVelocity.x, this.origVelocity.y );
        this.AIstate = "idle";

        this.charging = false;
        this.chargeCounter = 0;
    },

    // what the robot does on idle
    patrol: function()
    {
        this.walkCounter++;
        if( this.walkCounter >= this.walkCounterMax )
        {
            this.walkRight = !this.walkRight;
            this.walkCounter = 0;
        }

        this.doWalk( !this.walkRight );
    },

    // what the robot does when it sees you
    madAct: function()
    {

    },

    charge: function()
    {
        this.charging = true;
    },

    fire: function()
    {

    },

    update: function()
    {
        var lastWalkRight = this.walkRight;
		
		
        if( this.waitCooldown > 0 ) {
			this.waitCooldown--;
		} 
		
		if( this.AIstate == "idle" )
		{
			this.patrol();
		}
		else if( this.AIstate == "mad" )
		{
			this.madAct();

			if( this.charging )
			{
				this.chargeCounter++;
				if( this.chargeCounter >= this.chargeMax )
				{
					this.charging = false;
					this.chargeCounter = 0;
					this.fire();
				}
			}

			this.madCounter--;
			if( this.madCounter == 0 )
			{
				this.makeIdle();
			}
		}
		else if( this.AIstate == "stunned" )
		{
			this.stunTimer--;
			if( this.stunTimer <= 0 )
			{
				me.game.remove( this.staticparticle );
				this.makeIdle();
			}
		}
		

        this.updateMovement();

        me.game.collide( this, true ).forEach( this.collisionHandler, this );

        this.updateLOSPOS( lastWalkRight );

        this.parent( this );
        return true;
    },

    collisionHandler: function( res )
    {
        if( this.AIstate != "stunned" && res.obj.type == "stun" )
        {
            this.staticparticle = new PlayerParticle( this.pos.x, this.pos.y, {
                image: "stun",
                spritewidth: 96,
                frames: [ 0, 1, 2, 3 ],
                speed: 10,
                type: "wibble",
                collide: false,
                noRemove: true
            }),

                me.game.add( this.staticparticle, 10 );
            me.game.sort();

            this.AIstate = "stunned";
            this.renderable.setCurrentAnimation( "Stunned" );
            this.stunTimer = this.stunTimerMax;
			
			me.game.player.stunCooldown = this.stunTimerMax;
			
            this.charging = false;
            this.chargeCounter = 0;
			
			
            me.audio.play( "robotstunned" );
        }
    },

    updateLOSPOS: function( lastWalkRight )
    {
        // set LOS pos
        if ( this.sight )
        {
            if ( this.walkRight )
            {
                this.sight.pos.x = this.pos.x + this.losOffsetRight;
            }
            else
            {
                this.sight.pos.x = this.pos.x + this.losOffsetLeft;
            }
            this.sight.pos.y = this.pos.y - this.sight.spriteheight/2 + 50;

            if ( lastWalkRight != this.walkRight )
            {
                this.sight.flipX( !this.walkRight );
            }
        }
    }
});

var PusherBot = Enemy.extend({
    init: function( x, y, settings )
    {
        settings.image        = settings.image        || 'pusherbot';
        settings.spritewidth  = settings.spritewidth  || 117;
        settings.spriteheight = settings.spriteheight || 114;
		settings.losHeight = 128; 
		settings.losWidth = 256; 
		
        this.parent( x, y, settings );
		
		this.losOffsetRight = 30; 
		this.losOffsetLeft = -150; 
		
        this.renderable.addAnimation("Idle", [0], 100 );
        this.renderable.addAnimation("Walk", [0,1], 10 );
        this.renderable.addAnimation("Mad",  [2,3,4,5,6,7], 10 );
        this.renderable.addAnimation("Calm", [8,9,10], 10 );
        this.renderable.addAnimation("Charge", [11,12], 10 );
        this.renderable.addAnimation("Stunned", [13,14,15], 10 );
        this.makeIdle();
		
    },

    makeMad: function()
    {
        // only play sound if not mad already
        if( this.AIstate == "idle" )
        {
            me.audio.play( "intruder" );
        }
        this.parent();
    },

    madAct: function()
    {
        this.walkRight = !(this.pos.x > me.game.player.pos.x);
        this.doWalk( !this.walkRight );
    },

    onCollision: function( res, obj )
    {
        this.parent( res, obj );
        if( this.AIstate != "stunned" && this.waitCooldown <= 0 ) {
            // res check is to make sure the enemy is facing the player
            if ( obj == me.game.player && (res.x < 0 != this.vel.x < 0) )
            {
				this.waitCooldown = this.waitCooldownMax; 
                me.game.player.pushed( this.vel );
                me.audio.play( "robotstun" );
				this.makeIdle();
				this.madCounter = 0; 
            }
        }
    }
});

var LaserBot = Enemy.extend({
    init: function( x, y, settings )
    {
        settings.image        = settings.image        || 'laserbot';
        settings.spritewidth  = settings.spritewidth  || 120;
        settings.spriteheight = settings.spriteheight || 120;
		settings.losHeight = 512; 
		settings.losWidth = 512; 
		
        this.parent( x, y, settings );

		this.losOffsetRight = -150; 
		this.losOffsetLeft = -256; 
		
        this.laserCooldown = 0;
        this.laserCooldownMax = 200;
        this.renderable.addAnimation("Idle", [0], 100 );
        this.renderable.addAnimation("Walk", [1], 10 );
        this.renderable.addAnimation("Mad",  [2,3,4,5,6,7,8,9], 10 );
        this.renderable.addAnimation("Charge",  [9], 10 );
        this.renderable.addAnimation("Shoot", [9], 10 );
        this.renderable.addAnimation("Calm", [10,11,12,13], 10 );
        this.renderable.addAnimation("Stunned", [14,15,16], 10 );

        this.origVelocity = new me.Vector2d( 0.5, 0.5 );
        this.setVelocity( this.origVelocity.x, this.origVelocity.y );

        this.updateColRect( 10, 100, 8, 94 );

        this.makeIdle();
    },

    madAct: function()
    {
        if( this.laserCooldown == 0 && !this.charging )
            this.charge();
    },

    charge: function()
    {
        me.audio.play( "charging" );
        me.audio.play( "lasercharge" );
        this.parent();
    },

    fire: function()
    {
        me.audio.play( "laserfire" );

        var posX = this.pos.x - 245; var posY = this.pos.y + 44;
        var width = 285; var height = 39;
        var z = this.z + 1;
        var frames = [ 0, 2, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5, 1, 3, 4, 5, 0, 3, 4, 6, 0, 2, 1, 6, 0 ];

        var left = new PlayerParticle( posX, posY, {
            image: "laser",
            spritewidth: width,
            spriteheight: height,
            frames: frames,
            speed: 1,
            type: "laser",
            collide: false,
            flip: true
        });

        posX = this.pos.x + 80;
        var right = new PlayerParticle( posX, posY,{
            image: "laser",
            spritewidth: width,
            spriteheight: height,
            frames: frames,
            speed:1,
            type: "laser",
            collide: false,
            flip: false
        });

        posX = this.pos.x - 83;
        posY = this.pos.y - 120;
        var up = new PlayerParticle( posX, posY, {
            image: "laser",
            spritewidth: width,
            spriteheight: height, 
            frames: frames,
            speed: 1,
            type: "laser",
            collide: false,
            flip: false
        });
        up.updateColRect( 123, 39, -123, 285 );
        up.renderable.angle = 3 * Math.PI / 2;

        posY = this.pos.y + 223;
        var down = new PlayerParticle( posX, posY, {
            image: "laser",
            spritewidth: width,
            spriteheight: height,
            frames: frames,
            speed: 1,
            type: "laser",
            collide: false,
            flip: false
        });
        down.updateColRect( 123, 39, -123, 285 );
        down.renderable.angle = Math.PI / 2;

        me.game.add( left, z );
        me.game.add( right, z );
        me.game.add( up, z );
        me.game.add( down, z );
        me.game.sort();

        this.laserCooldown = this.laserCooldownMax;
    },

    update: function()
    {
        if( this.laserCooldown > 0 )
            this.laserCooldown--;

        return this.parent();
    }
});

var MissileBot = Enemy.extend({
    init: function( x, y, settings )
    {
        settings.image        = settings.image        || 'missilebot';
        settings.spritewidth  = settings.spritewidth  || 96;
        settings.spriteheight = settings.spriteheight || 96;
		settings.losHeight = 512; 
		settings.losWidth = 256;
		
        this.parent( x, y, settings );
		
		this.losOffsetRight = 30; 
		this.losOffsetLeft = -150; 
		
        if( settings.flip !== undefined )
        {
            this.walkRight = !settings.flip;
            this.flipX( settings.flip );
        }

        this.gravity = 0;
        this.missileCooldown = 0;
        this.missileCooldownMax = 100;
        this.renderable.addAnimation("Idle", [0], 100 );
        this.renderable.addAnimation("Walk", [0], 10 );
        this.renderable.addAnimation("Mad",  [1,2,3,4,5,6,7,8], 10 );
        this.renderable.addAnimation("Charge",  [8], 10 );
        this.renderable.addAnimation("Calm", [9, 10, 11], 10 );
        this.renderable.addAnimation("Stunned", [12,13,14], 10 );

        this.chargeMax = 60;

        this.makeIdle();
    },

    makeMad: function()
    {
        // only play sound if not mad already
        if( this.AIstate == "idle" )
        {
            me.audio.play( "destroy" );
        }
        this.parent();
    },

    patrol: function()
    {

    },

    madAct: function()
    {
        if( this.missileCooldown == 0 && !this.charging )
            this.charge();
    },

    fire: function()
    {
        this.missileCooldown = this.missileCooldownMax;
        var posX = this.pos.x + 18; var posY = this.pos.y + 10;
        if( !this.walkRight )
            posX = this.pos.x + 48;
        var frames = [ 0 ];
        var left = new Missile( posX, posY, {
            image: "missile",
            spritewidth: 48,
            frames: frames,
            speed: 1,
            type: "missile",
            collide: false,
            flip: false,
            noRemove: true
        });
        if( !this.walkRight )
            left.renderable.angle = Math.PI;
        me.game.add( left, this.z + 1 );
        me.game.sort();
        me.audio.play( "missilefire" );
    },

    update: function()
    {
        if( this.missileCooldown > 0 )
            this.missileCooldown--;

        return this.parent();
    }
});

var Missile = PlayerParticle.extend({
    init: function( x, y, settings )
    {
        this.parent( x, y, settings );

        this.setVelocity( 4.0, 4.0 );
        this.life = 300;
		
		this.particleSpawnCount = 0;
    },

    update: function()
    {
		this.particleSpawnCount--;
		if(this.particleSpawnCount <= 0){
			this.particleSpawnCount = 5;
			//spawn particle? 
			
			var posX = this.pos.x,
				posY = this.pos.y;
			
			var smoke = new PlayerParticle(
				posX,
				posY,
				{
					image: "missileSmoke",
					spritewidth: 48,
					spriteheight: 48,
					frames: [ 0, 1, 2, 3 ],
					speed: 4,
					type: "smoke",
					collide: false,
					flip: false
				}
			);
			me.game.add( smoke, 9 );
			me.game.sort();
		}
	
        var distance = this.toPlayer();
        if( Math.abs(distance.x) > 20.0 ) this.vel.x += (distance.x * 0.001 + (Math.random()*0.5 - 0.25));
        if( Math.abs(distance.y) > 20.0 ) this.vel.y += (distance.y * 0.001 + (Math.random()*0.5 - 0.25));
        this.renderable.angle = Math.atan2( distance.y, distance.x );

        var res;
        if( res = this.updateMovement() ) {
            if( res.x != 0 || res.y != 0 )
            {
                this.kill();
            }
        }

        this.life--;
        if( this.life <= 0 )
            this.kill();

        return true;
    },

    kill: function()
    {
        this.collidable = false;
        me.game.remove( this );
        me.audio.play( "explosion" );
        var asplode = new PlayerParticle( this.pos.x-48, this.pos.y-48, {
            spritewidth: 144,
            image:   "explode",
            collide: false,
            flip:    false,
            frames:  [ 0, 1, 2, 3, 4, 5, 6, 7 ],
            speed:   4,
            type:    "explode"
        });
        me.game.add( asplode, this.z+1 );
        me.game.sort();
    },

    toPlayer: function()
    {
        if( me.game.player ) {
            return new me.Vector2d(
                me.game.player.pos.x
                    + me.game.player.width / 2
                    - this.pos.x - this.width / 2,
                me.game.player.pos.y
                    + me.game.player.height / 2
                    - this.pos.y - this.height / 2
            );
        }
        return;
    }
});

var LineOfSight = me.ObjectEntity.extend({
    init: function( x, y, settings, enemyParent )
    {
        settings.image        = settings.image        || 'los';
        settings.spritewidth  = settings.spriteWidth  || 256;
        settings.spriteheight = settings.spriteHeight || 256;
		
		
		this.spritewidth = settings.spritewidth;
		this.spriteheight = settings.spriteheight;
		
        this.parent( x, y, settings );

        this.type = "los";
        this.enemyParent = enemyParent;
    },

    seen: function()
    {
        if(this.enemyParent.waitCooldown <= 0) this.enemyParent.makeMad();
    },

    update: function()
    {
        this.parent();
        return true;
    }
});

var Fox = PusherBot.extend({
    init: function( x, y, settings, enemyParent )
    {
        settings.image        = settings.image        || 'fox';
        settings.spritewidth  = settings.spritewidth  || 144;
        settings.spriteheight = settings.spriteheight || 144;
        this.parent( x, y, settings );

        this.renderable.addAnimation("Idle", [0,1,2,3], 5 );
        this.renderable.addAnimation("Walk", [7,8,9,10], 4 );
        this.renderable.addAnimation("Mad",  [7,8,9,10], 10 );
        this.renderable.addAnimation("Calm", [0,1,2,3], 10 );
        this.renderable.addAnimation("Charge", [11], 10 );
        this.renderable.addAnimation("Stunned", [15], 10 );
        this.makeIdle();

        this.updateColRect( 44, 88, 59, 76 );

        this.type = "fox";
    },

    makeMad: function()
    {

    },

    onCollision: function( res, obj )
    {

    }
});

var Mainframe = me.ObjectEntity.extend({
    init: function( x, y, settings )
    {
        settings.image        = settings.image        || 'los';
        settings.spritewidth  = settings.spritewidth  || 48 * 5;
        settings.spriteheight = settings.spriteheight || 48 * 2;
		
		this.alwaysUpdate = true; 
        this.parent( x, y, settings );

        this.type = "mainframe";
		
		this.exploding = 600; 
		this.dieing = false;
    },

    update: function()
    {
		if(this.dieing){
			this.exploding--;
			
			this.pos.x += Math.random()*2-1;
			this.pos.y += Math.random()*2-1;
			
			if(this.exploding % 5 == 0){
				var dPosX = this.pos.x + ( this.width / 2 ) - 48 + Math.random()* 200-100;
				var dPosY = this.pos.y + ( this.height / 2 ) - 48 + Math.random()* 200-100;
				
				
				var asplode = new PlayerParticle( dPosX, dPosY, {
					spritewidth: 144,
					image:   "explode",
					collide: false,
					flip:    false,
					frames:  [ 0, 1, 2, 3, 4, 5, 6, 7 ],
					speed:   4,
					type:    "explode"
				});
				me.game.add( asplode, this.z+1 );
				me.game.sort();
				
			}
			if(this.exploding % 20 == 0) me.audio.play( "explosion" );
			
			me.game.viewport.shake(25, 25, me.game.viewport.AXIS.BOTH);
			
			if(this.exploding <= 0){
				me.state.change( me.state.GAMEOVER );
			}
			
		}
	
        me.game.collide( this, true ).forEach( this.collisionHandler, this );
        this.parent( this );
        return true;
    },

    collisionHandler: function( res )
    {
        if( res.obj.type == "stun" &&  !this.dieing )
        {
            this.staticparticle = new PlayerParticle( this.pos.x, this.pos.y, {
                image: "stun",
                spritewidth: 96,
                frames: [ 0, 1, 2, 3 ],
                speed: 10,
                type: "wibble",
                collide: false,
                noRemove: true
            }),
            me.game.add( this.staticparticle, 10 );
            me.game.sort();
			
			this.staticparticle = new PlayerParticle( this.pos.x + 96, this.pos.y, {
                image: "stun",
                spritewidth: 96,
                frames: [ 0, 1, 2, 3 ],
                speed: 10,
                type: "wibble",
                collide: false,
                noRemove: true
            }),
			
            me.game.add( this.staticparticle, 10 );
            me.game.sort();
			
			this.staticparticle = new PlayerParticle( this.pos.x + 96 * 2, this.pos.y, {
                image: "stun",
                spritewidth: 96,
                frames: [ 0, 1, 2, 3 ],
                speed: 10,
                type: "wibble",
                collide: false,
                noRemove: true
            }),
            me.game.add( this.staticparticle, 10 );
            me.game.sort();
			
			this.dieing = true; 
			
            me.audio.play( "robotstunned" );
			
			
            me.audio.play( "switch" );
            me.state.current().getDoor( 3 ).open();
            me.state.current().getDoor( 4 ).open();
        }
    }
});
