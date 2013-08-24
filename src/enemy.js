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

        this.setVelocity( 1.0, 1.0 );
        this.setFriction( 0.2, 0.2 );

        var losSettings = {};

        this.sight = new LineOfSight( this.pos.x, this.pos.y, losSettings );
        me.game.add( this.sight, 5 ); // TODO fix this Z boolsheet (i think this.z is undefined before it gets added/sorted itself afterwards?)
        me.game.sort();

        this.walkCounter = 0;
        this.walkCounterMax = 100;
        this.walkRight = true;
    },

    update: function()
    {
        var oldVelX = this.vel.x;

        var lastWalkRight = this.walkRight;
        this.walkCounter++;
        if( this.walkCounter >= this.walkCounterMax )
        {
            this.walkRight = !this.walkRight;
            this.walkCounter = 0;
        }

        this.doWalk( !this.walkRight );

        this.updateMovement();
        var res = me.game.collide( this );

        // set proper flame/laser positions
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

        var move = ( this.vel.x || this.vel.y );
        if ( move )
            this.parent( this );
        return move;
    }
});

var LineOfSight = me.ObjectEntity.extend({
    init: function( x, y, settings )
    {
        settings.image        = settings.image        || 'los';
        settings.spritewidth  = settings.spritewidth  || 192;
        settings.spriteheight = settings.spriteheight || 32;
        this.parent( x, y, settings );

        this.type = "los";
    },

    checkCollision: function( obj )
    {
        if ( obj == me.game.player ) {
            return this.parent( obj );
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
