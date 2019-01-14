import csv
import json

COMMON_ISIN = 'isin'
COMMON_SYMBOL = 'symbol'
COMMON_ALLOCATED_QUANTITY = 'allocated_quantity'
COMMON_CURRENT_MARKET_PRICE = 'current_market_price'
COMMON_NAME_OF_COMPANY = 'name_of_company'

# NSE stock list parsing for ISIN and Stock code mapping
nseList = []
nseDict = {}
nseISINDict = {}

NSE_COLUMN_SYMBOL = 'SYMBOL'
NSE_COLUMN_NAME_OF_COMPANY = 'NAME OF COMPANY'
NSE_COLUMN_ISIN_NUMBER = ' ISIN NUMBER'


with open("..\\..\\..\\Stocks\\NSE_EQUITY_L.csv", 'r', encoding='cp850') as nseListFile:
  csvReader = csv.DictReader(nseListFile)
  for row in csvReader:
    temp = {}
    temp[COMMON_SYMBOL] = row[NSE_COLUMN_SYMBOL]
    temp[COMMON_NAME_OF_COMPANY] = row[NSE_COLUMN_NAME_OF_COMPANY]
    temp[COMMON_ISIN] = row[NSE_COLUMN_ISIN_NUMBER]
    # print(row['SYMBOL'], row['NAME OF COMPANY'], row['ISIN NUMBER'])
    nseList.append(temp)
    nseDict[row[NSE_COLUMN_SYMBOL]] = temp
    nseISINDict[row[NSE_COLUMN_ISIN_NUMBER]] = temp


# test
# print('BPL Ltd.', nseDict['BPL'][COMMON_NAME_OF_COMPANY], nseDict['BPL'][COMMON_ISIN])

########## ------------------------------------------ ################
# Zerodha stock holdings listing

zerodhaHoldingDict = {}
zerodhaHoldingIsinDict = {}
Z_COL_SYMBOL = 'Instrument'
Z_COL_ALLOCATED_QUANTITY = 'Qty.'
Z_COL_AVERAGE_COST = 'Avg. cost'
Z_COL_LTP = 'LTP'
# Zerodha list parsing
with open("..\\..\\..\\Stocks\\portfolio\\YE1705_holdings_05-01-2019.csv", 'r') as zerodhCsv:
  csvReader = csv.DictReader(zerodhCsv)
  for row in csvReader:
    temp = {}
    temp[COMMON_SYMBOL] = row[Z_COL_SYMBOL]
    temp[COMMON_ALLOCATED_QUANTITY] = row[Z_COL_ALLOCATED_QUANTITY]
    temp[COMMON_CURRENT_MARKET_PRICE] = row[Z_COL_LTP]

    if row[Z_COL_SYMBOL] in nseDict:
      isinOfStock = nseDict[row[Z_COL_SYMBOL]][COMMON_ISIN]
      zerodhaHoldingIsinDict[isinOfStock] = temp

      # test
      # print('zerodha - ', row[Z_COL_SYMBOL], isinOfStock)

print('zerodha test - ', zerodhaHoldingIsinDict['INE110A01019'][COMMON_SYMBOL])

########## ------------------------------------------ ################
# ICICIDirect parsing

# ID -> ICICI Direct
ID_COL_ISIN = 'ISIN'
ID_COL_Allocated_Quantity = 'Allocated Quantity'
ID_COL_CURRENT_MARKET_PRICE = 'Current Market Price'
ID_COL_STOCK_NAME = 'Stock Name'

ICICIDirectISINDict = {}
with open("..\\..\\..\\Stocks\\portfolio\\8504526259_Demat_holdings_05-01-2019.csv", 'r') as csvFile:
  csvReader = csv.DictReader(csvFile)
  for row in csvReader:
    temp ={}
    temp[COMMON_ISIN] = row[ID_COL_ISIN]
    temp[COMMON_ALLOCATED_QUANTITY] = row[ID_COL_Allocated_Quantity]
    temp[COMMON_CURRENT_MARKET_PRICE] = row[ID_COL_CURRENT_MARKET_PRICE]

    if row[ID_COL_ISIN] in nseISINDict:
      temp[COMMON_SYMBOL] = nseISINDict[row[ID_COL_ISIN]][COMMON_SYMBOL]
    temp['stock_name'] = row[ID_COL_STOCK_NAME]
    ICICIDirectISINDict[row[ID_COL_ISIN]] = temp

# test
print('icici direct test test - ', ICICIDirectISINDict['INE110A01019']['stock_name'])


consolidatedHoldings = {}

for isin in zerodhaHoldingIsinDict:
  consolidatedHoldings[isin] = zerodhaHoldingIsinDict[isin]

for isin in ICICIDirectISINDict:
  if isin in consolidatedHoldings:
    consolidatedHoldings[isin][COMMON_ALLOCATED_QUANTITY] = float(consolidatedHoldings[isin][COMMON_ALLOCATED_QUANTITY]) + float(ICICIDirectISINDict[isin][COMMON_ALLOCATED_QUANTITY])
  else:
    consolidatedHoldings[isin] = ICICIDirectISINDict[isin]


# print consolidated holdings data
# enumerate() returns index and value
for index, key in enumerate(consolidatedHoldings):
  print(index, ', ', consolidatedHoldings[key][COMMON_SYMBOL], consolidatedHoldings[key][COMMON_ALLOCATED_QUANTITY], consolidatedHoldings[key][COMMON_CURRENT_MARKET_PRICE])

# calculating current total worth
totalWorth = 0
for key in consolidatedHoldings:
  totalWorth += float(consolidatedHoldings[key][COMMON_ALLOCATED_QUANTITY]) * float(consolidatedHoldings[key][COMMON_CURRENT_MARKET_PRICE])

print('Total worth:', totalWorth)

# dumping consolidated portfolio to json file
data =[]
data_obj = []
for key in consolidatedHoldings:
  temp = []
  temp_obj = {}
  temp.append(consolidatedHoldings[key][COMMON_SYMBOL])
  temp.append(consolidatedHoldings[key][COMMON_ALLOCATED_QUANTITY])
  temp.append(consolidatedHoldings[key][COMMON_CURRENT_MARKET_PRICE])

  temp_obj[COMMON_SYMBOL] = consolidatedHoldings[key][COMMON_SYMBOL]
  temp_obj[COMMON_ALLOCATED_QUANTITY] = consolidatedHoldings[key][COMMON_ALLOCATED_QUANTITY]
  temp_obj[COMMON_CURRENT_MARKET_PRICE] = consolidatedHoldings[key][COMMON_CURRENT_MARKET_PRICE]
  
  data.append(temp)
  data_obj.append(temp_obj)


fileName = 'consolidatedFoldings.json'
fileName_obj = 'consolidatedHoldings_obj.json'
with open('output\\' + fileName, 'w') as jsonFile1:
  json.dump(data, jsonFile1)
  print('written to file:', fileName)


with open('output\\' + fileName_obj, 'w') as jsonFile1:
  json.dump(data_obj, jsonFile1)
  print('written to file:', fileName_obj)