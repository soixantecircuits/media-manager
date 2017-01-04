# media-manager API

## Medias

A media is a media instance (a file + its datas) stored in the database.

##### GET `/api/v1/medias/:id`
Sends the raw media datas. `content-type` depends on media mime type.
###### Response
```
Response code : 200

Response headers :
"content-type": "image/jpg;"

Response body : /* raw media datas */
```

##### GET `/api/v1/medias/count`
Sends the number of medias in database. Request can accept `text/plain` or `application/json` as `content-type` headers.
###### Response
```
Response code : 200

Response headers :
"content-type": "text/plain;"

Response body : 60
```

##### GET `/api/v1/medias/first`
Sends the very first media in database.
###### Response
See [`GET api/v1/medias/:id`](#get-apiv1mediasid).

##### GET `/api/v1/medias/last`
Sends the very last media in database.
###### Response
See [`GET api/v1/medias/:id`](#get-apiv1mediasid).

##### GET `/api/v1/medias/:id/datas`
Sends the JSON datas related to the media.
###### Response
```
Response code : 200

Response headers :
"content-type": "application/json;"

Response body :
{
  "id": "1234",
  "uploadedAt": "ISO-8601-formatted-date",
  "filename": "media.ext",
  "path": "/local/absolute/path/to/media.ext",
  "URI": "http://media-manager.url/api/v1/medias/1234",
  "type": "mime/type",
  "metas": {
    "any": "meta",
    "you": "pass"
  }
}
```

##### GET `/api/v1/medias/:id/datas/:field`
Sends the specific field for the media.
###### Response
*Example: `GET /api/v1/medias/:id/datas/type`*
```
Response code : 200

Response headers :
"content-type": "application/json;"

Response body :
{
  "type": "mime/type"
}
```

##### POST `/api/v1/medias`
Uploads a new media.

You have 4 ways to send the media:
* send a `media` property in the request body with the base64 media datas.
* send a `media` property in the request body with the media URI.
* send a `media` property in the request body with the media file path.
* send the raw binary media data via `form-data`.

Server responds with media properties if request succeeded.
###### Request
|name|type|required|description|
|:---|:---|:---:|:---|
|**media**|`string`|&minus;|media URI, path or base64 datas.|
|**filename**|`string`|&minus;|Set a custom filename for the media. (extension will be set automatically)|
|**metas**|`Object`|&minus;|Set a custom metas object for the media.|

###### Response
```
Response code : 201

Response headers :
"content-type": "application/json;"

Response body :
{
  "id": "1234",
  "uploadedAt": "ISO-8601-formatted-date",
  "filename": "media.ext",
  "path": "/local/absolute/path/to/media.ext",
  "URI": "http://media-manager.url/api/v1/medias/1234",
  "type": "mime/type",
  "metas": {}
}
```

##### PUT `/api/v1/medias/:id`
Update a media property, or the media itself.

Works the same as [`POST api/v1/medias/`](#post-apiv1mediasid), except:
* Response will have code `200`.

##### PUT `/api/v1/medias/:id/metas`
Shortcut for `PUT api/v1/medias/:id -d '{ "metas": /* ... */}'`.

See [`PUT api/v1/medias/:id`](#put-apiv1mediasid).

##### GET `/api/v1/medias`
Sends a list of all medias **properties** in database. Default pagination range is 50.
###### Response
```
Response code : 206

Response headers :
"content-type": "application/json;"
"content-range": "0-49/249",
"accept-ranges": "medias 50",

Response body :
[/* some huge list of medias properties */]
```

##### POST `/api/v1/medias/:id/generateQR`
Action that attaches a QR code to a media. Media datas will then have a `QR` field.

*For now, it hasn't been determined weither we attached a URI/path to the QR code image, or weither we attach the base64/raw data.*
###### Request
|name|type|required|description|
|:---|:---|:---:|:---|
|**URL**|`string`|&times;|URL where the QR code redirects.|

###### Response
```
Response code : 201

Response headers :
TBD

Response body :
TBD
```

## Buckets

A bucket is a collection of medias. It has the following scheme:

```json
{
  "id": "abdc",
  "name": "Bucket name",
  "slug": "bucket-name"
}
```

##### GET `api/v1/buckets/:id`
Sends the bucket JSON object.
###### Response
```
Response code : 200

Response headers :
"content-type": "application/json;"

Response body :
[JSON Object]
```

##### GET `api/v1/buckets/count`
Sends the number of buckets in database. Request can accept `text/plain` or `application/json` as `content-type` headers.
###### Response
```
Response code : 200

Response headers :
"content-type": "text/plain;"

Response body :
5
```

##### GET `api/v1/buckets/first`
Sends the very first bucket in database.
###### Response
See [`GET api/v1/buckets/:id`](#get-apiv1bucketsid).

##### GET `api/v1/buckets/last`
Sends the very last bucket in database.
###### Response
See [`GET api/v1/buckets/:id`](#get-apiv1mediasid).

##### POST `api/v1/buckets`
Creates a new bucket instance in database.

Server responds with new bucket object if request succeeded.
###### Request
|name|type|required|description|
|:---|:---|:---:|:---|
|**name**|`string`|&times;|name of the bucket.|

###### Response
```
Response code : 201

Response headers :
"content-type": "application/json;"

Response body :
[JSON Object]
```

##### PUT `api/v1/buckets`
Update a bucket property (i.e its name).

Works the same as [`POST api/v1/buckets/`](#post-apiv1bucketsid), except:
* Response will have code `200`.

##### GET `api/v1/buckets`
Sends a list of all buckets in database. Default pagination range is 10.
###### Response
```
Response code : 206

Response headers :
"content-type": "application/json;"
"content-range": "0-9/59",
"accept-ranges": "buckets 10",

Response body :
[/* some list of buckets */]
```

## Misc.

##### GET `api/v1/ping`
Convenience method to check if API is up or not. Request can accept `text/plain` or `application/json` as `content-type` headers.
###### Response
```
Response code : 200

Response headers :
"content-type": "text/plain;"

Response body :
"pong"
```
