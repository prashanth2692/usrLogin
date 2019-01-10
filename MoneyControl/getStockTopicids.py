import requests
import json


res = requests.get('https://www.moneycontrol.com/mccode/common/autosuggestion_solr.php?classic=true&query=bpl&type=1&format=json&callback=suggest1')

pObj = json.loads(res.content.decode(encoding='utf-8'))
print(pObj)