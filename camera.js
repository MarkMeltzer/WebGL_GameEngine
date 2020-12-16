var Camera = function() {
    this.position = [0,0,10];
    this.worldUp = [0,1,0];
    this.yaw = -90;
    this.pitch = 0;
    this.front = [0,0,-1];
    this.movementSpeed = 0.1;
    this.turnSpeed = 2.5;

    // Bind 'this' in the methods to this camera object because javascript
    this.moveLeft = this.moveLeft.bind(this);
    this.moveRight = this.moveRight.bind(this);
    this.moveForward = this.moveForward.bind(this);
    this.moveBackward = this.moveBackward.bind(this);
    this.turnCamera = this.turnCamera.bind(this);

    this.updateVectors();
}

Camera.prototype.updateVectors = function() {
    const front = vec3.create();
    front[0] = Math.cos(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
    front[1] = Math.sin(glMatrix.toRadian(this.pitch));
    front[2] = Math.sin(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
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

Camera.prototype.getViewMatrix = function(out) {
    const target = vec3.create();
    vec3.add(target, this.position, this.front);
    mat4.lookAt(out, this.position, target, this.up);
}

Camera.prototype.moveForward = function() {
    this.position[0] += this.front[0] * this.movementSpeed;
    this.position[1] += this.front[1] * this.movementSpeed;
    this.position[2] += this.front[2] * this.movementSpeed;
}

Camera.prototype.moveBackward = function() {
    this.position[0] -= this.front[0] * this.movementSpeed;
    this.position[1] -= this.front[1] * this.movementSpeed;
    this.position[2] -= this.front[2] * this.movementSpeed;
}

Camera.prototype.moveRight = function() {
    this.position[0] += this.right[0] * this.movementSpeed;
    this.position[1] += this.right[1] * this.movementSpeed;
    this.position[2] += this.right[2] * this.movementSpeed;
}

Camera.prototype.moveLeft = function() {
    this.position[0] -= this.right[0] * this.movementSpeed;
    this.position[1] -= this.right[1] * this.movementSpeed;
    this.position[2] -= this.right[2] * this.movementSpeed;
}

Camera.prototype.turnCamera = function(mouseChange) {
    const xChange = mouseChange[0] * this.turnSpeed * 0.05;
    const yChange = mouseChange[1] * this.turnSpeed * 0.05;

    this.yaw += xChange;
    this.pitch -= yChange;
    if (this.pitch < -89) {
        this.pitch = -89;
    }

    this.updateVectors();
}