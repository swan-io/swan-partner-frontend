import { EOL } from "os";
import { getLastMessages } from "../../tests/utils/twilio";

getLastMessages()
  .then(messages => console.log(messages.join(EOL)))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
