class WorldObject {
    constructor(
        id,
        type,
        position = [0, 0, 0],
        rotation = [0, -90, 0],
        isImmovable = true,
        hasCollision = true,
        hasGravity = true
    ) {
        this.id = id;
        this.type = type;

        // state
        this.position = position;
        this.velocity = [0, 0, 0];
        this.rotation = rotation;
        this.newRotation = rotation.slice();
        this.isColliding = false;
        this.airborne = true;
        this.flying = false;

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

    // setModel(model) {
    //     this.model = model;
        
    //     if (model.mesh) {
    //         this.AABB.setBounds(model.getModelAABB());
    //     }
    // }

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

    updateSpaceVectors() {
        vec3.normalize(this.front, this.front);

        vec3.cross(this.right, this.front, [0, 1, 0]);
        vec3.normalize(this.right, this.right);

        vec3.cross(this.up, this.right, this.front);
        vec3.normalize(this.up, this.up);
    }
}