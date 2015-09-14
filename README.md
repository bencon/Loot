Loot
================
A work in progress to expose nearby desired Craiglist items
<br>
This project also requires a localhost webserver and I have not yet committed any of the php or bash script files that are required for the fully functional project
<br>
<br>
##### Working Features (requires additional files that I haven't yet committed):
* Via cronjob, does the following hourly:
* Aggregates any number of craigslist rss feeds to search for desired items
* holds xml database of previously found items from the rss feeds to avoid finding the same things over and over
* scans items for google map coordinates and writes them along with item description, title, and link to another xml file
* take2.html parses the coordinates xml file and passes the coordinates through google maps api functions to both map them and find the distance from your set origin
* if the item is within a specified range from your origin, pushes the information to an sql database
* sends an email with aggregate loot information
<br>
<br>

##### Todo:
* Improve this readme
* push required php and batch files for complete implementation
* ....
<br>
<br>

##### Files:
* extract2.py : run this file to extract google map coordinates from desired RSS link and put them in coords.xml
* take2.html : Navigate to this page after running extract2.py for a graphical display of found items
* helpers.js : the other half of take2.html which has most of the support gmaps 
* coords.xml : output of extract2.py
* previouslyDiscoveredLoot.xml : an xml database of already found loot so that items are not discovered multiple times, clear it if you do want them to be discovered again

