exports = {
  onTicketCreateHandler: async function (args) {
    var ticketID = args.data.ticket.id;
    console.log(ticketID);
    try {
      console.log("Ticket", args.data.ticket.id);
      var ticketID = args.data.ticket.id;
      let workspace = await $request.invokeTemplate("getTicketdata", {
        context: {
          id: ticketID,
        },
      });
      var workspaceJSON = JSON.parse(workspace.response);
      // console.log(workspaceJSON);

      var contractID = workspaceJSON.ticket.custom_fields.contract_id;
      console.log(contractID);
      var consumedTimeonTicket =
        workspaceJSON.ticket.custom_fields.consumed_time;

      if (consumedTimeonTicket === null) {
        console.log("No consumed time is updated on ticket");
        return;
      }

      if (contractID === null) {
        // Run code when contractID is null
        console.log("contractID is null");
        return;
      } else {
        // Run code when contractID is not null
        console.log("contractID is not null");
        let ticketTime = await $request.invokeTemplate("getTime", {
          context: {
            id: ticketID,
          },
        });
        var workspaceJSON = JSON.parse(ticketTime.response);
        if (workspaceJSON.time_entries.length === 0) {
          return;
        }
        var timeSpendonTicket = workspaceJSON.time_entries[0].time_spent;
        console.log(timeSpendonTicket); //03:00

        let customObject = await $request.invokeTemplate("getCustomObject", {
          context: {
            id: contractID,
          },
        });
        var customObjectJSON = JSON.parse(customObject.response);
        console.log(customObjectJSON.records[0].data);

        var remainingHours =
          customObjectJSON.records[0].data.total_remaining_hours; //63
        var recordID = customObjectJSON.records[0].data.bo_display_id; //01

        console.log("Contract Record ID: " + recordID);
        const result = subtractTime(remainingHours, timeSpendonTicket);
        console.log(result); //60

        var entitlementHhours =
          customObjectJSON.records[0].data.total_entitlement_hours;

        let finalTotal = entitlementHhours - result; //100-60 = 40
        var textfinalTotal = finalTotal.toString();
        console.log("entitlementHhours", entitlementHhours);
        console.log("finalTotal", finalTotal);

        let editObjectRecords = await $request.invokeTemplate(
          "putCustomObject",
          {
            context: {
              objects_id: contractID,
              records_id: recordID,
            },
            body: JSON.stringify({
              data: {
                total_remaining_hours: result, //60
                total_consumed_hours: textfinalTotal, //40
              },
            }),
          }
        );
        var customObjectJSON = JSON.parse(editObjectRecords.response);

        let edittickettRecords = await $request.invokeTemplate(
          "editTicketdata",
          {
            context: {
              id: ticketID,
            },
            body: JSON.stringify({
              custom_fields: {
                consumed_time: null,
              },
            }),
          }
        );
        var edittickettRecordsJSON = JSON.parse(edittickettRecords.response);
        console.log("edittickettRecordsJSON", edittickettRecordsJSON);
      }
    } catch (err) {
      console.log(err);
    }
  },
};

function subtractTime(remainingHours, timeSpent) {
  // Convert the remaining hours to a number
  const remainingHoursNum = parseFloat(remainingHours);

  // Convert the time spent to hours and minutes
  const [hours, minutes] = timeSpent.split(":");
  const timeSpentInHours = parseFloat(hours) + parseFloat(minutes) / 60;

  // Subtract the time spent from the remaining hours
  const result = remainingHoursNum - timeSpentInHours; //63-03 = 60

  // Format the result as a string with two decimal places
  const formattedResult = result.toFixed(2);

  return formattedResult; //60
}
