//┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
  //  Server-side configuration file which holds our secret-key for Token signing/verifying
  //  and the URL to our Mongo database.
  //
  //  Notes:
  //
  //  Todo:
  //
//└───────────────────────────────────────────────────────────────────────────────────────────────────┘
module.exports = {
	'baseURL'	: 'http://localhost:8080/',
	'secretKey'	: '1337-1134-80085-99',
	'mongoUrl'	: 'mongodb://127.0.0.1:27017/apex' //DATABASE NAME (db use) = apex
}