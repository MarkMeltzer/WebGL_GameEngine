/**
 * Links an html checkbox to a setting in the game engine.
 * 
 * @param {string} elementId the checkbox html element
 * @param {array} path the path to the object containing the setting field
 * @param {string} field the field of the object containing the setting
 * @param {boolean} objectSetting wether this setting refers to a selected object
 */
function setupCheckbox(elementId, path, field, objectSetting=false) {
    const checkbox = document.getElementById(elementId + "-checkbox");

    // follow the path of objects to the setting, if there's no such
    // setting hide the checkbox container
    const start = objectSetting ? gameEngine.scene.worldObjects[selectedObject] : gameEngine;
    var object = objectPathToObject(start, path);

    if (object == null || object[field] == null) {
        checkbox.parentElement.style.display = "none";
        return;
    } else {
        checkbox.parentElement.style.display = "block";
        checkbox.checked = object[field];
    }

    // make checkbox change value in engine
    checkbox.onclick = function() {
        object[field] = this.checked;
    }
}


/**
 * Links an html checkbox to a setting in the game engine.
 * 
 * @param {string} elementId the checkbox html element
 * @param {array} path the path to the object containing the setting
 * @param {function} parseFunc function to parse string value from slider with
 * @param {boolean} objectSetting wether this setting refers to a selected object
 */
function setupVec3Slider(elementId, path, parseFunc, objectSetting=false) {
    const sliderX = document.getElementById(elementId + "-x-slider");
    const sliderXValue = document.getElementById(elementId + "-x");
    const sliderY = document.getElementById(elementId + "-y-slider");
    const sliderYValue = document.getElementById(elementId + "-y");
    const sliderZ = document.getElementById(elementId + "-z-slider");
    const sliderZValue = document.getElementById(elementId + "-z");

    // follow the path of objects to the setting, if there's no such
    // setting hide the slider container
    const start = objectSetting ? gameEngine.scene.worldObjects[selectedObject] : gameEngine;
    var object = objectPathToObject(start, path);

    if (object == null) {
        sliderX.parentElement.style.display = "none";
        return;
    } else {
        sliderX.parentElement.style.display = "block";

        sliderXValue.innerHTML = object[0];
        sliderX.setAttribute("value", object[0]);

        sliderYValue.innerHTML = object[1];
        sliderY.setAttribute("value", object[1]);

        sliderZValue.innerHTML = object[2];
        sliderZ.setAttribute("value", object[2]);
    }

    // make sliders change value in engine
    sliderX.oninput = function() {
        object[0] = parseFunc(this.value);
        sliderXValue.innerHTML = this.value;
    }
    sliderY.oninput = function() {
        object[1] = parseFunc(this.value);
        sliderYValue.innerHTML = this.value;
    }
    sliderZ.oninput = function() {
        object[2] = parseFunc(this.value);
        sliderZValue.innerHTML = this.value;
    }
}

/**
 * Links an html checkbox to a setting in the game engine.
 * 
 * @param {string} elementId the checkbox html element
 * @param {array} path the path to the object containing the setting field
 * @param {string} field the field of the object containing the setting
 * @param {function} parseFunc function to parse string value from slider with
 * @param {boolean} objectSetting wether this setting refers to a selected object
 */
function setupSlider(elementId, path, field, parseFunc, objectSetting=false) {
    const slider = document.getElementById(elementId + "-slider");
    const sliderValue = document.getElementById(elementId)

    // follow the path of objects to the setting, if there's no such
    // setting hide the slider container
    const start = objectSetting ? gameEngine.scene.worldObjects[selectedObject] : gameEngine;
    var object = objectPathToObject(start, path);

    if (object == null || object[field] == null) {
        slider.parentElement.style.display = "none";
        return;
    } else {
        slider.parentElement.style.display = "block";
        slider.setAttribute("value", object[field])
        sliderValue.innerHTML = object[field];
    }

    // make slider change value in engine
    slider.oninput = function() {
        object[field] = parseFunc(this.value);
        sliderValue.innerHTML = this.value;
    }
}

/**
 * Setup the dropdown to change scenes.
 */
function setupSceneDropdown() {
    const dropdown = document.getElementById("scene-dropdown");

    dropdown.onchange = function() {
        loadSceneAndRefreshFrontend(this.value);
        printToConsole("Loading scene: " + this.value);
    };

    // clear the dropdown list
    const len = dropdown.options.length;
    for (var i = len - 1; i >= 0; i--) {
        dropdown.remove(i);
    }

    // add all scenes
    for (var i = 0; i < sceneDescriptions.length; i++) {
        const option = document.createElement("option");
        option.value = sceneDescriptions[i];
        option.text = sceneDescriptions[i];
        dropdown.add(option);
    }

    dropdown.value = currentScene;
}

/**
 * Setup the dropdown to change the controller child.
 */
function setupObjectDropdown() {
    const dropdown = document.getElementById("controller_dropdown");

    dropdown.onchange = function() {
        printToConsole("Controlled object: " + this.value);
        gameEngine.controller.parent(gameEngine.scene.worldObjects[this.value]);
        document.getElementById("flying-checkbox").checked = gameEngine.controller.child.flying;
    };

    // clear the dropdown list
    const len = dropdown.options.length;
    for (var i = len - 1; i >= 0; i--) {
        dropdown.remove(i);
    }

    // add all worldObjects
    const keys = Object.keys(gameEngine.scene.worldObjects);
    for (var i = 0; i < keys.length; i++) {
        const option = document.createElement("option");
        option.value = keys[i];
        option.text = keys[i];
        dropdown.add(option);
    }
}

/**
 * Load new scene and refresh the frontend.
 * 
 * @param {string} scene path to the scene
 * @param {boolean} startNewGameLoop wether to start a new game loop
 */
function loadSceneAndRefreshFrontend(scene, startNewGameLoop=false) {
    loadJSON(scene, (sceneJson) => {
        gameEngine.loadScene(sceneJson, () => {
            populateObjectSelector();
            
            // if relevant, start new game loop
            if (startNewGameLoop) {
                gameEngine.startGameLoop();
            }
            
            // set up the settings in the right pane
            setupGlobalSettings();
            setupObjectSettings();
        });
    });
    currentScene = scene;
}

/**
 * Populate the object selector in the left pane with objects from the scene.
 */
function populateObjectSelector() {
    const WOList = document.getElementById("world-object-list")

    // clean the object list
    while (WOList.firstChild) {
        WOList.removeChild(WOList.firstChild);
    }

    // show the loading text in the dropdown
    const pLoading = document.createElement("p");
    pLoading.setAttribute("id", "WO-list-loading");
    WOList.appendChild(pLoading);
    document.getElementById("WO-list-loading").style.display = "block";

    const WOKeys = Object.keys(gameEngine.scene.worldObjects);
    for (var i = 0; i < WOKeys.length; i++) {
        const li = document.createElement("li");

        // create and insert input element
        const input = document.createElement("input");
        input.setAttribute("type", "radio");
        input.setAttribute("class", "radio-button")
        input.setAttribute("name", "objects");
        input.setAttribute("id", WOKeys[i]);
        input.onclick = function() {
            selectedObject = this.id;
            setupObjectSettings();
            document.getElementById("object-settings-button").onclick();
        }
        li.appendChild(input)

        // create and insert label element
        const label = document.createElement("label");
        label.setAttribute("for", WOKeys[i]);
        label.setAttribute("class", "radio-label");
        label.appendChild(document.createTextNode(WOKeys[i]));
        li.appendChild(label);

        // insert list item into list
        WOList.appendChild(li);
    }
    document.getElementById("WO-list-loading").style.display = "none";
}

/**
 * Print a string to the console in the middle pane.
 * 
 * @param {string} string string to print
 */
function printToConsole(string) {
    const console = document.getElementById("console-content")
    console.innerHTML += string + "<br>";
    console.scrollTop = console.scrollHeight;
}

/**
 * Takes path of object made of strings and follows that path to reach the
 * final object.
 * 
 * @param {object} start the starting element
 * @param {array} path array of strings with path of objects in order 
 * @returns 
 */
 function objectPathToObject(start, path) {
    var object = start;
    for (let i = 0; i < path.length; i++) {
        if (object == null || object[path[i]] == null) {
            return null;
        } else {
            object = object[path[i]];
        }
    }
    return object;
}