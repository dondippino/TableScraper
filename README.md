[![Coverage Status](https://coveralls.io/repos/github/dondippino/TableScraper/badge.svg?branch=master)](https://coveralls.io/github/dondippino/TableScraper?branch=master)
[![Build Status](https://travis-ci.org/dondippino/TableScraper.svg?branch=master)](https://travis-ci.org/dondippino/TableScraper)
# TableScraper
A 'very tiny' node app for extracting HTML Tables data from web pages.
The Table Scraper is a 'tiny' console app designed for scraping data from HTML tables on web pages, also for tracking changes (mutation) in data on HTML tables on web pages. The application is suitable for generating time series data, based on mutations from HTML tables.

# How to install
1. Run the following command in CMD or terminal
```git clone https://github.com/dondippino/TableScraper.git```
2. Go to the cloned directory
```cd TableScraper```
3. Install dependencies
```npm install```
4. Run the application
```npm run start```

# Get Started
1. Run the application in the terminal of your machine
```npm run start```

2. The application prompts the user, for ***url*** of the page that contains ***HTML*** table to be scraped
![]()
Write the url and press Enter.

3. The second prompt comes up and requires the user to enter the identifier of the table
![]()
The identifier is simply the id, class or any other valid ***CSS3 selector*** of the table element on the page. Write the identifier and press Enter.

4. The columns available in the table are displayed in the console along with a prompt asking to select a column, with a corresponding index number. Pick the number (index) matching a columnn that will be used to index the table, it is advised that a column containing unique data should be used. If you deceide not to select from the displayed columns, kindly enter -1 to use autoincremented values i.e. from 0,1,...(nth of last row).
![]()
Enter the number matching the selected column fromm the displayed columns, or simply enter -1 to use a serial index
At this point the data extracted from the table will be saved in the ***archive/data*** directory, if it is not already there.

5. The final prompt then asks if you wish to make this data its most recent version, it accepts a case insensitive response of ***'Y'*** or ***'N'***. If Y is entered the 'archive/current' directory is cleared of old data and the new data is saved as the current version in ***'archive/current'*** directory.
![]()