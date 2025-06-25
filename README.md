# Document on how to use API and How to send Data to server
post http://localhost:3000/register 
Content-Type: application/json
Accept: application/json

{
    "email" : "saibabu61242@gmail.com",
    "password" : "1Sai2Sai"
}

### login 
post http://localhost:3000/login 
Content-Type: application/json
Accept: application/json

{
    "email" : "saibabu61242@gmail.com",
    "password" : "1Sai2Sai"
}


### Get User data with id
GET http://localhost:3000/getUserData/685b6c41dbdf769f85ad94f2
Accept: application/json
Authorization: Bearer <jwt token>


### Add Transaction 
POST http://localhost:3000/add-transaction
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt token>

{
    "userId" : "685b6c41dbdf769f85ad94f2",
    "type" : "expense",
    "amount" : 50000,
    "title" : "Mobile"
}
### Get Transactions 

POST http://localhost:3000/
Content-Type: application/json
Accept: application/json
Authorization: Bearer <jwt token>

{
    "userId" : "685b6c41dbdf769f85ad94f2"
}

