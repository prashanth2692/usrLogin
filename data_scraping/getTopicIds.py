from bs4 import BeautifulSoup
import requests
import logging

fileName = "logs\\log_" + str(datetime.now().strftime("%m-%d_%H-%M-%S")) + ".log"
logging.basicConfig(filename=fileName, format='%(levelname)s %(asctime)s %(message)s', level=logging.DEBUG)

def getFile(threadnum, pagenum):
    while True:
        try:
            response = requests.get("http://xossip.com/showthread.php?t="+str(threadNum)+"&page="+ str(pageNum))
            return response
        except Exception as e:
            logging.error("error requesting page: " + str(pagenum))
            pass



response = requests.get("http://xossip.com/showthread.php?t="+str(threadNum)+"&page="+ str(pageNum))
soup = BeautifulSoup(response, "html5lib")