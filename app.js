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

app.locals.appName = 'My App';

app.use(morgan('combined'));
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));

app.get('/', (req, res) => {
    var locals = {
        title: 'This is my sample app',
        url: gapi.url
    };
    res.render('index.jade', locals);
});

app.get('/oauth2callback', (req, res) => {
    var code = req.query.code;
    var Persons = [];
    var pageRenderer = new EventEmitter();
    gapi.client.getToken(code, (err, tokens) => {
        gapi.client.setCredentials(tokens);
        process.nextTick(
            () => {
                gapi.google.plus('v1').people.get({
                    userId: 'me',
                    params: {fields: ['emails','displayName','image']},
                    auth: gapi.client
                }, (err, response) => {
                    // handle err and response
                    if (err) console.log(err);
                    else {
                        console.log(response);
                        app.locals.me = {
                            name: response.displayName,
                            image: (response.image && response.image.url) ? response.image.url : '',
                            email: response.emails[0].value
                        };
                    }
                }); 
                simpleGet('https://people.googleapis.com/v1/people/me/connections?pageSize=500&requestMask.includeField=person.email_addresses%2Cperson.names&access_token=' + tokens.access_token, (err, res) => {
                    if (err) throw err;
                    var persons = '';
                    res.on('data', (data) => {
                        persons += data;
                    });
                    res.on('end', () => {
                        Persons = JSON.parse(persons).connections
                                                     .filter(person => person.emailAddresses)
                                                     .map((person) =>  { return {name: (person.names) ? person.names[0].displayName : '', email:person.emailAddresses[0].value};});
                        pageRenderer.emit('emailsReady');
                    });
                    res.on('error', () => {
                        console.log('There was an error. While streaming the data.')
                    });
                });
            });

        pageRenderer.on('emailsReady', () => {
            var locals = {
                title: 'My sample app',
                url: gapi.url,
                persons: Persons
            };
            res.render('index.jade', locals);
        });
    });
});

var server = app.listen(3000);

console.log('Express server started on port %s', server.address().port)
