# media-manager

### 📦 Dependencies

* [MongoDB](https://docs.mongodb.com/manual/)
* [express](https://expressjs.com)
* [spacebro](https://github.com/spacebro/spacebro)

To run **media-manager** you need:
- a **spacebro** server
- a **Mongo** database

### 🌍 Installation

`git clone https://github.com/soixantecircuits/media-manager.git`  
`cd media-manager`  
`yarn`  
`yarn start`  

### ⚙ Settings

By default, **media-manager** loads `settings/settings.default.json`:
```json
{
  "server": {
      "host" : "localhost",
      "port" : 8008
  },
  "folder": {
    "data": "/tmp/media-manager"
  },
  "defaultState": "public",
  "states": ["public", "private", "draft"],
  "service": {
    "spacebro": {
      "host" : "localhost",
      "port" : 8888,
      "channel": "media-stream",
      "client" : "media-manager",
      "inputMessage": "new-media",
      "outputMessage": "media-to-db"
    }
  }
}
```
You can modify this file or load a custom one by adding the `--settings` option.  
Example: `yarn start -- -settings settings/settings.custom.json`

`spacebro` describes the spacebro client configuration. See [spacebro](https://github.com/spacebro/spacebro) and [spacebro-client](https://github.com/spacebro/spacebro-client).
`folder.data` is the directory where all files will be copied.  
`defaultState` is the state in which a media is at its creation.  
`states` is an array of all possible states.  

### 💬 Options

`--settings`: load a specific settings file (JSON).  
`--clean`: if a file associated to a media in database cannot be found, it is deleted.  

### 📖 Documentation

[Media](/documentation/MEDIA.md)
