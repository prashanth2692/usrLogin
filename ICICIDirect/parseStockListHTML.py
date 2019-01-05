from bs4 import BeautifulSoup
import string
import json


# for python 2.x
# soup = BeautifulSoup(fle, 'html5lib')

# for python 3.x
# soup = BeautifulSoup(fle, 'html.parser')



completeData1 = {}
completeData2 = []

# string.ascii_uppercase.__add__(str(1)) -> 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1'
for ele in string.ascii_uppercase.__add__(str(1)):
  data1 = {}
  data2 = []
  with open('output\\' + ele + '.html', 'r') as fle:
    soup = BeautifulSoup(fle, 'html.parser')
    for tr in soup.table.tbody.find_all('tr'):

      # select 2nd td which has 3 elements with scrip details
      # 1st element is ICICI scrip code
      # 2nd element is  '<hr/>'
      # 3rd element is scrip name (as per NSE)
      # sample code
      # for td in tr.select('td:nth-of-type(2)')[0].contents:
      #   print(str(td).strip())

      secondTd = tr.select('td:nth-of-type(2)')[0].contents

      # geting expected names
      iciciScripCode = str(secondTd[0]).strip()
      scripName = str(secondTd[2]).strip()

      # json type 1
      data1[iciciScripCode] = scripName
      completeData1[iciciScripCode] = scripName

      #json type 2
      stockObect = {}
      stockObect['iciciScripCode'] = iciciScripCode
      stockObect['scripName'] = scripName
      data2.append(stockObect)
      completeData2.append(stockObect)

      # writing alphabetically separated list to file
      with open('output\\' + ele + '.json', 'w') as jsonFile1:
        json.dump(data1, jsonFile1)

      with open('output\\' + ele + '_v2.json', 'w') as jsonFile1:
        json.dump(data2, jsonFile1)


# writing complete list to files
with open('output\\completeDate.json', 'w') as jsonFile1:
  json.dump(completeData1, jsonFile1)

with open('output\\completeDate_v2.json', 'w') as jsonFile1:
  json.dump(completeData2, jsonFile1)
