var ZeroGravityZone = me.ObjectEntity.extend({
    init: function( x, y, settings ) {
        this.parent( x, y, settings );
        this.collidable = true;
        this.gravity = 0;
        this.type = 'space';
    }
});

var PodZone = me.ObjectEntity.extend({
    init: function( x, y, settings ) {
        this.parent( x, y, settings );
        this.collidable = true;
        this.type = 'pod';
    }
});

var Trash = me.ObjectEntity.extend({
    init: function( x, y, settings ) {
        settings.image        = settings.image        || 'trash';
        settings.spritewidth  = settings.spritewidth  || 48;
        settings.spriteheight = settings.spriteheight || 48;
        this.parent( x, y, settings );

        var tType = Math.floor(Math.random() * 4);
        var frames = [];
        frames.push( tType );
        this.renderable.addAnimation("idle", frames, 1 );
        this.renderable.setCurrentAnimation( "idle" );

        this.collidable = true;
        this.gravity = 0;
        this.type = 'trash';
    }
});
