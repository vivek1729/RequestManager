# RequestManager
A basic request manager to handle http requests in node

There are two parts to it:

 1. A basic express server
 2. A socket server listening to http requests.

A **`GET`** request to `api/request?connId=19&amp;timeout=80`
This API will keep the request running for provided time on the server side. 
After the successful completion of the provided time it should return `{"status":"ok"}`

A **`GET`** request to `api/status`
This API returns all the running requests on the server with their time left for completion. 
E.g `{"2":"15","8":"10"}` where 2 and 8 are the connIds and 15 and 10 is the time remaining for the requests to complete (in seconds).

A **`PUT`** request to `api/kill`
This API will finish the running request with provided connId, so that the finished request returns `{"status":"killed"}` and the current request will return `{"status":"ok"}`. If no running request found with the provided connId on the server then the current request should return `{"status":"invalid connection Id : <connId>"}`


**Getting started**

* `npm install` to install all the dependencies
* Running the express server - `npm start`
* Running the socket server - `node socket_server.js`

**Issue with socket server**

For some reason. The `PUT` request on my machine fails to send response back to the client. 
The request gets killed successfully but the other side of the TCP connection gets closed unexpectedly.
A `POST` request however seems to work as expected.
Referencign [Relevant SO Post](http://stackoverflow.com/questions/17245881/node-js-econnreset)

