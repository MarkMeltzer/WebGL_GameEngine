class Model {
    constructor(
        gl,
        id,
        mesh = null,
        material = null
    ) {
        this.gl = gl;
        this.id = id;

        this.mesh = mesh;
        this.material = material;

        this.renderSettings = {
            render: true,
            castShadow: true,
            recieveShadow: true,
            recieveLighting: true
        };

        this.animation = {
            animateRot: false,
            rotAxis: [0, 1, 0],
            rotSpeedFactor: 1,
            animateTrans: false
        };
    }

    /**
     * Creates Axis-aligned bounding box from the mesh of the current mesh in
     * model space.
     */
    getModelAABB() {
        if (!this.mesh) {
            console.log("Error while creating AABB for model: No" + 
                        " mesh set.")
            return;
        }

        var minX = Infinity;
        var maxX = -Infinity;
        var minY = Infinity;
        var maxY = -Infinity;
        var minZ = Infinity;
        var maxZ = -Infinity;
        
        for (var i = 0; i < this.mesh.vertPositions.length; i += 3) {
            const x = this.mesh.vertPositions[i];
            const y = this.mesh.vertPositions[i+1];
            const z = this.mesh.vertPositions[i+2];

            if (x < minX) {
                minX = x;
            } else if (x > maxX) {
                maxX = x;
            }

            if (y < minY) {
                minY = y;
            } else if (y > maxY) {
                maxY = y;
            }

            if (z < minZ) {
                minZ = z;
            } else if (z > maxZ) {
                maxZ = z;
            }
        }

        return {
            "minX" : minX,
            "maxX" : maxX,
            "minY" : minY,
            "maxY" : maxY,
            "minZ" : minZ,
            "maxZ" : maxZ,
        }
    }

    toJSON() {
        const returnObj = {
            "id" : this.id,
            "render" : this.renderSettings.render,
            "castShadow" : this.renderSettings.castShadow,
            "recieveShadow" : this.renderSettings.recieveShadow,
            "recieveLighting" : this.renderSettings.recieveLighting,
            "animateRot" : this.animation.animateRot,
            "rotAxis" : this.animation.rotAxis,
            "rotSpeedFactor" : this.animation.rotSpeedFactor,
            "animateTrans" : this.animation.animateTrans
        }

        if (this.material) {
            returnObj["material"] = this.material.id;
        }

        if (this.mesh) {
            returnObj["mesh"] = this.mesh.id;
        }

        return returnObj;
    }
}