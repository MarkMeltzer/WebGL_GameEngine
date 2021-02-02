var WorldObject = function(
    id,
    type,
    position,
    rotation,
    hasCollision = true,
    hasGravity = false
) {
    this.id = id;
    this.type = type;

    // state
    this.position = position;
    this.velocity = [0, 0, 0];
    this.rotation = rotation;
    this.isColliding = false;
   
    // properties
    this.hasCollision = hasCollision;
    this.hasGravity = hasGravity;

    this.model = null;
}

/**
 * Returns the Axis-aligned bounding box in world space.
 * 
 * @return {object} the AABB object with world space bounds.
 */
WorldObject.prototype.getWorldSpaceAABB = function() {
    if (!this.model.modelSpaceAABB) {
        console.log("Error while getting worldspace AABB for model " + this.id +
                    ": No modelspace AABB set.");
        return;
    }

    return {
        "minX" : this.model.modelSpaceAABB.minX + this.position[0],
        "maxX" : this.model.modelSpaceAABB.maxX + this.position[0],
        "minY" : this.model.modelSpaceAABB.minY + this.position[1],
        "maxY" : this.model.modelSpaceAABB.maxY + this.position[1],
        "minZ" : this.model.modelSpaceAABB.minZ + this.position[2],
        "maxZ" : this.model.modelSpaceAABB.maxZ + this.position[2],
    }
}