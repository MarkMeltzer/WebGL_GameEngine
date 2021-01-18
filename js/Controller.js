var Controller = function() {
    this.position = [0,0,0];
    this.worldUp = [0,1,0];
    this.front = [0,0,-1];
    this.updateVectors();

    this.yaw = -90;
    this.pitch = 0;
    this.velocity = vec3.fromValues(0,0,0);

    // whether the controller is currently airborne
    this.airborne = true;

    // the object which is parented to this controller
    this.child = null;
    
    // controller settings
    this.flying = false;
    this.movementSpeed = 10;
    this.turnSpeed = 6;
    this.jumpHeight = 30;
    this.gravity = 0.03;
    this.frictionFactor = 0.5;

    // Bind 'this' in the methods to this camera object because javascript
    this.moveLeft = this.moveLeft.bind(this);
    this.moveRight = this.moveRight.bind(this);
    this.moveForward = this.moveForward.bind(this);
    this.moveBackward = this.moveBackward.bind(this);
    this.turn = this.turn.bind(this);
    this.jump = this.jump.bind(this);
}

/**
 * Normalizes the front vector and then updates the right and
 * and up vectors using according to the new front vector.
 */
Controller.prototype.updateVectors = function() {
    const front = vec3.fromValues(this.front[0], this.front[1], this.front[2]);
    vec3.normalize(front, front);
    this.front = front;

    const right = vec3.create();
    vec3.cross(right, this.front, this.worldUp);
    vec3.normalize(right, right);
    this.right = right;

    const up = vec3.create();
    vec3.cross(up, this.right, this.front);
    vec3.normalize(up, up);
    this.up = up;
}

Controller.prototype.moveForward = function(deltaTime) {
    const change = this.movementSpeed * deltaTime;
    this.velocity[0] += this.front[0] * change;
    this.velocity[2] += this.front[2] * change;

    // if flying, allow moving in the y direction
    if (this.flying) {
        this.velocity[1] += this.front[1] * change;
    }
}

Controller.prototype.moveBackward = function(deltaTime) {
    const change = this.movementSpeed * deltaTime;
    this.velocity[0] -= this.front[0] * change;
    this.velocity[2] -= this.front[2] * change;

    // if flying, allow moving in the y direction
    if (this.flying) {
        this.velocity[1] -= this.front[1] * change;
    }
}

Controller.prototype.moveRight = function(deltaTime) {
    const change = this.movementSpeed * deltaTime;
    this.velocity[0] += this.right[0] * change;
    this.velocity[2] += this.right[2] * change;

    // if flying, allow moving in the y direction
    if (this.flying) {
        this.velocity[1] += this.right[1] * change;
    }
}

Controller.prototype.moveLeft = function(deltaTime) {
    const change = this.movementSpeed * deltaTime;
    this.velocity[0] -= this.right[0] * change;
    this.velocity[2] -= this.right[2] * change;

    // if flying, allow moving in the y direction
    if (this.flying) {
        this.velocity[1] -= this.right[1] * change;
    }
}

Controller.prototype.jump = function(deltaTime) {
    if (!this.airborne && !this.flying) {
        this.airborne = true;

        this.velocity[1] += this.jumpHeight * deltaTime;
    }
}

Controller.prototype.turn = function(mouseChange, deltaTime) {
    const xChange = mouseChange[0] * this.turnSpeed * deltaTime;
    const yChange = mouseChange[1] * this.turnSpeed * deltaTime;

    this.yaw += xChange;
    this.pitch -= yChange;
    if (this.pitch < -89) {
        this.pitch = -89;
    }
}

Controller.prototype.update = function() {
    // update position
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
    this.position[2] += this.velocity[2];
    
    // add fake collision with the ground
    if (this.position[1] <= 0 && !this.flying) {
        this.position[1] = 0;
        this.airborne = false;
        this.velocity[1] = 0;
    }

    // update velocity
    this.velocity[0] *= this.frictionFactor;
    if (this.flying) {this.velocity[1] *= this.frictionFactor;}
    this.velocity[2] *= this.frictionFactor;

    // apply gravity
    if (this.airborne && !this.flying){
        this.velocity[1] -= this.gravity;
    }

    // update rotations
    this.front[0] = Math.cos(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
    this.front[1] = Math.sin(glMatrix.toRadian(this.pitch));
    this.front[2] = Math.sin(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
    this.updateVectors();

    // propagate the changes to the child object
    this.updateChild();
}

Controller.prototype.parent = function(child) {
    // decouple the old child
    if (this.child) {
        this.child.position = vec3.clone(this.position);
        this.child.front = vec3.clone(this.front);
        this.child.right = vec3.clone(this.right);
        this.child.up = vec3.clone(this.up);
    }

    // set the controller to be at the location of the child
    this.position = child.position;
    
    // couple the new child
    this.child = child;
}

Controller.prototype.updateChild = function() {
    if (this.child) {
        this.child.position = this.position;
        this.child.front = this.front;
        this.child.right = this.right;
        this.child.up = this.up;
    }
}

Controller.prototype.startFlying = function() {
    this.flying = true;
}

Controller.prototype.stopFlying = function() {
    this.flying = false;
    this.airborne = true;
}