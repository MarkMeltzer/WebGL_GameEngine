![Logo](./logo_150.png)

# WebGL Game engine
A small WebGL based game engine using vanilla javascript and the glMatrix library for vector and matrix math.

This project is a small hobby project for educational purposes. It is also my first time writing anything more than a couple of lines of javascript, so excuse the less than optimal code :)

# Features
 - Directional shadow mapping
 - Lambertian diffuse Shading
 - Specular shading
 - Normal mapping
 - Simple .OBJ loading
 - Saving and loading scenes from JSON files
 - Axis-aligned bounding box based physics
 - Custom frontend

# Structure
## File structure
```
.
├── js
|   ├── main.js           # starts the game engine and sets up the frontend
|   ├── frontend.js       # contains code for setting managing the frontend
|   ├── GameEngine.js     # contains main game loop, the render- and physicsengine, handles loading of assets and other game logic
|   ├── RenderEngine.js   # handles the rendering of the scene to the html canvas using WebGL
|   ├── PhysicsEngine.js  # handles physics such as dynamics and collision
|   ├── ShaderSources.js  # contains the GLSL source code for the WebGL shaders
│   └── other js files    # self explanatory
│     
├── imgs          # textures
├── objs          # meshes in OBJ format
├── scenes        # scenes files in JSON format
└── index.html     # the HTML file containing the canvas and settings panel
```
## Scene structure
The scene JSON files have the following general structure:
```
.
├── "assets"
│     ├── "meshes"      # contains ids and paths to meshes
│     ├── "textures"    # contains ids, types and paths to textures
│     ├── "materials"   # combines references to multiple textures
│     └── "models"      # combines references to meshes and materials as well as contains render settings
│
└── "worldObjects"      # contains information such as type of object, model, position, rotation, AABB's etc


```

# Demo
A short gif demonstrating some of the features.
![Short demonstration gif](./WebGL_demo2.gif)


A live demonstration can be found at [markmeltzer.nl](http://markmeltzer.nl) (may or may not be up to date).

**Note:** when running the code yourself, you need to run a simple webserver or you will get a CORS error.

# To do/next steps
1. Fix incode todo's relating to readability.
2. ~~Make textures repeating (or add option to, maybe add scale parameter)~~
3. ~~Implement normal mapping~~
4. ~~Implement specular and ambient components of phong-shading~~
5. Implement specular mapping
6. Add support for non-trangulated OBJ files
7. Add scale and allow rotation/scale to be applied.
8. Add the option to "upload" new textures and meshes to localStorage.

# Known issues/bugs
- The AABB's don't update when rotating an object
- The UV mapping doesn't seem to completely work yet (the top and bottom faces of a cube aren't mapped correctly)
- Some object fields are saved but not loaded
- ~~Default cube needs their own tangents~~
- There is some stuttering when moving the controller and turning the camera at the same time.
- There is no way to give an existing worldModel the default mesh (manually add to list and create setter function in GameEngine).