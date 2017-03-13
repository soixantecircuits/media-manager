# media-manager

### Dependencies

* [MongoDB](https://docs.mongodb.com/manual/)
* [express](https://expressjs.com)
* [spacebro](https://github.com/spacebro/spacebro)
* [chokibro](https://github.com/soixantecircuits/chokibro)

To run **media-manager** you need:
- a **spacebro** server
- a **chokibro** instance watching a chosen folder
- a **Mongo** database

### Configuration example

`config/config.json`:
```json
{
  "uploads": "/path/to/uploaded/medias",
  "defaultState": "private",
  "states": ["public", "private", "draft"]
}
```

### API

#### Medias

[chokibro](https://github.com/soixantecircuits/chokibro) watches a folder and emits events when files are added, changed or deleted in this folder.  
When a `new-media` event is emitted, a new `Media` instance is added to the Mongo database.

A `Media` has the following scheme:

```json
{
  "_id": "1234",
  "filename": "hello.jpg",
  "path": "/path/to/hello.jpg",
  "type": "image/jpg",
  "bucketId": "5678",
  "state": "public",
  "uploadedAt": "some date",
  "updatedAt": "some date",
  "meta": {
    "foo": "bar",
  }
}
```

`state` can be set to any value described in the `config.json` file.  
`meta` can be set to any value that suits your needs.

#### GET `/api/v1/medias?param=value`
Sends available informations on a selected set of medias.  
The following query parameters are available:  
- `state`: Only the medias with the corresponding state will be selected.
- `page`
- `perPage`
`page` and `perPage` parameters are used for pagination. Example: `GET medias?page=3&perPage=10`.

###### Response
```
Response code : 200

Response headers :
"content-type": "application/json;"

Response body :
{
  "data": ["array", "of", "medias"],
  "dataType": "medias",
  "previousPage": "http://...",
  "nextPage": "http://..."
}
```

##### GET `/api/v1/medias/:id/export`
Sends image or video media with corresponding `id`.

##### GET `/api/v1/medias/:id`
Sends available informations on media with corresponding `id`.  
You can retrieve the next X medias by adding the `next` query parameter or the X previous medias by adding the `prev` query parameter.  
Example: `GET /api/v1/medias/:id?next=10`

###### Response
```
Response code : 200

Response headers :
"content-type": "application/json;"

Response body :
{
  "_id": "1234",
  "filename": "hello.jpg",
  "path": "/path/to/hello.jpg",
  "type": "image/jpg",
  "bucketId": "5678",
  "state": "public",
  "uploadedAt": "some date",
  "updatedAt": "some date",
  "meta": {
    "foo": "bar",
  }
}
```

##### GET `/api/v1/medias/config`
Sends current configuration stored in `config.json` file.

##### GET `/api/v1/medias/count`
Sends current amount of medias in the Mongo database.

##### PUT `/api/v1/medias/:id`
Updates media's state with corresponding `id`.  
Example:
```
  PUT /api/v1/medias/12345
  {
    "state": "public"
  }
```

##### POST `/api/v1/medias`
Creates a new media and uploads its content to `uploads` described in `config.json`.  
Example:
```
  POST /api/v1/medias
  {
    "media": "base64 string / path to a file / url",
    "filename": "myNewMedia.jpg",
    "bucketId" : "optionnalBucketId",
    "meta": {
      "foo": "bar"
    }
  }
```

##### DELETE `/api/v1/medias/:id`
Deletes media with corresponding `id` from database.
