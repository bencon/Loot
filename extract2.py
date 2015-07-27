# Packages Required:
#	requests
#	BeautifulSoup
#	...

import xml.etree.cElementTree as ET
import requests
import re
from bs4 import BeautifulSoup
#from BeautifulSoup import *

r = requests.get('https://philadelphia.craigslist.org/zip/index.rss')
print r.status_code
print r.headers['content-type']

soup = BeautifulSoup(r.text, 'xml')
#print (soup.prettify())

print soup.link
#print soup
links = []
print "start"
for link in soup.find_all('link'):
	#print link
	#print link.string
	links.append(link.string)

maps = []

coords=[]
for link in links:
	r = requests.get(link)
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
							#print c
							coords.append(c)

print coords
####  Generate XML document wtih coordinate data
root = ET.Element("root")

for arr in coords:
	field = ET.SubElement(root,"loc")
	x = ET.SubElement(field,'x')
	y = ET.SubElement(field,'y')
	x.text = (str)(arr[0])
	y.text = (str)(arr[1])
	
tree = ET.ElementTree(root)
tree.write("coords.xml")

	


