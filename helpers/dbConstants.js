let dbConstants = {
  collections: {
    ICICITransactions: "ICICITransactions",
    ZerodhaTransactions: "ZerodhaTransactions",
    logs: "logs",
    nse_icici_symbol_map: "nse_icici_symbol_map",
    staticIciciHoldings: "staticIciciHoldings",
    transactions: "transactions",
    testTransactions: "test_transactions",
    moneyControlMessages: "money_control_messages",
    moneyControlMessages_test: "money_control_messages_test",
    messageBoardTopicids: "message_board_topicids",
    messagesArchiveStatus: "messages_archive_status",
    messagesArchiveStatus_test: "messages_archive_status_test",
    dailyQuotesNse_trial: "dayQuotes_nse_trial",
    moneycontrolSpamUsers: "moneycontrol_spam_users",
    msInUsInCs: "ms_us_cs", // This collection has list of universities with location rank details
    universityNotes: "university_notes",
    phoneBatteryLogs: "phoneBatteryLogs",
    users: "users",
    googleSession: "google_session",
    userSession: "user_session"
  },
  dbs: {
    mydb: "mydb",
  },
};

module.exports = dbConstants;
