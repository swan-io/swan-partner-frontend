import { EOL } from "node:os";
import { getLastMessages } from "../../tests/utils/twilio";

const startDate = new Date();
startDate.setDate(startDate.getHours() - 1);

getLastMessages({ startDate })
  .then(messages => console.log(messages.join(EOL)))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
