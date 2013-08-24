var ZeroGravityZone = me.ObjectEntity.extend({
    init: function( x, y, settings ) {
        this.parent( x, y, settings );
        this.collidable = true;
        this.gravity = 0;
        this.type = 'space';
    },
});
