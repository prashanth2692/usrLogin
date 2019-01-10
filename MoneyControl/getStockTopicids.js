const axios = require('axios')
const HTMLParser = require('node-html-parser');
const fs = require('fs')

const nseJsonArray = require('../ICICIDirect/output/NSE_EQUITY_L_ARRAY.json')

// testing
// console.log(nseJsonArray[0])


// the money control autosuggest reponse returns "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript" type and not object
// so need to mock suggest1 function, inside which the required response is passed as argument
function suggest1(arr) {
  return arr
}

const promises1 = []
const promises2 = []
const promises3 = []
const messageBoardLinks = {}

nseJsonArray.forEach((nj, index) => {
  let promise = axios.get('https://www.moneycontrol.com/mccode/common/autosuggestion_solr.php?classic=true&query=' + nj.isin_number + '&type=1&format=json&callback=suggest1').then(resp => {
    // console.log(resp.data)
    // let obj = JSON.parse(resp.data)
    let obj = eval(resp.data)
    // console.log(obj.length)
    if (obj && obj.length > 0) {
      let reqLink = obj[0].link_src
      let promise2 = axios.get(reqLink).then(resp => {
        const parsed = HTMLParser.parse(resp.data)
        let result = parsed.querySelector("#compid_imp")
        if (result && result.attributes.value) {
          // console.log(result)
          // console.log(result.attributes.value) // this will get the html which has the actuial message board link

          let promise3 = axios.post("https://www.moneycontrol.com/stocks/company_info/stock-messages.php", "sc_id=BPL").then(resp => {
            const parsed = HTMLParser.parse(resp.data)
            let result = parsed.querySelectorAll("a.bl_11")
            // console.log(result)
            if (result && result.length > 0) {
              messageBoardLinks[nj.symbol] = result[0].attributes.href
            }

            // verification
            // result.forEach(r => {
            //   if (r.innerHTML == 'More Messages »') {
            //     console.log(r.innerHTML, r.attributes.href)
            //     // sample output below. Required first link
            //     // More Messages » https://mmb.moneycontrol.com/india/messageboard/view_topic_msgs.php?topic_id=1642&que=latest
            //     // More Messages » https://mmb.moneycontrol.com/india/messageboard/view_topic_msgs.php?topic_id=1642&pgno=1&que=queries
            //     // More Messages » https://mmb.moneycontrol.com/india/messageboard/view_topic_msgs.php?topic_id=1642&que=active
            //     // More Messages » https://mmb.moneycontrol.com/india/messageboard/view_topic_msgs.php?topic_id=1642&que=activeborder
            //   }
            // })
            // verification - end

          }).catch(err => {
            console.error(index, "failed to fetch partical message board html for messageboard link for: ", nj.symbol)
          });

          promises3.push(promise3)
        } else {
          console.error(index, "failed to fetch partical message board html for messageboard link for: ", nj.symbol)
        }
      }).catch(err => {
        console.error(index, "no autosuggest results found for symbol: ", nj.symbol)
      })
      promises2.push(promise2)
    } else {
      console.error(index, "no autosuggest results found for symbol: ", nj.symbol)
    }
  }).catch(err => {
    console.error(index, "no autosuggest results found for symbol: ", nj.symbol)
  })

  promises1.push(promise)
})

axios.all(promises1).then(responses1 => {
  axios.all(promises2).then(responses2 => {
    axios.all(promises3).then(responses3 => {
      fs.writeFile('messageBoardLinks.json', messageBoardLinks, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log('written file!')
        }
      })
    }).catch(err3 => {
      console.log("err3")
    })
  }).catch(err2 => {
    console.log("err2")
  })
}).catch(err1 => {
  console.log("err1")
})
