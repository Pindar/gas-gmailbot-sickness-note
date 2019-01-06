const scriptProperties: GoogleAppsScript.Properties.Properties = PropertiesService.getScriptProperties();
const ORGANISATION: string = scriptProperties.getProperty('ORGANISATION') || '';
const REPLY_TEXT: string[] = (scriptProperties.getProperty('REPLY_TEXT') || '').split(';');
const LABEL_NAME: string = scriptProperties.getProperty('LABEL_NAME') || '';
const MAIL_RECOGNIZER_ENDPOINT = scriptProperties.getProperty('RECOGNIZER_SERVICE_ENDPOINT');
const me: string = Session.getActiveUser().getEmail();

/**
* Run this setup once manually to have everything in place like labels
*
*/
function setup() {
  GmailApp.createLabel(LABEL_NAME);
  createTrigger();
}

function main() {
  detectMailsOfSickColleagues();
}

function getLabel() {
  return GmailApp.getUserLabelByName(LABEL_NAME);
}

function mailThreadWasInitiatedByMe(message: GoogleAppsScript.Gmail.GmailMessage) {
  return message.getFrom().toLowerCase().indexOf(me) !== -1;
}

function detectSicknessNote(message: GoogleAppsScript.Gmail.GmailMessage) {
  let data = {
    'test_text': message.getPlainBody().split(/^(-{2,}) *(?=(?:\r?\n|\r)+)/m)[0]
  };
  let options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  };
  let response: GoogleAppsScript.URL_Fetch.HTTPResponse = UrlFetchApp.fetch(`${MAIL_RECOGNIZER_ENDPOINT}`, options);
  let responseObj = JSON.parse(response.getContentText());
  return responseObj['is_sick_note'] && responseObj.is_sick_note > 0.9
}

function isDirectMail(message: GoogleAppsScript.Gmail.GmailMessage) {
  return message.getTo().toLowerCase().indexOf(me) != -1;
}

function isFromOrganisation(message) {
  return message.getFrom().toLowerCase().indexOf(ORGANISATION) != -1;
}

function hasThreadLabel(thread: GoogleAppsScript.Gmail.GmailThread) {
  return thread.getLabels().map(function (label) {
    return label.getName() === LABEL_NAME;

  }).reduce(function (previousValue: boolean, currentValue: boolean) {
    return previousValue || currentValue;
  }, false);
}

function getMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function detectMailsOfSickColleagues() {
  Logger.log('Start detecting...');
  // Process only first X emails in your Inbox
  let threads: GoogleAppsScript.Gmail.GmailThread[] = GmailApp.getInboxThreads(0, 20);
  let firstMessage: GoogleAppsScript.Gmail.GmailMessage;

  for (let i = 0; i < threads.length; i++) {
    firstMessage = threads[i].getMessages()[0];

    if (mailThreadWasInitiatedByMe(firstMessage)) {
      // Logger.log("Mail was send by myself: %s", firstMessage.getFrom(), firstMessage.getSubject());
      continue;
    }

    if (isDirectMail(firstMessage) &&
    !hasThreadLabel(threads[i]) &&
    isFromOrganisation(firstMessage) &&
    detectSicknessNote(firstMessage)) {

      Logger.log('Mail is sicknes note of colleague: %s, %s, %s', firstMessage.getFrom(), firstMessage.getPlainBody(), firstMessage.getTo());
      firstMessage.reply(getMessage(REPLY_TEXT));
      getLabel().addToThread(threads[i]);
    }
  }
  Logger.log('Done.');
}

function createTrigger() {
  ScriptApp.newTrigger('main')
  .timeBased()
  .everyHours(1)
  .create();
}
