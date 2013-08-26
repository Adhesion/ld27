/*
 * door.js
 *
 * Defines the doors.
 *
 * @author Adhesion
 */

var Door = me.ObjectEntity.extend({

    init: function( x, y, settings )
    {
        settings = settings || {};
        settings.image        = settings.image || "door";
        settings.spritewidth = 48;
        settings.spriteheight = 144;

        if( !settings.doorID ) {
            throw "Must set doorID";
        }

        this.maxTime = 10.0;
        this.timeDisplay = 10.0;

        this.parent( x, y, settings );

        /*this.renderable.addAnimation( "closed", [ 0 ] );
        this.renderable.addAnimation( "open", [ 1 ] );
        this.renderable.setCurrentAnimation( "closed" );*/

        this.door = 1;
        this.gravity = 0;
        this.doorID = settings.doorID;
        this.collidable   = true;

        this.alwaysUpdate = true;

        this.font = new me.BitmapFont("16x16_font", 16);
        this.font.set( "center" );

        this.added = false;
    },

    isOpen: function()
    {
        return !this.collidable;
    },

    open: function()
    {
        this.timerStart = me.timer.getTime();
        this.collidable = false;
        this.renderable.alpha = 0.0;
        //this.renderable.setCurrentAnimation( "open" );
        me.audio.play( "dooropen" );
    },

    close: function()
    {
        this.collidable = true;
        this.renderable.alpha = 1.0;
        //this.renderable.setCurrentAnimation( "closed" );
        me.audio.play( "doorclose" );
    },

    updateTimer: function()
    {
        if( !this.added )
        {
            // state not valid in constructor now maybe?
            me.state.current().doors.push(this);
            this.added = true;
        }

        if( this.isOpen() )
        {
            this.timeDisplay = ( this.maxTime * 1000 - ( me.timer.getTime() - this.timerStart ) ) / 1000;
            this.timeDisplay = this.timeDisplay.toFixed( 1 );

            if( this.timeDisplay <= 0 ) {
                this.timeDisplay = 0;
                this.close();
            }
        }
    },

    update: function()
    {
        this.updateTimer();
        return this.parent( this );
    },

    draw: function( context )
    {
        if( this.isOpen() )
        {
            this.font.draw(
                context,
                "" + this.timeDisplay,
                this.pos.x + 24,
                this.pos.y - 16
            );
        }

        this.parent( context );
    }
});