document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // To send e-mails
  document.querySelector('#compose-form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
    })
    .catch(error => {
      console.log("Error: ", error);
    });
    load_mailbox('sent');
    return false;
  };

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the e-mails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);
    emails.forEach(email => getEmails(email));

    function getEmails(contents) {
      if (contents.read === true) {
        classRead = "read";
      } else {
        classRead = "";
      }

      const element = document.createElement('div');
      element.className = `inboxEmails ${classRead}`;
      element.innerHTML = `<div class="sender">${contents.sender}</div>
                           <div class="subject">${contents.subject}</div>
                           <div class="timestamp">${contents.timestamp}</div>`;
      element.addEventListener('click', function() {
        console.log('This element has been clicked!'),

        // To mark the email as read
        fetch(`/emails/${contents.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        });

        // Call the function to load the e-mail
        load_email(contents.id, mailbox);
      });
      document.querySelector('#emails-view').append(element);
    }
  })
  .catch((error) => {
        console.error('Error:', error);
  });
}

function load_email(email_id, mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').innerHTML = "";


  // Get the e-mail
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);
    if (email.archived === false) {
      archive_value = true;
      archive_btn = "Archive";
    } else {
      archive_value = false;
      archive_btn = "Unarchive";
    }

    // Hide the archive button in the sent e-mails
    let hide = "";
    if (mailbox === "sent") {
      hide = "hidden";
    }

    document.querySelector('#email-view').innerHTML = `<div><strong>From:</strong> ${email.sender}</div>
                         <div><strong>To:</strong> ${email.recipients}</div>
                         <div><strong>Subject:</strong> ${email.subject}</div>
                         <div><strong>Timestamp:</strong> ${email.timestamp}</div>
                         <button class="btn btn-sm btn-outline-primary" onclick="load_reply(${email.id})" id="reply">Reply</button>
                         <button ${hide} class="btn btn-sm btn-outline-primary" onclick="archive(${email_id}, ${archive_value})" id="archive">${archive_btn}</button>
                         <hr>
                         <div id="body">${email.body}</div>`;

    document.querySelector('#body').innerHTML = document.querySelector('#body').innerHTML.replace(/\n/g, '<br>\n');

  })
  .catch((error) => {
        console.error('Error:', error);
  });

}

function archive(email_id, archive_value){
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archive_value
    })
  })
  .catch((error) => {
        console.error('Error:', error);
  });
  load_mailbox('inbox');
  return false;
}

function load_reply(email_id) {
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);
    compose_email();

    // Fill with reply composition fields
    document.querySelector('#compose-recipients').value = email.sender;

    if (email.subject.search('Re:')) {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    } else {
      document.querySelector('#compose-subject').value = email.subject;
    }
    document.querySelector('#compose-body').value = `\n\n---------------------------------------------------------------\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n`;

  })
  .catch((error) => {
        console.error('Error:', error);
  });

}
