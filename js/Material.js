class Material {
    constructor(id, diffuseTexture = null, normalTexture = null) {
        this.id = id;
        this.diffuseTexture = diffuseTexture;
        this.normalTexture = normalTexture;
        this.scale = 1.0;
    }
}