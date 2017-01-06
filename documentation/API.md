# media-manager API

Quickly jump to:

* [medias](#medias)
* [buckets](#buckets)
* [misc](#misc)

## Medias

A media is a media instance (a file + its datas) stored in the database.

##### &rarr; GET `/api/v1/medias/:id`
Sends the raw media datas. `content-type` depends on media mime type.
###### Response
```
Response code : 200

Response headers :
"content-type": "image/jpg;"

Response body : /* raw media datas */
```

##### &rarr; GET `/api/v1/medias/count`
Sends the number of medias in database.

Request can accept `text/plain` or `application/json` as `content-type` headers.
###### Response
```
Response code : 200

Response headers :
"content-type": "text/plain;"

Response body : 60
```

##### &rarr; GET `/api/v1/medias/first`
Sends the very first media in database.
###### Response
See [`GET api/v1/medias/:id`](#get-apiv1mediasid).

##### &rarr; GET `/api/v1/medias/last`
Sends the very last media in database.
###### Response
See [`GET api/v1/medias/:id`](#get-apiv1mediasid).

##### &rarr; GET `/api/v1/medias/:id/datas`
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

##### &rarr; GET `/api/v1/medias/:id/datas/:field`
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

##### &rarr; POST `/api/v1/medias`
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

##### &rarr; PUT `/api/v1/medias/:id`
Update a media property, or the media itself.

Works the same as [`POST api/v1/medias/`](#post-apiv1mediasid), except:
* Response will have code `200`.

##### &rarr; PUT `/api/v1/medias/:id/metas`
Shortcut for `PUT api/v1/medias/:id -d '{ "metas": /* ... */}'`.

See [`PUT api/v1/medias/:id`](#put-apiv1mediasid).

##### &rarr; GET `/api/v1/medias`
Sends a list of all medias **datas** in database.
###### Response
```
Response code : 206

Response headers :
"content-type": "application/json;"
"content-range": "0-49/249"

Response body :
{
  "datas": [/* some huge list of medias datas */],
  "data_type": "medias",
  "first-cursor": "abcd1234",
  "last-cursor": "efgh5678",
  "count": 60
}
```
###### Pagination
You can handle pagination with the `limit` query param. Default is `50`. You'd use the `cursor` query param to determine from which media `id` you want to start querying. If a response has more than `limit` entities, these endpoints will return the first `limit` entities and a `next-cursor` key in the response JSON.

`GET http://media-manager.url/api/v1/medias?limit=50`

```
{
  "datas": [/* the first 50 medias datas */],
  "data_type": "medias",
  "first-cursor": "abcd1234",
  "next-cursor": "efgh5678",
  "count": 200
}
```

To get the next series of medias, add `cursor` to your query params:

_**protip:** You can use negative `limit` query param to perfom reverse looking requests._

`GET http://media-manager.url/api/v1/medias?limit=50&cursor=efgh5678`

```
{
  "datas": [/* the 50 medias datas starting from id "efgh5678" */],
  "data_type": "medias",
  "first-cursor": "efgh5678",
  "next-cursor": "ijkl91011",
  "count": 200
}
```

##### &rarr; POST `/api/v1/medias/:id/generateQR`
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

##### &rarr; GET `api/v1/buckets/:id`
Sends the bucket JSON object.
###### Response
```
Response code : 200

Response headers :
"content-type": "application/json;"

Response body :
[JSON Object]
```

##### &rarr; GET `api/v1/buckets/count`
Sends the number of buckets in database.

Request can accept `text/plain` or `application/json` as `content-type` headers.
###### Response
```
Response code : 200

Response headers :
"content-type": "text/plain;"

Response body :
5
```

##### &rarr; GET `api/v1/buckets/first`
Sends the very first bucket in database.
###### Response
See [`GET api/v1/buckets/:id`](#get-apiv1bucketsid).

##### &rarr; GET `api/v1/buckets/last`
Sends the very last bucket in database.
###### Response
See [`GET api/v1/buckets/:id`](#get-apiv1mediasid).

##### &rarr; POST `api/v1/buckets`
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

##### &rarr; PUT `api/v1/buckets`
Update a bucket property (i.e its name).

Works the same as [`POST api/v1/buckets/`](#post-apiv1bucketsid), except:
* Response will have code `200`.

##### &rarr; GET `api/v1/buckets`
Sends a list of all buckets in database.
###### Response
```
Response code : 206

Response headers :
"content-type": "application/json;"
"content-range": "0-9/59"

Response body :
{
  "datas": [/* some huge list of buckets */],
  "data_type": "buckets",
  "first-cursor": "abcd1234",
  "last-cursor": "efgh5678",
  "count": 60
}
```
###### Pagination
You can handle pagination with the `limit` query param. Default is `10`. You'd use the `cursor` query param to determine from which bucket `id` you want to start querying. If a response has more than `limit` entities, these endpoints will return the first `limit` entities and a `next-cursor` key in the response JSON.

`GET http://media-manager.url/api/v1/buckets?limit=10`

```
{
  "datas": [/* the first 10 buckets */],
  "data_type": "buckets",
  "first-cursor": "abcd1234",
  "next-cursor": "efgh5678",
  "count": 25
}
```

To get the next series of buckets, add `cursor` to your query params:

_**protip:** You can use negative `limit` query param to perfom reverse looking requests._

`GET http://media-manager.url/api/v1/buckets?limit=10&cursor=efgh5678`

```
{
  "datas": [/* the 10 buckets starting from id "efgh5678" */],
  "data_type": "buckets",
  "first-cursor": "efgh5678",
  "next-cursor": "ijkl91011",
  "count": 25
}
```

## Misc.

##### &rarr; GET `api/v1/ping`
Convenience method to check if API is up or not.

Request can accept `text/plain` or `application/json` as `content-type` headers.
###### Response
```
Response code : 200

Response headers :
"content-type": "text/plain;"

Response body :
"pong"
```
