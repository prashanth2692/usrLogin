# Reading an excel file using Python
import xlrd
import fnmatch
import os
import json

relativeFilePaths = []

firstRow = 9
firstColumn = 1

pathToTransactions = '../../../Stocks/portfolio/'
for file in os.listdir(pathToTransactions):
    if fnmatch.fnmatch(file, 'YE1705_tradebook*.xlsx'):
        relativeFilePaths.append(pathToTransactions + file)

tx = []
for filePath in relativeFilePaths:
    # Give the location of the file
    loc = (filePath)

    # To open Workbook
    wb = xlrd.open_workbook(loc)
    sheet = wb.sheet_by_index(0)

    # for col in range(firstColumn, sheet.ncols):
    headerCells = sheet.row_slice(rowx=9, start_colx=1, end_colx=sheet.ncols - 1)

    for cell in headerCells:
      cell.value = '_'.join(cell.value.split(' '))
    # print(headerCells)
    # print(headerCells[0])
    # print(headerCells[0].value)

    transactions = []
    for rowNumber in range(10, sheet.nrows):
        transaction = {}
        dataCells = sheet.row_slice(rowx=rowNumber, start_colx=1, end_colx=sheet.ncols - 1)
        for i in range(len(dataCells)):
            transaction[headerCells[i].value] = dataCells[i].value
        transactions.append(transaction)

    tx.append(transactions)

print('Total transactions: ', len(tx[0]) + len(tx[1]))

with open('./testTransactions.json', 'w') as f:
    json.dump(tx, f)

    # For row 0 and column 0
    # print(sheet.cell_value(9, 10))
    # print(sheet.nrows)
    # print(sheet.ncols)
    # while
