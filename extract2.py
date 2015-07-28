# Packages Required:
#       requests
#       BeautifulSoup
#       ...

import xml.etree.cElementTree as ET
import requests
import re
from bs4 import BeautifulSoup


def parseCraigslistRSS(hyperlink):
    """
    From the given link, extract the coordinates and description of all items
    with sufficient information
    """

    r = requests.get(hyperlink)
    print r.status_code
    print r.headers['content-type']

    soup = BeautifulSoup(r.text, 'xml')
    print (soup.prettify())

    print soup.link
    #print soup
    results = []
    print "start"
    #for link in soup.find_all('link'):
    for item in soup.find_all({'item' : True}):
            linkDescriptionArr = []
            info = ""
            for link in item.find('link'):
                linkDescriptionArr.append(link.string)
            for title in item.find("title"):
                info += str(title.string)
            for description in item.find("description"):
                info += str(description.string)
            linkDescriptionArr.append(info)
            results.append(linkDescriptionArr)

            #print item
    for arr in results:
        print arr
    maps = []

    coords=[]
    for item in results:
            r = requests.get(item[0])
            #print r.status_code
            if (r.status_code == 200):
                    #print "Yes"
                    newSoup = BeautifulSoup(r.text)
                    for link in newSoup.find_all('a'):
                            url = link.get('href')
                            if (url and "maps.google.com" in link.get('href')):
                                    #print (link.get('href'))
                                    #search = re.search(
                                    for a in (link.get('href')).split('/'):
                                            b = a.replace('@','')
                                            if b:
                                                    if ((b[0]).isdigit()):
                                                            c = b.split(',')
                                                            print c
                                                            coords.append([c, item[1]])

    print coords
    ####  Generate XML document wtih coordinate data
    root = ET.Element("root")

    for arr in coords:
            field = ET.SubElement(root,"loc")
            x = ET.SubElement(field,'x')
            y = ET.SubElement(field,'y')
            description = ET.SubElement(field,'desc')
            x.text = (str)(arr[0][0])
            y.text = (str)(arr[0][1])
            description.text = arr[1]

    tree = ET.ElementTree(root)
    tree.write("coords.xml")


if __name__ == "__main__":
    parseCraigslistRSS('https://philadelphia.craigslist.org/zip/index.rss')

