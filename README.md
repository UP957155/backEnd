# Final Year Discord Quiz bot web app back-end

To clone repository:

```shell

git clone https://github.com/UP957155/back_end.git
cd back_end

```

To install dependencies for the backend:

First install all dependencies

```shell

npm i 

```

Setting up environment

You have to create .env file with 7 variables to make the API work properly.

Resources below could be helpful for you:

- https://www.npmjs.com/package/jsonwebtoken JSON Web Token

- https://discord.com/developers/docs/topics/oauth2


.env file content:

```bash

REFRESH_TOKEN_SECRET=<Your-Secret-Word-For-Refresh-Token>
ACCESS_TOKEN_SECRET=<Your-Secret-Word-For-Access-Token>
clientID=<Your-Discord-Client-ID>
clientSecret=<Your-Discord-Client-Secret-Key>
callbackURL=http://localhost:8080/success
secret=<Your-Secret-Word-For-Session-Cookies>
adminEmail=<Email-Of-Admin-User>

```

Please be sure you store .env file in the root of this folder.

The Google Cloud Datastore (GCD) needs also few settings before you start the backend.

You have to store in the root of this folder a JSON file with your service account key. Then paste the full name of the file to the source code inside the file \api\datastore\db-datastore.js as shown below.

For further information follow this link: https://cloud.google.com/datastore/docs/activate

```javascript

const ds = new Datastore({
 projectId:process.env.projectId,
 keyFilename: '<Your-Full-File-Name>.json',
 namespace: 'app' });

```

Be sure you saved all the changes inside the source code.

If you will have issues with GCD you can try to add variable projectId manually to the .env file assigning your project ID.


Once you have installed dependencies and environment is ready you can start the backend with this command:

```shell

npm start

```

The app should be running on: http://localhost:8080/

If any issues then contact author: up957155@myport.ac.uk