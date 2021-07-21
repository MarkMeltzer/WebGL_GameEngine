// TODO: use class syntax
var Controller = function() {
    // the object which is parented to this controller
    this.child = null;
    this.childMovability = null;
    
    // controller settings
    this.movementSpeed = 10;
    this.turnSpeed = 6;
    this.jumpHeight = 30;

    // Bind 'this' in the methods to this camera object because javascript
    this.moveLeft = this.moveLeft.bind(this);
    this.moveRight = this.moveRight.bind(this);
    this.moveForward = this.moveForward.bind(this);
    this.moveBackward = this.moveBackward.bind(this);
    this.turn = this.turn.bind(this);
    this.jump = this.jump.bind(this);
}

// TODO: add function comment
Controller.prototype.moveForward = function(deltaTime) {
    const change = this.movementSpeed * deltaTime;
    this.child.velocity[0] += this.child.front[0] * change;
    this.child.velocity[2] += this.child.front[2] * change;

    // if flying, allow moving in the y direction
    if (this.child.flying) {
        this.child.velocity[1] += this.child.front[1] * change;
    }
}

// TODO: add function comment
Controller.prototype.moveBackward = function(deltaTime) {
    const change = this.movementSpeed * deltaTime;
    this.child.velocity[0] -= this.child.front[0] * change;
    this.child.velocity[2] -= this.child.front[2] * change;

    // if flying, allow moving in the y direction
    if (this.child.flying) {
        this.child.velocity[1] -= this.child.front[1] * change;
    }
}

// TODO: add function comment
Controller.prototype.moveRight = function(deltaTime) {
    const change = this.movementSpeed * deltaTime;
    this.child.velocity[0] += this.child.right[0] * change;
    this.child.velocity[2] += this.child.right[2] * change;

    // if flying, allow moving in the y direction
    if (this.child.flying) {
        this.child.velocity[1] += this.child.right[1] * change;
    }
}

// TODO: add function comment
Controller.prototype.moveLeft = function(deltaTime) {
    const change = this.movementSpeed * deltaTime;
    this.child.velocity[0] -= this.child.right[0] * change;
    this.child.velocity[2] -= this.child.right[2] * change;

    // if flying, allow moving in the y direction
    if (this.child.flying) {
        this.child.velocity[1] -= this.child.right[1] * change;
    }
}

// TODO: add function comment
Controller.prototype.jump = function(deltaTime) {
    if (!this.child.airborne && !this.child.flying) {
        this.child.airborne = true;

        this.child.velocity[1] += this.jumpHeight * deltaTime;
    }
}

// TODO: add function comment
Controller.prototype.turn = function(mouseChange, deltaTime) {
    const xChange = mouseChange[0] * this.turnSpeed * deltaTime;
    const yChange = mouseChange[1] * this.turnSpeed * deltaTime;

    this.child.newRotation[1] += xChange;
    this.child.newRotation[0] -= yChange;
    if (this.child.newRotation[0] < -89) {
        this.child.newRotation[0] = -89;
    }
}

// TODO: add function comment
Controller.prototype.parent = function(child) {
    // decouple the old child
    if (this.child) {
        this.child.isImmovable = this.childImmovability;
    }

    // couple the new child
    this.childImmovability = child.isImmovable;
    this.child = child;
    this.child.isImmovable = false;
}