var express = require('express'),
    EventEmitter = require('events'),
    app = express(),
    http = require('http'),
    path = require('path'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    morgan = require('morgan'),
    simpleGet = require('simple-get'),
    gapi = require('./lib/gapi');


var jsonParser = bodyParser.json()

var my_calendars = [],
    my_profile = {},
    my_email = '';

if (process.env.NODE_ENV === 'development') {
    // only use in development
    app.use(errorhandler());
}

app.use(morgan('combined'));
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));

app.get('/', function(req, res) {
    var locals = {
        title: 'This is my sample app',
        url: gapi.url
    };
    res.render('index.jade', locals);
});

app.get('/oauth2callback', function(req, res) {
    var code = req.query.code;
    var emailsOfPersons;
    var pageRenderer = new EventEmitter();
    gapi.client.getToken(code, function(err, tokens) {
        gapi.client.setCredentials(tokens);
        process.nextTick(
            () => {
                gapi.google.plus('v1').people.get({
                    userId: 'me',
                    auth: gapi.client
                }, function(err, response) {
                    // handle err and response
                    if (err) console.log(err);
                    else console.log(response);
                });
                simpleGet('https://people.googleapis.com/v1/people/me/connections?pageSize=500&requestMask.includeField=person.email_addresses%2Cperson.names&access_token=' + tokens.access_token, function(err, res) {
                    if (err) throw err;
                    var persons = '';
                    res.on('data', function(data) {
                        persons += data;
                    });
                    res.on('end', function() {
                        persons = JSON.parse(persons);
                        emailsOfPersons = persons.connections.filter(val => val.emailAddresses)
                                                             .map(val=>val.emailAddresses[0].value);
                        pageRenderer.emit('emailsReady');
                    });
                    res.on('error', function() {
                        console.log('There was an error. While streaming the data.')
                    });
                });
            });
        
        pageRenderer.on('emailsReady', () => {
           var locals = {
                title: 'My sample app',
                url: gapi.url,
                emails: emailsOfPersons
            }; 
           res.render('index.jade', locals);
        });
    });
});

var server = app.listen(3000);

console.log('Express server started on port %s', server.address().port)
