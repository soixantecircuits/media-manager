# Media

This describes all the API routes related to media resources.  

## Creating a new media

There are two ways to create a new media: using a POST request or using [spacebro](https://github.com/spacebro/spacebro).  

#### POST `api/v1/medias`
Only `media` and `filename` fields are mandatory.  
Example:
```json
  {
    "media": "base64 string / path to a file / url",
    "filename": "myNewMedia.jpg",
    "bucketId" : "5678",
    "details": {
      "width": 600,
      "height": 400,
      "icon": {
        "file": "icon.jpg",
        "width": 64,
        "height": 64,
        "type": "image/jpg",
        "path": "path to a file / url"
      }
    },
    "meta": {
      "foo": "bar"
    }
  }
```

A spacebro event `media-to-db` will be emitted.

#### spacebro
**media-manager** awaits for `new-media` events.
Example:
```json
  {
    "path": "path to a file / url",
    "file": "myFile.jpg",
    "type": "image/jpg",
    "details": {
      "width": 1024,
      "height": 1024,
      "thumbnail": {
        "file": "myThumb.jpg",
        "width": 128,
        "height": 128,
        "type": "image/jpg",
        "path": "path to a file / url"
      }
    },
    "meta": {
      "put": "whatever",
      "you": "want"
    }
  }
```

The `details` and `meta` object are copied, and **media-manager** will try to import files in the `details` object if it finds a path or url (ex: if `details.thumbnail.path` is defined and valid).

## Accessing a media

#### GET `api/v1/medias/:id`
Returns a json object describing the media.  
Example:
```json
{
  "_id": "58c90c689882891f79b79066",
  "details": {
    "width": 1024,
    "height": 1024,
    "thumbnail": {
      "file": "thumb.jpg",
      "width": 128,
      "height": 128,
      "type": "image/jpg",
      "path": "/path/to/thumb.jpg",
      "url": "http://media-manager.url/route/to/thumb"
    }
  },
  "file": "media.gif",
  "path": "path/to/media.gif",
  "url": "http://media-manager.url/route/to/media",
  "type": "image/gif",
  "state": "public",
  "uploadedAt": "2017-03-15T09:42:00.135Z",
  "meta": {
    "foo": "bar"
  },
  "__v": 0
}
```

#### GET `api/v1/medias/:id/export`
Returns the media's raw data, image or video.    

#### GET `api/v1/medias/:id/:field`
Returns the specified field from the media's json.  
Example: `GET /api/v1/medias/58c90c689882891f79b79066/path`  
```json
  "path/to/media.gif"
```

## Updating a media

#### PUT `api/v1/medias/:id`
Use this route to modify `state` and/or `bucketId` fields of a media.  
Example: `PUT api/v1/medias/:id/?state=private&bucketId=098765`  

#### PUT `api/v1/medias/:id/meta`
Use this route to modify the `meta` object of a media.  
Example:
```json
  {
    "foo": "bar"
  }
```
A spacebro event `media-updated` will be emitted.

## Deleting a media

#### DELETE `api/v1/medias/:id`
This route deletes the media instance from database and its associated file.  
A spacebro event `media-deleted` will be emitted.

## Misc

#### GET `api/v1/medias`
Returns a json object describing the full set of media.

#### GET `api/v1/medias/count`
Returns the total amount of media in the database.

#### GET `api/v1/medias/settings`
Returns the settings object used by **media-manager**.
