var googleapis = require('googleapis'),
    OAuth2Client = googleapis.auth.OAuth2,
    client = '1052349661858-tbv5i69g302ru0ab6bpb3hs6l1h5fdkt.apps.googleusercontent.com',
    secret = 'DaTdlbmpQnh9W9ebFFGY9E6H',
    redirect = 'http://localhost:3000/oauth2callback',
    oauth2Client = new OAuth2Client(client, secret, redirect);

// generate a url that asks permissions for Google+ and Google Calendar scopes 
var scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/contacts.readonly'
];

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token) 
  scope: scopes // If you only need one scope you can pass it as string 
});

exports.google = googleapis;
exports.client = oauth2Client;
exports.url = url;

