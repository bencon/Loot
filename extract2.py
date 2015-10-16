# Packages Required:
#       requests
#       BeautifulSoup
#       ...

import xml.etree.cElementTree as ET
import requests
import re
import string
import os
from bs4 import BeautifulSoup

checkPreviouslyDiscoveredLoot = 1; #set to 0 to re-discover everything
relativePath = os.path.dirname(os.path.realpath(__file__))

def parseCraigslistRSS(hyperlink, debugFile):
    """
    From the given link, extract the coordinates and description of all items
    with sufficient information
    """

    r = requests.get(hyperlink)
    print r.status_code
    print r.headers['content-type']

    onlyAscii = filter(lambda x: x in string.printable, r.text)
    soup = BeautifulSoup(onlyAscii.encode('utf-8'), 'xml')
    print soup.prettify()

    #print soup.link
    results = []
    #for link in soup.find_all('link'):
    for item in soup.find_all({'item' : True}):
        skipItem = False
        linkDescriptionArr = []
        info = ""
        for link in item.find('link'):
            if (checkLinkDatabase(link.string) and checkPreviouslyDiscoveredLoot):
                skipItem = True
                break
            linkDescriptionArr.append(link.string)
        # If item already has been found before, skip it
        if (skipItem):
            continue
        for title in item.find("title"):
            info += str(title.encode('utf-8'))
            #print(info,file=titleFile)
            #debugFile.write(info + "\n")
        for description in item.find("description"):
            info += str(description.encode('utf-8'))
        info = info.replace('\n', ' ').replace('\r', '')
        linkDescriptionArr.append(info)
        results.append(linkDescriptionArr)

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
                        # Put coordinates in array form and add coordinates/ description /hyperlink to array
                        coords.append([coordinates.split(','), item[1], item[0]])
                    elif (len(attempt2) > 1):
                        address = attempt2[1]
                        print address + "<------ SUCCESS V2"
                        addresses.append([address, item[1], item[0]])


    ####  Generate XML document wtih coordinate data
    tree = ET.parse(relativePath + "/coords.xml")
    root = tree.getroot()

    for arr in coords:
        field = ET.SubElement(root,"loc")
        x = ET.SubElement(field,'x')
        y = ET.SubElement(field,'y')
        description = ET.SubElement(field,'desc')
        x.text = (arr[0][0]).decode('utf-8')
        y.text = (arr[0][1]).decode('utf-8')
        description.text = arr[1].decode('utf-8')
        hyperlink = ET.SubElement(field, 'link')
        hyperlink.text = arr[2].decode('utf-8')

    for arr in addresses:
        field = ET.SubElement(root,"AddressString")
        addr = ET.SubElement(field,'addr')
        description = ET.SubElement(field,'desc')
        addr.text = (arr[0]).decode('utf-8')
        description.text = arr[1].decode('utf-8')
        hyperlink = ET.SubElement(field, 'link')
        hyperlink.text = arr[2].decode('utf-8')


    tree = ET.ElementTree(root)
    tree.write(relativePath + "/coords.xml")

def createNewRoot():
    """
    This function is meant to be called at the beginning of extract2.py in order to creat the tree
    which will eventaully overwrite the coords.xml file. Then subsequent calls to ____ will append
    to the xml tree the results of the all rss feeds given to parse
    """
    root = ET.Element("root")
    tree = ET.ElementTree(root)
    tree.write(relativePath + "/coords.xml")

def checkLinkDatabase(link):
    """
    Checks an xml file to see whether this item has already been checked before, if not adds
    the link to the database
    Will eventually be used to block announcements of new items
    """
    found = False
    tree = ET.parse(relativePath +"/previouslyDiscoveredLoot.xml")
    root = tree.getroot()
    for loot in root.findall('loot'):
        if (loot.get('stuff') == link):
            print "link already in database"
            return True

    # Otherwise add loot to document if it was not found
    newLoot = ET.SubElement(root,'loot')
    newLoot.set("stuff",link)
    #root.append(newLoot)  I think this was the cause of the duplicate entries
    print "New stuff found!"
    tree.write(relativePath +"/previouslyDiscoveredLoot.xml")
    return found


if __name__ == "__main__":
    createNewRoot()
    titleFile = open("myTitles",'w')
    #Philly
    parseCraigslistRSS('https://philadelphia.craigslist.org/zip/index.rss', titleFile)  #craigslist free
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/sss?query=glass%20carboy&format=rss', titleFile)  #glass carboy search
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/sss?format=rss&query=home%20brewing&sort=rel', titleFile)  #home brewing search
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/sss?format=rss&query=chest%20freezer&sort=rel', titleFile)  #chest freezer search
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/bik?format=rss&query=53cm%20road%20bike', titleFile) #road bike 53cm
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/bik?format=rss&query=54cm%20road%20bike', titleFile) #road bike 54cm
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/for?format=rss&query=coleman%20cooler', titleFile) # coleman cooler
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/for?format=rss&query=igloo%20cooler', titleFile) # igloo cooler
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/for?format=rss&query=48%20quart%20cooler', titleFile) #48 quart cooler
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/for?format=rss&query=50%20quart%20cooler', titleFile) #50 quart cooler
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/for?format=rss&query=60%20quart%20cooler', titleFile) #60 quart cooler
    parseCraigslistRSS('https://philadelphia.craigslist.org/search/for?format=rss&query=belt%20sander', titleFile) #belt sander
    #delaware
    parseCraigslistRSS('https://delaware.craigslist.org/zip/index.rss', titleFile)  #craigslist free
    parseCraigslistRSS('https://delaware.craigslist.org/search/sss?query=glass%20carboy&format=rss', titleFile)  #glass carboy search
    parseCraigslistRSS('https://delaware.craigslist.org/search/sss?format=rss&query=home%20brewing&sort=rel', titleFile)  #home brewing search
    parseCraigslistRSS('https://delaware.craigslist.org/search/sss?format=rss&query=chest%20freezer&sort=rel', titleFile)  #chest freezer search
    parseCraigslistRSS('https://delaware.craigslist.org/search/bik?format=rss&query=53cm%20road%20bike', titleFile) #road bike 53cm
    parseCraigslistRSS('https://delaware.craigslist.org/search/bik?format=rss&query=54cm%20road%20bike', titleFile) #road bike 54cm
    parseCraigslistRSS('https://delaware.craigslist.org/search/for?format=rss&query=coleman%20cooler', titleFile) # coleman cooler
    parseCraigslistRSS('https://delaware.craigslist.org/search/for?format=rss&query=igloo%20cooler', titleFile) # igloo cooler
    parseCraigslistRSS('https://delaware.craigslist.org/search/for?format=rss&query=48%20quart%20cooler', titleFile) #48 quart cooler
    parseCraigslistRSS('https://delaware.craigslist.org/search/for?format=rss&query=50%20quart%20cooler', titleFile) #50 quart cooler
    parseCraigslistRSS('https://delaware.craigslist.org/search/for?format=rss&query=60%20quart%20cooler', titleFile) #60 quart cooler
    parseCraigslistRSS('https://delaware.craigslist.org/search/for?format=rss&query=belt%20sander', titleFile) #belt sander
    titleFile.close()
