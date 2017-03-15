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
    "details": { }
  }
```

## Accessing a media

#### GET `api/v1/medias/:id`
This route returns a json object describing the media.  
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
      "source": "path/to/thumb.jpg"
    }
  },
  "file": "media.gif",
  "source": "path/to/media.gif",
  "type": "image/gif",
  "state": "public",
  "uploadedAt": "2017-03-15T09:42:00.135Z",
  "__v": 0
}
```

#### GET `api/v1/medias/:id/export`
This route returns the media's raw data, image or video.
