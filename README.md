# media-manager

### Dependencies

* [MongoDB](https://docs.mongodb.com/manual/)
* [express](https://expressjs.com)
* [spacebro](https://github.com/spacebro/spacebro)

To run **media-manager** you need:
- a **spacebro** server
- a **Mongo** database

### Installation

`git clone https://github.com/soixantecircuits/media-manager.git`  
`cd media-manager`  
`yarn`  
`yarn start`  

### Settings

By default, **media-manager** loads `settings/settings.default.json`:
```json
{
  "spacebro": {
    "address": "localhost",
    "port": 8888,
    "clientName": "media-manager",
    "channelName": "media-stream"
  },
  "dataFolder": "/home/mina/Desktop/media-manager-data",
  "defaultState": "public",
  "states": ["public", "private", "draft"]
}
```
You can modify this file or load a custom one by adding the `--settings` option.  
Example: `yarn start -- -settings settings/settings.custom.json`

### Options

`--clean` short `-c`: if a file associated to a media in database cannot be found, it is deleted.  

### Documentation

[Media](/documentation/MEDIA.md)
