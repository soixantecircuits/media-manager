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

Note - you can only run one instance of **media-manager** per computer.

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
      "host" : "spacebro.space",
      "port" : 3333,
      "channelName": "media-stream",
      "client" : {
        "name": "media-manager",
        "description": "Manage a media folder with API, database and realtime events",
				"in": {
					"inMedia": {
						"eventName": "new-media",
						"description": "Input media to add do the db",
						"type": "all"
					},
					"inMediaUpdate": {
						"eventName": "media-update",
						"description": "Update media in db",
						"type": "all"
					}
				},
				"out": {
					"outMedia": {
						"eventName": "media-to-db",
						"description": "Media saved in db",
						"type": "all"
					},
					"outMediaUpdate": {
						"eventName": "media-updated",
						"description": "Media in db was updated",
						"type": "all"
					},
          "outMediaDelete": {
            "eventName": "media-deleted",
            "description": "media in db deleted",
            "type": "all"
          }
        }
      }
    },
		"mongodb": {
			"url": "mongodb://localhost/media-manager"
		}
  }
}
```
You can copy this file to `settings/settings.json`, edit it, and it will be automatically loaded.
Or load a custom one by adding the `--settings` option.  
Example: `yarn start -- -settings settings/settings.custom.json`

`spacebro` describes the spacebro client configuration. See [spacebro](https://github.com/spacebro/spacebro) and [spacebro-client](https://github.com/spacebro/spacebro-client).
`folder.data` is the directory where all files will be copied.  
`defaultState` is the state in which a media is at its creation.  
`states` is an array of all possible states.  

### 💬 Options

`--settings`: load a specific settings file (JSON).  
`--clean`: if a file associated to a media in database cannot be found, it is deleted.  

### 📖 Documentation

[Media](/src/documentation/MEDIA.md)
