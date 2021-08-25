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

    toJSON() {
        const returnObj = {
            "id" : this.id,
            "scale" : this.scale,
            "specularExponent" : this.specularExponent,
            "specularStrength" : this.specularStrength,
            "useDiffuse" : this.useDiffuse,
            "useNormal" : this.useNormal,
        }

        if (this.diffuseTexture) {
            returnObj["diffuseTexture"] = this.diffuseTexture.id;
        }

        if (this.normalTexture) {
            returnObj["normalTexture"] = this.normalTexture.id;
        }

        return returnObj;
    }
}