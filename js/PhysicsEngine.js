var PhysicsEngine = function() {
    // here is where I would put all my global physics settings and properties
    // if I had any.
    this.gravity = 0.03;
    this.frictionFactor = 0.5;
    this.floorHeight = 0;

    this.scene = null;
}

PhysicsEngine.prototype.setScene = function(scene) {
    this.scene = scene;
}

PhysicsEngine.prototype.updateCollisions = function(deltaTime) {
    // reset collision for all objects
    for (let id in this.scene.worldObjects) {
        this.scene.worldObjects[id].isColliding = false;
    }


    // for each world object with collision
    // TODO make function to generate actual combinations (no repetitions)
    for (let id1 in this.scene.worldObjects) {
        const worldObject1 = this.scene.worldObjects[id1];
        
        if (!worldObject1.hasCollision || !worldObject1.AABB || worldObject1.isImmovable) {
            continue;
        }

        // compare object with all other objects in the scene
        for (let id2 in this.scene.worldObjects) {
            // don't compare object with itself
            if (id2 == id1) {
                continue;
            }

            const worldObject2 = this.scene.worldObjects[id2];

            if (!worldObject2.hasCollision || !worldObject2.AABB) {
                continue;
            }

            const collisionResult = this.checkCollision(worldObject1, worldObject2);
            if (collisionResult.colliding) {
                worldObject1.isColliding = true;
                worldObject2.isColliding = true;


                // find the axis of smallest penetration
                var minIndex = 0;
                var minPenDepth = Number.MAX_VALUE;
                for (var i = 0; i < 3; i++) {
                    if (Math.abs(collisionResult.penDepth[i]) <= minPenDepth) {
                        minPenDepth = Math.abs(collisionResult.penDepth[i]);
                        minIndex = i;
                    }
                }

                // stop the object moving in the penetration direction
                worldObject1.velocity[minIndex] = 0;
                
                // move the object back outside the object its penetrating
                if (worldObject2.isImmovable) {
                    worldObject1.position[minIndex] += collisionResult.penDepth[minIndex];
                } else {
                    // if both objects can move, spread the force accros both objects
                    worldObject1.position[minIndex] += collisionResult.penDepth[minIndex] / 2;
                    worldObject2.position[minIndex] -= collisionResult.penDepth[minIndex] / 2;
                }

                // if the collision was in the y-direction, the object has landed
                // on something and is no longer airborne
                if (minIndex == 1) {
                    worldObject1.airborne = false;
                }
            }
        }
    }
}

PhysicsEngine.prototype.checkCollision = function(object1, object2) {
    const AABB1 = object1.getWorldSpaceAABBBounds();
    const AABB2 = object2.getWorldSpaceAABBBounds();

    // x-axis
    const xBMaxAMin = AABB2.maxX - AABB1.minX;
    const xAMaxBMin = AABB1.maxX - AABB2.minX;
    const xOverlap = (xBMaxAMin >= 0 && xAMaxBMin >= 0);
    const xPenDepth = (xBMaxAMin <= xAMaxBMin) ? xBMaxAMin : -xAMaxBMin;

    // y-axis
    const yBMaxAMin = AABB2.maxY - AABB1.minY;
    const yAMaxBMin = AABB1.maxY - AABB2.minY;
    const yOverlap = (yBMaxAMin >= 0 && yAMaxBMin >= 0);
    const yPenDepth = (yBMaxAMin <= yAMaxBMin) ? yBMaxAMin : -yAMaxBMin;

    // z-axis
    const zBMaxAMin = AABB2.maxZ - AABB1.minZ;
    const zAMaxBMin = AABB1.maxZ - AABB2.minZ;
    const zOverlap = (zBMaxAMin >= 0 && zAMaxBMin >= 0);
    const zPenDepth = (zBMaxAMin <= zAMaxBMin) ? zBMaxAMin : -zAMaxBMin;

    return {
        colliding: (xOverlap && yOverlap && zOverlap),
        penDepth : [xPenDepth, yPenDepth, zPenDepth]
    }
}

PhysicsEngine.prototype.updateDynamics = function(deltaTime) {
    for (let id in this.scene.worldObjects) {
        const obj = this.scene.worldObjects[id];

        if (obj.isImmovable) {
            continue;
        }

        // update position
        obj.position[0] += obj.velocity[0];
        obj.position[1] += obj.velocity[1];
        obj.position[2] += obj.velocity[2];

        // update object space vectors from rotation
        if (!arrayEquals(obj.newRotation, obj.rotation)) {
            obj.front[0] = Math.cos(glMatrix.toRadian(obj.newRotation[1])) * Math.cos(glMatrix.toRadian(obj.newRotation[0]));
            obj.front[1] = Math.sin(glMatrix.toRadian(obj.newRotation[0]));
            obj.front[2] = Math.sin(glMatrix.toRadian(obj.newRotation[1])) * Math.cos(glMatrix.toRadian(obj.newRotation[0]));
            obj.updateSpaceVectors();

            obj.rotation = obj.newRotation.slice();
        }
        
        // update velocity
        obj.velocity[0] *= this.frictionFactor;
        if (obj.flying) {obj.velocity[1] *= this.frictionFactor;}
        obj.velocity[2] *= this.frictionFactor;
        
        // apply gravity
        if (!obj.flying){
            obj.velocity[1] -= this.gravity;
        }
    }
}

PhysicsEngine.prototype.update = function(deltaTime) {
    this.updateDynamics(deltaTime);
    this.updateCollisions(deltaTime);
}