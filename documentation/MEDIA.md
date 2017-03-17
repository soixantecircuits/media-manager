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
    "meta": {
      "foo": "bar"
    }
  }
```

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
        "source": "path to a file / url"
      }
    }
  }
```

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
      "source": "http://media-manager.url/route/to/thumb"
    }
  },
  "file": "media.gif",
  "path": "path/to/media.gif",
  "source": "http://media-manager.url/route/to/media",
  "type": "image/gif",
  "state": "public",
  "uploadedAt": "2017-03-15T09:42:00.135Z",
  "__v": 0
}
```

#### GET `api/v1/medias/:id/export`
Returns the media's raw data, image or video.  

#### GET `api/v1/medias/count`
Returns the total amount of media in the database.  

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

## Deleting a media

#### DELETE `api/v1/medias/:id`
This route deletes the media instance from database and its associated file.
