var PhysicsEngine = function() {
    // here is where I would put all my global physics settings and properties
    // if I had any.

    this.scene = null;
}

PhysicsEngine.prototype.setScene = function(scene) {
    this.scene = scene;
}

PhysicsEngine.prototype.updateScene = function() {
    // reset collision for all objects
    for (let id in this.scene.worldObjects) {
        this.scene.worldObjects[id].isColliding = false;
    }


    // for each world object with collision
    for (let id1 in this.scene.worldObjects) {
        const worldObject1 = this.scene.worldObjects[id1];
        
        if (!worldObject1.hasCollision || !worldObject1.model.modelSpaceAABB) {
            continue;
        }

        // compare object with all other objects in the scene
        for (let id2 in this.scene.worldObjects) {
            // don't compare object with itself
            if (id2 == id1) {
                continue;
            }

            const worldObject2 = this.scene.worldObjects[id2];

            if (!worldObject2.hasCollision || !worldObject2.model.modelSpaceAABB) {
                continue;
            }

            if (this.checkCollision(worldObject1, worldObject2)) {
                worldObject1.isColliding = true;
                worldObject2.isColliding = true;
            }
        }
    }
}

PhysicsEngine.prototype.checkCollision = function(object1, object2) {
    const AABB1 = object1.getWorldSpaceAABB();
    const AABB2 = object2.getWorldSpaceAABB();

    const collision = (
        AABB1.minX <= AABB2.maxX && AABB1.maxX >= AABB2.minX &&
        AABB1.minY <= AABB2.maxY && AABB1.maxY >= AABB2.minY &&
        AABB1.minZ <= AABB2.maxZ && AABB1.maxZ >= AABB2.minZ
    );

    return collision;
}