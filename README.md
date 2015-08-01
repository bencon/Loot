Loot
================
A work in progress to expose nearby desired Craiglist items
<br>
<br>
##### Todo:
* Make sure Description/Item actually match
* Allow user input of desired keywords to filter loot
* Add email on desirable item feature
* create script to run everything in succession
* create setup script to install on other systems with ease
* return map labels
* Improve web interface
* Improve this readme file
* ....
<br>
##### Files:
* extract2.py : run this file to extract google map coordinates from desired RSS link and put them in coords.xml
* take2.html : Navigate to this page after running extract2.py for a graphical display of found items
* helpers.js : the other half of take2.html which has most of the support gmaps 
* coords.xml : output of extract2.py
* previouslyDiscoveredLoot.xml : an xml database of already found loot so that items are not discovered multiple times, clear it if you do want them to be discovered again
*
*

