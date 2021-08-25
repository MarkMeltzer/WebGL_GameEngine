class Scene {
    constructor() {
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

    toJSON() {
        return {
            "assets" : {
                "meshes" : Object.values(this.assets.meshes),
                "textures" : Object.values(this.assets.textures),
                "materials" : Object.values(this.assets.materials),
                "models" : Object.values(this.assets.models)
            },
            "worldObjects" : Object.values(this.worldObjects).filter(wO => wO.type != "camera")
        }
    }
}