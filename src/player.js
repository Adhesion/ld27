/*
 * player.js
 *
 * Defines the player.
 *
 * @author Adhesion
 */

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
        this.origGravity = 0.3;
        this.gravity = this.origGravity;
        this.setFriction( 0.25, 0.1 );
        this.updateColRect( 11, 70, 9, 106 );

        this.hp = 3;

        /*this.wallStuckGravity = 0.1;
        this.wallStuck = false;
        this.wallStuckCounter = 0;*/

        this.stunCooldown = 0;
        this.stunCooldownMax = 30;

        this.pushTimer = 0;
        this.pushTimerMax = 60;

        this.jetpackCooldownMax = 250;
        this.jetpackCooldown = this.jetpackCooldownMax;
        this.jetpacked = false; // have we jetpacked this frame?

        this.collidable = true;

        this.inSpace = false;

        this.haveDoubleJump = true;

        this.curWalkLeft = false;

        this.centerOffsetX = 72;
        this.centerOffsetY = 72;

        this.followPos = new me.Vector2d( this.pos.x + this.centerOffsetX,
            this.pos.y + this.centerOffsetY );
        this.renderable.addAnimation("Walk", [ 4, 5, 6, 7 ], 10 );
        this.renderable.addAnimation("Idle", [ 0 ], 100 );
        this.renderable.addAnimation("ShootStun", [ 1, 2 ], 10 );
        this.renderable.addAnimation("Stunned", [ 4 ], 10 );

        this.renderable.setCurrentAnimation( "Idle" );

        me.game.viewport.follow( this.followPos, me.game.viewport.AXIS.BOTH );
        me.game.viewport.setDeadzone( me.game.viewport.width / 10, 1 );

        me.input.bindKey( me.input.KEY.UP, "up" );
        me.input.bindKey( me.input.KEY.DOWN, "down" );
        me.input.bindKey( me.input.KEY.LEFT, "left" );
        me.input.bindKey( me.input.KEY.RIGHT, "right" );
        me.input.bindKey( me.input.KEY.X, "jump", true );
        me.input.bindKey( me.input.KEY.C, "jetpack", true );
        me.input.bindKey( me.input.KEY.V, "stun" );

        me.game.player = this;
    },

    update: function()
    {
        if( this.hp > 0 && this.pushTimer == 0 ) {
            this.checkInput();
        }

        if( this.pushTimer > 0 )
        {
            this.pushTimer--;
        }

        this.jetpacked = false;

        //if ( this.wallStuckCounter > 0 ) --this.wallStuckCounter;
        var lastFalling = this.falling;

        // check collision against environment
        var envRes = this.updateMovement();

        // hit ground
        if( envRes.y > 0 )
        {
            if ( lastFalling && !this.falling )
            {
                this.doubleJumped = false;
                //me.audio.play( "step" );
            }
        }

        // check collision against other objects
        var collisions = me.game.collide( this, true );
        if( collisions.length > 0 )
        {
            collisions.forEach( this.handleCollision, this );
        }
        else if( this.inSpace )
        {
            this.inSpace = false;
            this.gravity = this.origGravity;
            this.setFriction( 0.25, 0.1 );
        }

        if( this.stunCooldown > 0 ) this.stunCooldown--;
        if( this.jetpackCooldown < this.jetpackCooldownMax && !this.jetpacked ) this.jetpackCooldown += 1;

        // update cam follow position
        this.followPos.x = this.pos.x + this.centerOffsetX;
        this.followPos.y = this.pos.y + this.centerOffsetY;

        this.parent( this );
        return true;
    },

    handleCollision: function( colRes )
    {
        if( !this.inSpace && colRes.obj.type == "space" )
        {
            // release him... into SPACE
            this.gravity = 0;
            this.setFriction( 0.001, 0.001);
            this.inSpace = true;
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
        }
        if( colRes.obj.type == "missile" )
        {
            // DEAD, YOU ARE - DEAD
            colRes.obj.kill();
        }
    },

    checkInput: function()
    {
        var self = this;
        // not in space
        if( !this.inSpace )
        {
            if ( me.input.isKeyPressed( "jump" ) )
            {
                if ( !this.jumping && !this.falling )
                {
                    this.doJump();
                    //me.audio.play( "jump" );
                }
                // double jump
                else if ( this.haveDoubleJump && !this.doubleJumped )
                {
                    this.forceJump();
                    this.doubleJumped = true;
                    //spawnParticle( this.pos.x, this.pos.y, "doublejump", 144,
                    //    [ 0, 1, 2, 3, 4, 5 ], 3, this.z + 1 );
                    //me.audio.play( "doublejump" );
                }
            }

            if ( me.input.isKeyPressed( "left" ) )
            {
                this.doWalk( true );
                this.renderable.setCurrentAnimation( "Walk", function() {
                    self.renderable.setCurrentAnimation("Idle" );
                });
                this.curWalkLeft = true;
            }
            else if ( me.input.isKeyPressed( "right" ) )
            {
                this.doWalk( false );
                this.renderable.setCurrentAnimation( "Walk", function() {
                    self.renderable.setCurrentAnimation("Idle" );
                });
                this.curWalkLeft = false;
            }
        }
        // i'm floating in a most peculiar way
        else
        {
            var floatSpeed = 0.2;

            if( me.input.isKeyPressed( "up" ) )
            {
                this.vel.y -= floatSpeed * me.timer.tick;
            }
            if( me.input.isKeyPressed( "down" ) )
            {
                this.vel.y += floatSpeed * me.timer.tick;
            }
            if( me.input.isKeyPressed( "left" ) )
            {
                this.vel.x -= floatSpeed * me.timer.tick;
                this.flipX( (this.curWalkLeft = true ));
            }
            if( me.input.isKeyPressed( "right" ) )
            {
                this.vel.x += floatSpeed * me.timer.tick;
                this.flipX( (this.curWalkLeft = false ));
            }
        }

        // now try to jet pack by setting the speed to some constant.
        if ( me.input.isKeyPressed( "jetpack" ) )
        {
            this.fireJetpack();
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
        var available = this.jetpackCooldown > 0;
        if ( available )
        {
            this.jetpackCooldown -= 10;
            this.jetpacked = true;
            this.vel.normalize();
            var x = this.pos.x + 45,
                y = this.pos.y + 80,
                vx = this.vel.x,
                vy = this.vel.y;
            this.vel.x *= 10;
            this.vel.y *= 10;

            for( var p = 0; p < 10; p++ ) {
                var curStun = new PlayerParticle(
                    x,
                    y,
                    "jump",
                    48,
                    [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ],
                    4,
                    "stun",
                    false,
                    this.curWalkLeft
                );

                curStun.vel.y = vy + Math.sin(p*Math.PI/5);
                curStun.vel.x = vx + Math.cos(p*Math.PI/5);
                me.game.add( curStun, 4 );
            }
            me.game.sort();
        }
        return available;
    },

    stun: function()
    {
        var self = this;
        this.renderable.setCurrentAnimation( "ShootStun", function() {
            self.renderable.setCurrentAnimation("Idle" );
        });
        var posX = this.pos.x + (this.curWalkLeft ? 0 : 70),
            posY = this.pos.y + 50;
        var curStun = new PlayerParticle(
            posX,
            posY,
            "jump",
            48,
            [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ],
            4,
            "stun",
            false,
            this.curWalkLeft
        );
        curStun.vel.x = 5.0 * ( this.curWalkLeft ? -1.0 : 1.0 );
        me.game.add( curStun, 4 );
        me.game.sort();
        //me.audio.play( "stun" );
    },

    pushed: function( vel )
    {
        this.setVelocity( this.origVelocity.x * 10.0, this.origVelocity.y * 10.0 );
        this.vel.x += 10.0 * vel.x;
        // flicker & set vel back to orig vel on end
        this.renderable.flicker( this.pushTimerMax,
            (function() { this.setVelocity( this.origVelocity.x, this.origVelocity.y ); }).bind(this) );
        this.pushTimer = this.pushTimerMax;
    }

    /*updateStunPos: function()
    {

    }*/
});

var PlayerParticle = me.ObjectEntity.extend(
{
    init: function( x, y, sprite, spritewidth, frames, speed, type, collide, flip, spriteheight, noAnimation )
    {
        var settings = new Object();
        settings.image = sprite;
        settings.spritewidth = spritewidth;
        settings.spriteheight = spriteheight || spritewidth;

        this.parent( x, y, settings );

        this.gravity = 0;

        this.renderable.animationspeed = speed;

        if( !noAnimation )
        {
            this.renderable.addAnimation( "play", frames );
            this.renderable.setCurrentAnimation( "play",
                (function() { me.game.remove( this, true ); return false; }).bind(this) );
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
