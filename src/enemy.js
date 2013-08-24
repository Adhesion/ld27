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

        this.type = "enemy";
    },

    makeMad: function()
    {
        if( this.AIstate != "stunned" )
        {
            this.AIstate = "mad";
            this.madCounter = this.madCounterMax;
            this.setVelocity( this.madVelocity.x, this.madVelocity.y );
        }
    },

    makeIdle: function()
    {
        this.setVelocity( this.origVelocity.x, this.origVelocity.y );
        this.AIstate = "idle";
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

            this.madCounter--;
            if( this.madCounter == 0 )
            {
                this.makeIdle();
            }
        }
        else if( this.AIstate == "stunned" )
        {
            this.stunTimer--;
            if( this.stunTimer == 0 )
            {
                this.makeIdle();
            }
        }

        this.updateMovement();

        me.game.collide( this, true ).forEach( this.collisionHandler, this );

        this.updateLOSPOS( lastWalkRight );

        var move = ( this.vel.x || this.vel.y );
        if ( move )
            this.parent( this );
        return move;
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
        if( res.obj.type == "stun" )
        {
            me.game.remove( res.obj );
            this.AIstate = "stunned";
            this.stunTimer = 600;
        }
    },

    onCollision: function( res, obj )
    {
        this.parent( res, obj );
        // res check is to make sure the enemy is facing the player
        if ( obj == me.game.player && (res.x < 0 != this.vel.x < 0) )
        {
            me.game.player.pushed( this.vel );
            //me.audio.play( "push" );
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
        this.laserCooldownMax = 50;
    },

    patrol: function()
    {

    },

    madAct: function()
    {
        if( this.laserCooldown == 0 )
            this.fireLasers();
    },

    fireLasers: function()
    {
        var posX = this.pos.x - 245; var posY = this.pos.y + 44;
        var width = 285; var height = 39;
        var z = this.z + 1;
        var frames = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

        var left = new PlayerParticle( posX, posY, "laser", width, frames, 1, "laser", false, true, height );

        posX = this.pos.x + 80;
        var right = new PlayerParticle( posX, posY, "laser", width, frames, 1, "laser", false, false, height );

        posX = this.pos.x - 83;
        posY = this.pos.y - 120;
        var up = new PlayerParticle( posX, posY, "laser", width, frames, 1, "laser", false, false, height );
        up.updateColRect( 123, 39, -123, 285 );
        up.renderable.angle = 3 * Math.PI / 2;

        posY = this.pos.y + 223;
        var down = new PlayerParticle( posX, posY, "laser", width, frames, 1, "laser", false, false, height );
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
    },

    patrol: function()
    {

    },

    madAct: function()
    {

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

    checkCollision: function( obj )
    {
        if( obj == me.game.player ) {
            return this.parent( obj );
        }
        else if( obj.type == "enemy" )
        {
            console.log( "enemy los col????" );
        }
        return null;
    },

    onCollision: function() {
        // why in the actual fuck does this get called all the goddamn time if ^^^^FFFF
        //console.log( "player hit line of sight, los at " + this.pos.x + ", " + this.pos.y );
    },

    update: function()
    {
        this.parent();
        return true;
    }
});
