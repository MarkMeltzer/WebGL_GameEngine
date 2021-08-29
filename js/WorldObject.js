class WorldObject {
    constructor(
        id,
        type,
        position = [0, 0, 0],
        rotation = [0, -90, 0],
        scale = [1, 1, 1],
        isImmovable = true,
        hasCollision = true,
        hasGravity = true
    ) {
        this.id = id;
        this.type = type;

        // state
        this.position = position;
        this.scale = scale;
        this.velocity = [0, 0, 0];
        this.rotation = rotation;
        this.newRotation = rotation.slice();
        this.isColliding = false;
        this.airborne = true;
        this.flying = false;
        this.selected = false;

        // WorldObject space
        this.front = vec3.fromValues(0, 0, -1);
        this.right = vec3.create();
        this.up = vec3.create();
        this.updateSpaceVectors();
    
        // properties
        this.hasCollision = hasCollision;
        this.hasGravity = hasGravity;
        this.isImmovable = isImmovable;

        this.model = null;
        this.AABB = null;
    }
    
    /**
     * Returns the Axis-aligned bounding box in world space.
     * 
     * @return {object} the AABB object with world space bounds.
     */
    getWorldSpaceAABBBounds() {
        if (!this.AABB) {
            console.log("Error while getting worldspace AABB for model " + this.id +
                        ": No modelspace AABB set.");
            return;
        }

        return {
            "minX" : this.AABB.bounds.minX + this.position[0],
            "maxX" : this.AABB.bounds.maxX + this.position[0],
            "minY" : this.AABB.bounds.minY + this.position[1],
            "maxY" : this.AABB.bounds.maxY + this.position[1],
            "minZ" : this.AABB.bounds.minZ + this.position[2],
            "maxZ" : this.AABB.bounds.maxZ + this.position[2],
        }
    }

    // TODO: add function comment
    updateSpaceVectors() {
        vec3.normalize(this.front, this.front);

        vec3.cross(this.right, this.front, [0, 1, 0]);
        vec3.normalize(this.right, this.right);

        vec3.cross(this.up, this.right, this.front);
        vec3.normalize(this.up, this.up);
    }

    toJSON() {
        const returnObj = {
            "id" : this.id,
            "type" : this.type,
            "position" : this.position,
            "velocity" : this.velocity,
            "rotation" : this.rotation,
            "scale" : this.scale,
            "hasCollision" : this.hasCollision,
            "hasGravity" : this.hasGravity,
            "isImmovable" : this.isImmovable,
        }

        if (this.model == null) {
            returnObj["model"] = "none";
        } else if (this.model.id != "defaultModel") {
            returnObj["model"] = this.model.id;
        }

        if (this.AABB == null) {
            returnObj["AABB"] = "none";
        } else {
            returnObj["AABB"] = this.AABB;
        }

        return returnObj;
    }
}