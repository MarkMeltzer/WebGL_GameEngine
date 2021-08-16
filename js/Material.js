class Material {
    constructor(id, diffuseTexture = null, normalTexture = null) {
        this.id = id;
        this.diffuseTexture = diffuseTexture;
        this.normalTexture = normalTexture;
        
        this.scale = 1.0;
        this.specularExponent = 32.0;
        this.specularStrength = 0.0;
        this.diffuseStrength = 1.0;
        this.useDiffuse = true;
        this.useNormal = true;
    }
}