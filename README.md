# nodeExpressMongoRedisEJS_ExpenseManagement
A basic web application that demonstrates the use of Mongo as the backend main database and Redis for session Management.
# Requirement Document
Includes business requirement in a pdf format
    Requirement.pdf

# UML Diagram
Includes UML Class diagram of the DB.
    UML_Design.jpg

# How to load data

* Download the below mentioned files
        * base_market_incentive.json
        * expense_Data.json
        * farmer_data.json
        * product.json

* Import the file using mongoimport. If you already have port 27017 used, use 37017
```mongoimport -h localhost:27017 -d mongoFlora -c base_market_incentive --file base_market_incentive.json --jsonArray```

```mongoimport -h localhost:27017 -d mongoFlora -c expense --file expense_data.json --jsonArray```

```mongoimport -h localhost:27017 -d mongoFlora -c farmer --file farmer_data.json --jsonArray```

```mongoimport -h localhost:27017 -d mongoFlora -c product --file product.json --jsonArray```

```mongoimport -h localhost:27017 -d mongoFlora -c orders --file orders.json --jsonArray```

All the collections should be successfully imported.

## Using it

1) Clone the repo
2) Install the dependencies

```
npm install
```

3) Create .env file in the same level as the app.js

4) Add SECRET_SESSION in your file

```
SECRET_SESSION = 'your key'
```

5) Start the server

```
npm start
```

6) Point your browser to http://locahost:3000

7) If you are getting issue with connect-Redis, downgrade the version using below command

```
npm install connect-redis@6
```
## DataStructure Usage Scripts

1) Session Management
    Purpose: Manage user sessions securely and persist session data in Redis.

Initialize Session (Set session data):
```SETEX sess:<sessionID> <TTL> '{"cookie": {"maxAge": <maxAge>, "expires": "<expires>"}, "seller": {"id": "<id>", "email": "<email>", "name": "<name>"}}'```

Example:

```SETEX sess:abcd1234 900 '{"cookie": {"maxAge": 900000, "expires": "2024-12-07T10:20:30Z"}, "seller": {"id": "123", "email": "user@example.com", "name": "John Doe"}}'```

Retrieve Session Data:
```GET sess:<sessionID>```

Example:
```GET sess:abcd1234```

Delete Session (e.g., on logout):
```DEL sess:<sessionID>```

Example:
```DEL sess:abcd1234```

2) Real-time Session Timer
    Purpose: Display a countdown timer for the session in the UI.

Check TTL for a session:
```TTL sess:<sessionID>```

Example:
```TTL sess:abcd1234```

Manually Extend Session TTL (optional):
```EXPIRE sess:<sessionID> <newTTL>```

Example:
```EXPIRE sess:abcd1234 1800```

Automatically Expire Session:
Handled by SETEX during initialization with the TTL.
