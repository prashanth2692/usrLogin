const {URL} = require('url');
const https = require('https');

const messageBoardURL = new URL('https://mmb.moneycontrol.com/index.php')

const messageBoardQueryParams = new URLSearchParams({
  q: 'topic/ajax_call',
  section: 'get_messages',
  is_topic_page: 1,
  offset: 0,
  lmid: null,
  isp:0,
  gmt: 'tp_lm',
  tid: 1642,
  pgno: 1
})

messageBoardURL.search = messageBoardQueryParams

console.log('request URL: ' + messageBoardURL.href + '\n')
https.get(messageBoardURL.href, (resp) => {
  response = ''
  resp.on('data', (chunk) => {
    response += chunk
  })

  resp.on('end', () => {
    console.log('response: \n')
    JSON.parse(response).map((msg, index) => console.log(index + ' : ' + msg.full_message))
  })
}).on('error', err => {
  console.log('error ' + err.message)
})