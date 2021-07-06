var Scene = function() {
    this.camera = null;
    this.worldObjects = {};
    this.assets = {
        "meshes" : {},
        "textures" : {},
        "materials" : {},
        "models" : {}
    }
    this.controller = null;
    this.light = [20,14,10];
}