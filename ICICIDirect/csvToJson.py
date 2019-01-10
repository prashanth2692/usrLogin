import csv
import json

COMMON_SYMBOL = 'symbol'
COMMON_NAME_OF_COMPANY = 'name_of_company'
COMMON_ISIN_NUMBER = 'isin_number'
COMMON_SERIES = 'series'
COMMON_DATE_OF_LISTING = 'date_of_listing'
COMMON_PAID_UP_VALUE = 'paid_up_value'
COMMON_MARKET_LOT = 'market_lot'
COMMON_FACE_VALUE = 'face_value'

# NSE stock list parsing for ISIN and Stock code mapping
nseList = []
nseDict = {}
nseISINDict = {}

NSE_COLUMN_SYMBOL = 'SYMBOL'
NSE_COLUMN_NAME_OF_COMPANY = 'NAME OF COMPANY'
NSE_COLUMN_ISIN_NUMBER = ' ISIN NUMBER'
NSE_COLUMN_SERIES = ' SERIES'
NSE_COLUMN_DATE_OF_LISTING = ' DATE OF LISTING'
NSE_COLUMN_PAID_UP_VALUE = ' PAID UP VALUE'
NSE_COLUMN_MARKET_LOT = ' MARKET LOT'
NSE_COLUMN_FACE_VALUE = ' FACE VALUE'

with open("..\\..\\..\\Stocks\\NSE_EQUITY_L.csv", 'r', encoding='cp850') as nseListFile:
  csvReader = csv.DictReader(nseListFile)
  for row in csvReader:
    temp = {}
    temp[COMMON_SYMBOL] = row[NSE_COLUMN_SYMBOL]
    temp[COMMON_NAME_OF_COMPANY] = row[NSE_COLUMN_NAME_OF_COMPANY]
    temp[COMMON_ISIN_NUMBER] = row[NSE_COLUMN_ISIN_NUMBER]
    temp[COMMON_SERIES] = row[NSE_COLUMN_SERIES]
    temp[COMMON_DATE_OF_LISTING] = row[NSE_COLUMN_DATE_OF_LISTING]
    temp[COMMON_PAID_UP_VALUE] = row[NSE_COLUMN_PAID_UP_VALUE]
    temp[COMMON_MARKET_LOT] = row[NSE_COLUMN_MARKET_LOT]
    temp[COMMON_FACE_VALUE] = row[NSE_COLUMN_FACE_VALUE]
    
    # print(row['SYMBOL'], row['NAME OF COMPANY'], row['ISIN NUMBER'])
    nseList.append(temp)
    nseDict[row[NSE_COLUMN_SYMBOL]] = temp
    nseISINDict[row[NSE_COLUMN_ISIN_NUMBER]] = temp



# for fn in ['NSE_EQUITY_L_ARRAY.json', 'NSE_EQUITY_L_DICT_SYMBOL.json', 'NSE_EQUITY_L_DICT_ISIN.json']:
#   with open('output\\' + fn, 'w') as jsonFile1:
#     json.dump(nseList, jsonFile1)
#     print('written to file:', fn)  
fileName = 'NSE_EQUITY_L_ARRAY.json'
with open('output\\' + fileName, 'w') as jsonFile1:
  json.dump(nseList, jsonFile1)
  print('written to file:', fileName)

fileName = 'NSE_EQUITY_L_DICT_SYMBOL.json'
with open('output\\' + fileName, 'w') as jsonFile1:
  json.dump(nseDict, jsonFile1)
  print('written to file:', fileName)

fileName = 'NSE_EQUITY_L_DICT_ISIN.json'
with open('output\\' + fileName, 'w') as jsonFile1:
  json.dump(nseISINDict, jsonFile1)
  print('written to file:', fileName)