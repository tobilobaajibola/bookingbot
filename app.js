/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);


// bot.dialog('/', function (session) {
//     session.send(session.message.text + 'How can i be of help?' );
// });

// This is a dinner reservation bot that uses multiple dialogs to prompt users for input.
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Welcome to Transport2Camp.");
        session.beginDialog('askforstatedeparture');
    },
    function (session, results) {
        session.dialogData.departureState = results.response;
        session.beginDialog('askforstatedestination');
    },
    function (session, results) {
        session.dialogData.destinationState = results.response;
        session.beginDialog('askForDateTime');
    },

    function (session, results) {
        session.dialogData.bookingDate = builder.EntityRecognizer.resolveTime([results.response]) ;
        session.beginDialog('askForBookingName');
    },
    function (session, results) {
        session.dialogData.bookingName = results.response;

        // Process request and display reservation details
        session.send(`Reservation confirmed. Reservation details: <br/>Date/Time: ${session.dialogData.bookingDate} <br/>Leaving From: ${session.dialogData.departureState} <br/>Going to: ${session.dialogData.destinationState}  <br/>Booking name: ${session.dialogData.bookingName}`);
        session.endDialog();
    }
]).set('storage', tableStorage); // Register in-memory storage 

// Dialog to ask for a state of departure
bot.dialog('askforstatedeparture', [
    function (session) {
        builder.Prompts.text(session, "Please provide your departure state (e.g.: Lagos)");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);


// Dialog to ask for a destination
bot.dialog('askforstatedestination', [
    function (session) {
        builder.Prompts.text(session, "Please provide your Mobilzation Camp (e.g. Kaduna-NYSC Camp)");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);



// Dialog to ask for a date and time
bot.dialog('askForDateTime', [
    function (session) {
        builder.Prompts.time(session, "Please provide a reservation date and time (e.g.: June 6th at 5pm)");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);





// Dialog to ask for the booking name.
bot.dialog('askForBookingName', [
    function (session) {
        builder.Prompts.text(session, "Who's name will this booking be under?");
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

