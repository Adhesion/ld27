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

        this.origVelocity = new me.Vector2d( 1.0, 1.0 );
        this.madVelocity = new me.Vector2d( 3.0, 3.0 );
        this.setVelocity( this.origVelocity.x, this.origVelocity.y );
        this.setFriction( 0.2, 0.2 );

        var losSettings = {};

        this.sight = new LineOfSight( this.pos.x, this.pos.y, losSettings, this );
        me.game.add( this.sight, 5 ); // TODO fix this Z boolsheet (i think this.z is undefined before it gets added/sorted itself afterwards?)
        me.game.sort();

        this.AIstate = "idle";
        this.stunTimer = 0;

        this.walkCounter = 0;
        this.walkCounterMax = 100;
        this.walkRight = true;

        this.madCounter = 0;
        this.madCounterMax = 600;

        this.chargeCounter = 0;
        this.chargeMax = 150;
        this.charging = true;

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
            var self = this;
            this.renderable.setCurrentAnimation("Mad", function() {
                self.renderable.setCurrentAnimation("Charge");
            });
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
    },

    // what the robot does on idle
    patrol: function()
    {
        console.log( "base patrol" );
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

    },

    updateLOSPOS: function( lastWalkRight )
    {
        // set LOS pos
        if ( this.sight )
        {
            if ( this.walkRight )
            {
                this.sight.pos.x = this.pos.x + 50;
            }
            else
            {
                this.sight.pos.x = this.pos.x - 100;
            }
            this.sight.pos.y = this.pos.y;

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
        this.parent( x, y, settings );
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

    madAct: function()
    {
        this.walkRight = !(this.pos.x > me.game.player.pos.x);
        this.doWalk( !this.walkRight );
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

            me.game.add( this.staticparticle, 4 );
            me.game.sort();

            this.AIstate = "stunned";
            this.renderable.setCurrentAnimation( "Stunned" );
            this.stunTimer = 600;
            me.audio.play( "robotstunned" );
        }
    },

    onCollision: function( res, obj )
    {
        this.parent( res, obj );
        if( this.AIstate != "stunned" ) {
            // res check is to make sure the enemy is facing the player
            if ( obj == me.game.player && (res.x < 0 != this.vel.x < 0) )
            {
                me.game.player.pushed( this.vel );
                me.audio.play( "robotstun" );
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
        this.parent( x, y, settings );

        this.laserCooldown = 0;
        this.laserCooldownMax = 300;
        this.renderable.addAnimation("Idle", [0], 100 );
        this.renderable.addAnimation("Walk", [0,1], 10 );
        this.renderable.addAnimation("Mad",  [2,3,4,5,6,7,8,9], 10 );
        this.renderable.addAnimation("Shoot", [9], 10 );
        this.renderable.addAnimation("Calm", [10,11,12,13], 10 );
        this.renderable.addAnimation("Stunned", [14,15,16], 10 );

        this.makeIdle();
    },

    patrol: function()
    {

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
        var frames = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

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
        this.parent( x, y, settings );

        this.gravity = 0;
        this.missileCooldown = 0;
        this.missileCooldownMax = 150;
        this.renderable.addAnimation("Idle", [0], 100 );
        this.renderable.addAnimation("Walk", [0], 10 );
        this.renderable.addAnimation("Mad",  [1,2,3,4,5,6,7,8], 10 );
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
        var posX = this.pos.x + this.width + 10; var posY = this.pos.y;
        var frames = [ 0 ];
        var left = new Missile( posX, posY, {
            image: "missile",
            spritewidth: 48,
            frames: frames,
            speed: 1,
            type: "missile",
            collide: false,
            flip: !this.walkRight,
            noAnimation: true
        });
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

        this.setVelocity( 2.5, 2.5 );
        this.life = 400;
    },

    update: function()
    {
        var distance = this.toPlayer();
        if( Math.abs(distance.x) > 20.0 ) this.vel.x += (distance.x * 0.0005 + (Math.random()*0.5 - 0.25));
        if( Math.abs(distance.y) > 20.0 ) this.vel.y += (distance.y * 0.0005 + (Math.random()*0.5 - 0.25));
        this.renderable.angle = Math.atan2( distance.y, distance.x );

        var res = this.updateMovement();
        if( res && ( res.x != 0 || res.y != 0 ) )
        {
            this.kill();
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
        settings.spritewidth  = settings.spritewidth  || 192;
        settings.spriteheight = settings.spriteheight || 32;
        this.parent( x, y, settings );

        this.type = "los";
        this.enemyParent = enemyParent;
    },

    seen: function()
    {
        this.enemyParent.makeMad();
    },

    update: function()
    {
        this.parent();
        return true;
    }
});
