Unfortunately I do not have a functioning demo for this app, since it is designed to work within a local network and having access to the backend server on that network. 


This project was actually built off of a seed Angular project, and there are a few relic folder/files still floating around from that project, either as useful components of the app, or non-useful garbage folders.

The important files/folders that were written by Jonathan are:

app/ -- contains important files for the overall bootstrapping and running of the app.

Directives/ -- contains custom directives used throughout the app.

lookup/lookup_API.js -- the app contains a lot of select/dropdown box UI elements, whose menus are stored in the database. This file abstracts the database connection details away.

projects/ -- contains most of the views and controllers for the app. Navigation and routing between views is mostly handled by app/nav.js 





