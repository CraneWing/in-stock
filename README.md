# InStock (A Realtime Archival Stock Data App)

InStock is the third of Free Code Camp's full-stack challenges. A MEAN stack (MongoDB, Express, Angular, Node) is used. Users can look at line charts that show one, two or six months, year and year-to-date daily closing price data for publicly traded companies in the USA.

They can search for a company by its stock exchange symbol. If the data is available, the company is added to the list, and its stock prices added to the chart. Users also can delete stocks. Using web sockets (particularly socket.io), stock additions and deletions happen in real time.

These are the "user stories" this app must fulfill:

* I can view a graph displaying the recent trend lines for each added stock.
* I can add new stocks by their symbol name.
* I can remove stocks.
* I can see changes in real time when any other user adds or removes a stock (via web sockets).

Stock info comes from Quandl, a financial data provider. Other features are a spinner with spin.js, line chart using Chart.js, and styling using Flat UI Interface, which is built upon the popular Bootstrap styling package.
