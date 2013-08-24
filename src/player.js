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
        this.parent( x, y, settings );

        this.origVelocity = new me.Vector2d( 7.0, 11.0 );
        this.setVelocity( this.origVelocity.x, this.origVelocity.y );
        this.origGravity = 0.3;
        this.gravity = this.origGravity;
        this.setFriction( 0.25, 0.1 );

        this.hp = 10;

        /*this.wallStuckGravity = 0.1;
        this.wallStuck = false;
        this.wallStuckCounter = 0;*/

        this.collidable = true;

        this.inSpace = false;

        this.haveDoubleJump = true;

        this.centerOffsetX = 72;
        this.centerOffsetY = 72;

        this.followPos = new me.Vector2d( this.pos.x + this.centerOffsetX,
            this.pos.y + this.centerOffsetY );

        me.game.viewport.follow( this.followPos, me.game.viewport.AXIS.BOTH );
        me.game.viewport.setDeadzone( me.game.viewport.width / 10, 1 );

        me.input.bindKey( me.input.KEY.UP, "up" );
        me.input.bindKey( me.input.KEY.DOWN, "down" );
        me.input.bindKey( me.input.KEY.LEFT, "left" );
        me.input.bindKey( me.input.KEY.RIGHT, "right" );
        me.input.bindKey( me.input.KEY.X, "jump", true );
        me.input.bindKey( me.input.KEY.C, "jetpack", true );

        me.game.player = this;
    },

    update: function()
    {
        if( this.hp > 0 ) {
            this.checkInput();
        }

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
        var colRes = me.game.collide( this );
        if( colRes )
        {
            if ( !this.inSpace && colRes.obj.type == "space" )
            {
                // space shit here
                this.inSpace = true;
            }
        }

        // update cam follow position
        this.followPos.x = this.pos.x + this.centerOffsetX;
        this.followPos.y = this.pos.y + this.centerOffsetY;

        this.parent( this );
        return true;
    },

    checkInput: function()
    {
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
            }
            else if ( me.input.isKeyPressed( "right" ) )
            {
                this.doWalk( false );
            }
        }
        // release him... into SPACE
        else
        {

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
    }
});
