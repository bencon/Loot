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

    #print soup.link
    results = []
    #for link in soup.find_all('link'):
    for item in soup.find_all({'item' : True}):
        linkDescriptionArr = []
        info = ""
        for link in item.find('link'):
            checkLinkDatabase(link.string)
            linkDescriptionArr.append(link.string)
        for title in item.find("title"):
            info += str(title.string)
        for description in item.find("description"):
            info += str(description.string)
        info = info.replace('\n', ' ').replace('\r', '')
        linkDescriptionArr.append(info)
        results.append(linkDescriptionArr)

    return

    coords=[]
    addresses=[]
    for item in results:
        print "\r"
        print item[1]
        r = requests.get(item[0]) #item[0] is a link from the rss feed
        if (r.status_code == 200):
            newSoup = BeautifulSoup(r.text)
            for link in newSoup.find_all('a'):
                url = link.get('href')
                if (url and "maps.google.com" in link.get('href')):
                    print (link.get('href'))
                    splitString = link.get('href').split('@')
                    attempt2 = link.get('href').split('?q=loc')
                    if (len(splitString) > 1 and splitString[1]):
                        coordinates = splitString[1]
                        print coordinates + " <----- SUCCESS"
                        # Put coordinates in array form and add coordinates/ description pair to array
                        coords.append([coordinates.split(','), item[1]])
                    elif (len(attempt2) > 1):
                        address = attempt2[1]
                        print address + "<------ SUCCESS V2"
                        addresses.append([address, item[1]])


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

    for arr in addresses:
        field = ET.SubElement(root,"AddressString")
        addr = ET.SubElement(field,'addr')
        description = ET.SubElement(field,'desc')
        addr.text = (str)(arr[0])
        description.text = arr[1]


    tree = ET.ElementTree(root)
    tree.write("coords.xml")

def checkLinkDatabase(link):
    """
    Checks an xml file to see whether this item has already been checked before, if not adds
    the link to the database
    Will eventually be used to block announcements of new items
    """
    tree = ET.parse('previouslyDiscoveredLoot.xml')
    root = tree.getroot()
    for loot in root.findall('loot'):
        if (loot.get('stuff') == link):
            print "link already in database"
            return

    # Otherwise add loot to document if it was not found
    newLoot = ET.SubElement(root,'loot')
    newLoot.set("stuff",link)
    root.append(newLoot)
    print "New stuff found!"
    tree.write("previouslyDiscoveredLoot.xml")

if __name__ == "__main__":
    parseCraigslistRSS('https://philadelphia.craigslist.org/zip/index.rss');  #craigslist free
    #parseCraigslistRSS('https://philadelphia.craigslist.org/search/sss?format=rss');
    #parseCraigslistRSS('https://philadelphia.craigslist.org/search/sss?query=glass%20carboy&format=rss');  #glass carboy search

