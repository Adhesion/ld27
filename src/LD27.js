var jsApp = {
    onload: function() {
        if ( !me.video.init( 'canvas', 800, 600) ) {
            alert( "Sorry, it appears your browser does not support HTML5." );
            return;
        }

        me.audio.init( "mp3,ogg" );

        me.loader.onload = this.loaded.bind( this );
        me.loader.preload( GameResources );

        me.state.change( me.state.LOADING );
    },

    loaded: function() {
        me.state.set( me.state.INTRO, new RadmarsScreen() );
        me.state.set( me.state.MENU, new TitleScreen() );
        me.state.set( me.state.PLAY, new PlayScreen() );
        me.state.set( me.state.GAMEOVER, new GameOverScreen() );

        me.state.change( me.state.INTRO );
        //me.state.change( me.state.MENU );
        //me.state.change( me.state.GAMEOVER );
        //me.state.change( me.state.PLAY );
        me.debug.renderHitBox = false;

		
        me.entityPool.add( "player", Player );
		
        me.entityPool.add( "enemy", Enemy );
        me.entityPool.add( "mainframe", Mainframe );
        me.entityPool.add( "pusherbot", PusherBot );
        me.entityPool.add( "laserbot", LaserBot );
        me.entityPool.add( "missilebot", MissileBot );
        me.entityPool.add( "fox", Fox );
        me.entityPool.add( "zerogravity", ZeroGravityZone );
        me.entityPool.add( "pod", PodZone );
        me.entityPool.add( "trash", Trash );

        me.entityPool.add( "switch", Switch );
        me.entityPool.add( "door", Door );

        me.entityPool.add( "LevelChanger", LevelChanger );
    }
};

var PlayScreen = me.ScreenObject.extend(
{
    init: function()
    {
        this.parent( true );
    },

    getLevel: function()
    {
        return this.parseLevel( me.levelDirector.getCurrentLevelId() );
    },

    parseLevel: function( input )
    {
        var re = /level(\d+)/;
        var results = re.exec( input );
        return results[1];
    },

    /** Update the level display & music. Called on all level changes. */
    changeLevel: function( level )
    {
        // this only gets called on start?
        me.audio.stopTrack();
              me.game.sort();
        this.doors = [];
        me.game.HUD.removeItem( "spaceTimer" ); // have to remove old one if so, stupid
        me.game.viewport.fadeOut( '#000000', 1000, function() {
            // AWFUL SHIT
            if( level != "testlevel" && level != "gravity" )
            {
                me.audio.playTrack( level );
            }
            me.game.HUD.addItem( "spaceTimer", new CountDown());
        });

    },

    // this will be called on state change -> this
    onResetEvent: function()
    {
        me.game.trashCount = 0;
        me.game.frameCounter = 0;
        me.game.addHUD( 0, 0, me.video.getWidth(), me.video.getHeight() );
		me.game.HUD.addItem( "hp", new HPDisplay( 700, 10 ) );
        // Some HUD shit here?
        var level =  location.hash.substr(1) || "level1" ;
        me.levelDirector.loadLevel( level );
        this.changeLevel( level );
    },

    onDestroyEvent: function()
    {
        me.audio.stopTrack();
    },

    update: function()
    {
        me.game.frameCounter++;
    },

    getDoor: function( doorID )
    {
        var index;
        var ret;
        for( index = 0; index < this.doors.length; index++ )
        {
            if( this.doors[index].doorID === doorID )
            {
                ret = this.doors[index];
            }
        }
        return ret;
    }
});

var HPDisplay = me.HUD_Item.extend(
{
    init: function( x, y )
    {	
		this.parent( x, y );
		this.hpIcon = me.loader.getImage("heart");
    },
    
    draw: function( context, x, y )
    {
		var player = me.game.player;//me.game.getEntityByName("player")[0];
		
		if( player ){
			var offsetX = 0;  
			var offsetY = 0; 
			
			for (var i=0; i<player.hp; i++){
				context.drawImage( this.hpIcon, this.pos.x + x + offsetX, this.pos.y + y + offsetY );
				offsetX-=48;
			}
		}
	
    }
});

var TitleScreen = me.ScreenObject.extend({
    init: function() {
        this.parent( true );
        this.ctaFlicker = 0; 
    },

    onResetEvent: function() {
        if( ! this.cta ) {
            this.background= me.loader.getImage("intro");
            this.cta = me.loader.getImage("introcta");
        }

        me.input.bindKey( me.input.KEY.ENTER, "enter", true );
        me.audio.playTrack( "intro" );
    },

    update: function() {
        if( me.input.isKeyPressed('enter')) {
            me.state.change(me.state.PLAY);
        }

        // have to force redraw :(
        me.game.repaint();
    },

    draw: function(context) {
        context.drawImage( this.background, 0, 0 );
        this.ctaFlicker++;
		if( this.ctaFlicker > 20 ) 
		{
            context.drawImage( this.cta, 74*4, 138*4 );
			if( this.ctaFlicker > 40 ) this.ctaFlicker = 0;  
		}
    },

    onDestroyEvent: function() {
        me.input.unbindKey(me.input.KEY.ENTER);
        me.audio.stopTrack();
        //me.audio.play( "ready" );
    }
});


var GameOverScreen = me.ScreenObject.extend(
{
    init: function()
    {
        me.game.disableHUD();
        this.parent( true );
        this.font = new me.BitmapFont("32x32_font", 32);
        this.font.set( "left" );
    },
    
    onResetEvent: function()
    {
        me.input.bindKey( me.input.KEY.ENTER, "enter", true );
        if ( !this.background )
        {
            if( me.game.goodEnding )
            {
                this.background = me.loader.getImage( "gameover_good" );
                me.audio.stopTrack();
                me.audio.playTrack( "intro" );
            }
            else
            {
                this.background = me.loader.getImage( "gameover" );
                me.audio.stopTrack();
                me.audio.play( "badend" );
            }
        }
        this.timeString = "TIME: " + ((me.game.frameCounter/60.0).toFixed(1)).toString();
    },

    update: function()
    {
        if( me.input.isKeyPressed('enter')) {
            me.audio.stopTrack();
            me.state.change(me.state.INTRO);
        }

        return this.parent();
    },
    
    draw: function( context, x, y )
    {
        context.drawImage( this.background, 0, 0 );
        this.font.draw(
            context,
            "" + me.game.trashCount,
            412,
            382
        );
        this.font.draw(
            context,
            this.timeString,
            240,
            5
        );
    }
});

var RadmarsScreen = me.ScreenObject.extend({
    init: function() {
        this.parent( true );
        this.counter = 0;
    },

    onResetEvent: function() {
        if( ! this.title ) {
            this.bg= me.loader.getImage("intro_bg");
            this.glasses1 = me.loader.getImage("intro_glasses1"); // 249 229
            this.glasses2 = me.loader.getImage("intro_glasses2"); // 249 229
            this.glasses3 = me.loader.getImage("intro_glasses3"); // 249 229
            this.glasses4 = me.loader.getImage("intro_glasses4"); // 249 229
            this.text_mars = me.loader.getImage("intro_mars"); // 266 317
            this.text_radmars1 = me.loader.getImage("intro_radmars1"); // 224 317
            this.text_radmars2 = me.loader.getImage("intro_radmars2");
        }

        me.input.bindKey( me.input.KEY.ENTER, "enter", true );
        me.audio.playTrack( "radmarslogo" );
    },

    update: function() {
        if( me.input.isKeyPressed('enter')) {
            me.state.change(me.state.MENU);
        }
        if ( this.counter < 350 ) {
            this.counter++;
        }
        else{
            me.state.change(me.state.MENU);
        }
        // have to force redraw :(
        me.game.repaint();
    },

    draw: function(context) {
        context.drawImage( this.bg, 0, 0 );
        if( this.counter < 130) context.drawImage( this.text_mars, 266+80, 317+60 );
        else if( this.counter < 135) context.drawImage( this.text_radmars2, 224+80, 317+60 );
        else if( this.counter < 140) context.drawImage( this.text_radmars1, 224+80, 317+60 );
        else if( this.counter < 145) context.drawImage( this.text_radmars2, 224+80, 317+60 );
        else if( this.counter < 150) context.drawImage( this.text_radmars1, 224+80, 317+60 );
        else if( this.counter < 155) context.drawImage( this.text_radmars2, 224+80, 317+60 );
        else if( this.counter < 160) context.drawImage( this.text_radmars1, 224+80, 317+60 );
        else if( this.counter < 165) context.drawImage( this.text_radmars2, 224+80, 317+60 );
        else context.drawImage( this.text_radmars1, 224+80, 317+60 );

        if( this.counter < 100) context.drawImage( this.glasses1, 249+80, 229*(this.counter/100)+60 );
        else if( this.counter < 105) context.drawImage( this.glasses2, 249+80, 229+60 );
        else if( this.counter < 110) context.drawImage( this.glasses3, 249+80, 229+60 );
        else if( this.counter < 115) context.drawImage( this.glasses4, 249+80, 229+60 );
        else context.drawImage( this.glasses1, 249+80, 229+60 );
    },

    onDestroyEvent: function() {
        me.input.unbindKey(me.input.KEY.ENTER);
        me.audio.stopTrack();
    }
});

window.onReady( function() {
    jsApp.onload();
});

/** WHen colliding with the end of the level do things to swap the levels. */
var LevelChanger = me.LevelEntity.extend({
    init: function( x, y, settings ) {
        settings.fade = '#000000';
        settings.duration = 1000;
        this.parent( x, y, settings );
    },

    onCollision : function()
    {
        this.collidable = false;
        return this.parent();
    },

    /** Dirty hack. I don't think they intended to expose onFadeComplete. */
    onFadeComplete : function () {
        this.parent();
        me.state.current().changeLevel( this.gotolevel );
    },

    goTo: function ( level ) {
        // hack bad. bad hack TODO
        if ( this.gotolevel == "gameover" ) {
            me.state.change( me.state.GAMEOVER );
            return;
        }
        this.parent( level );
    }
});
