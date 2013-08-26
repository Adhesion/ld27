/*
 * switch.js
 *
 * Defines the switch to open doors.
 *
 * @author Adhesion
 */

var Switch = me.ObjectEntity.extend({

    init: function( x, y, settings )
    {
        settings = settings || {};

        settings.image        = settings.image        || "switch";
        settings.spritewidth  = settings.spritewidth  || 48;
        settings.spriteheight = settings.spriteheight || 48;
        settings.collidable   = true;

        if( !settings.doorID ) {
            throw "Must set doorID for switch";
        }

        if( settings.flip )
        {
            this.flipX( true );
        }

        this.parent( x, y, settings );

        this.flipped = false;
        this.doorID = settings.doorID;

        this.alwaysUpdate = true;

        this.renderable.addAnimation( "off", [ 0 ] );
        this.renderable.addAnimation( "on", [ 1 ] );
        this.renderable.setCurrentAnimation( "off" );

        this.gravity = 0;

        this.font = new me.BitmapFont("16x16_font", 16);
        this.font.set( "center" );
    },

    onCollision: function( res, obj )
    {
        if( !this.flipped )
        {
            me.state.current().getDoor( this.doorID ).open();
            me.game.viewport.shake(10, 10, me.game.viewport.AXIS.BOTH);
            this.flipped = true;
            this.renderable.setCurrentAnimation( "on" );
            me.audio.play( "switch" );
        }
    },

    update: function()
    {
        if( this.flipped && !me.state.current().getDoor( this.doorID ).isOpen() )
        {
            this.flipped = false;
            this.renderable.setCurrentAnimation( "off" );
        }
        return this.parent( this );
    },

    draw: function( context )
    {
        if( this.flipped )
        {
            this.font.draw(
                context,
                "" + me.state.current().getDoor( this.doorID ).timeDisplay,
                this.pos.x + 24,
                this.pos.y - 16
            );
        }

        this.parent( context );
    }
});
